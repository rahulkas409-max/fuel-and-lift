// Renders 3D mannequin demos for moves that have no real photo.
//   1. npx tsx scripts/moves3d/export-frames.ts /tmp/frames.json <ids...>
//   2. node scripts/moves3d/render.mjs /tmp/frames.json [outDir]
// Writes public/moves3d/<id>.webp (looping animation) and <id>-<n>.webp (one still per keyframe).
// Needs Playwright (global install is fine) — it drives headless Chromium's WebGL.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright")));
}

const [framesPath, outDir = "public/moves3d"] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(framesPath, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

const here = path.dirname(new URL(import.meta.url).pathname);
const threeJs = require.resolve("three").replace(/three\.cjs$/, "three.module.js");
const files = {
  "/": [`<!doctype html><html><body style="margin:0"><script type="importmap">{"imports":{"three":"/three.module.js","three/":"/"}}</script><script type="module" src="/scene.js"></script></body></html>`, "text/html"],
};
const server = http.createServer((req, res) => {
  const u = req.url.split("?")[0];
  if (files[u]) return res.writeHead(200, { "content-type": files[u][1] }).end(files[u][0]);
  const f = u === "/scene.js" ? path.join(here, "scene.js") : path.join(path.dirname(threeJs), path.basename(u));
  if (!fs.existsSync(f)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": "text/javascript" }).end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 720, height: 480 } });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.ready === true);

const png = (d) => Buffer.from(d.split(",")[1], "base64");
let bytes = 0;
for (const [id, m] of Object.entries(data)) {
  await page.evaluate(([frames, view]) => window.frameMove(frames, view), [m.frames, m.frames[0].view]);
  // Stills: one per keyframe, used for thumbnails and the Start/Finish (or Step) pictures.
  for (const [n, s] of m.stills.entries()) {
    const buf = await sharp(png(await page.evaluate((f) => window.renderPose(f), s))).webp({ quality: 82 }).toBuffer();
    fs.writeFileSync(path.join(outDir, `${id}-${n}.webp`), buf);
    bytes += buf.length;
  }
  const pngs = [];
  // Resize each frame first: resizing after the join flattens the animation.
  for (const f of m.frames) pngs.push(await sharp(png(await page.evaluate((fr) => window.renderPose(fr), f))).resize({ width: 540 }).png().toBuffer());
  const anim = await sharp(pngs, { join: { animated: true } })
    .webp({ quality: 74, effort: 5, loop: 0, delay: pngs.map(() => Math.round(1000 / m.fps)) })
    .toBuffer();
  fs.writeFileSync(path.join(outDir, `${id}.webp`), anim);
  bytes += anim.length;
  console.log(id, m.frames.length, "frames", Math.round(anim.length / 1024), "KB");
}
console.log("total", Math.round(bytes / 1024), "KB");
await browser.close();
server.close();
if (outDir === "public/moves3d") console.log("manifest:", (await import("./manifest.mjs")).writeManifest(), "moves");
