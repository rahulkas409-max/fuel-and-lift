// Renders public/logo.svg into favicons and home-screen icons. Run: node scripts/build-icons.mjs
import fs from "node:fs";
import sharp from "sharp";

const logo = fs.readFileSync("public/logo.svg", "utf8");
// Square, full-bleed tile (the OS rounds the corners). `scale` shrinks the artwork to fit a safe zone.
const square = (scale = 1) =>
  logo
    .replace('rx="15"', 'rx="0"')
    .replace(/(<path fill="#fff"[\s\S]*<\/g>)/, `<g transform="translate(32 32) scale(${scale}) translate(-32 -32)">$1</g>`);
const render = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

const out = [
  ["src/app/apple-icon.png", square(), 180], // iOS rounds the corners itself
  ["public/icons/icon-192.png", logo, 192],
  ["public/icons/icon-512.png", logo, 512],
  ["public/icons/maskable-512.png", square(0.82), 512], // safe zone for Android adaptive icons
];
for (const [file, svg, size] of out) fs.writeFileSync(file, await render(svg, size));
fs.copyFileSync("public/logo.svg", "src/app/icon.svg");
console.log("icons written:", out.map((o) => o[0]).join(", "), "+ src/app/icon.svg");
