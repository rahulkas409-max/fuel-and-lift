// Renders public/logo.svg into favicons and home-screen icons. Run: node scripts/build-icons.mjs
import fs from "node:fs";
import sharp from "sharp";

const logo = fs.readFileSync("public/logo.svg", "utf8").replace(/width="64" height="64"/, 'width="1024" height="1024"');
const onTile = (size, pad, bg = "#ffffff") => {
  const inner = Math.round(size * (1 - pad * 2));
  return sharp(Buffer.from(logo)).resize(inner, inner).toBuffer().then((img) =>
    sharp({ create: { width: size, height: size, channels: 4, background: bg } })
      .composite([{ input: img, gravity: "center" }])
      .png()
      .toBuffer(),
  );
};

const out = [
  ["src/app/apple-icon.png", 180, 0.1], // iOS rounds the corners itself
  ["public/icons/icon-192.png", 192, 0.08],
  ["public/icons/icon-512.png", 512, 0.08],
  ["public/icons/maskable-512.png", 512, 0.2], // safe zone for Android adaptive icons
];
for (const [file, size, pad] of out) fs.writeFileSync(file, await onTile(size, pad));
fs.copyFileSync("public/logo.svg", "src/app/icon.svg");
console.log("icons written:", out.map((o) => o[0]).join(", "), "+ src/app/icon.svg");
