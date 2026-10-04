// Real gym photography for the app's hero banners, from free-exercise-db
// (github.com/yuhonas/free-exercise-db, public domain / Unlicense).
// Writes public/photos/<name>.webp at 1000 px wide. Run: node scripts/fetch-hero-photos.mjs
import fs from "node:fs";
import sharp from "sharp";

const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
// name in the app → [exercise folder, frame]
const PHOTOS = {
  welcome: ["Medicine_Ball_Full_Twist", 0], // man + woman training together
  push: ["EZ-Bar_Skullcrusher", 0],
  pull: ["Suspended_Row", 0],
  legs: ["Weighted_Jump_Squat", 0],
  arms: ["Close-Grip_EZ-Bar_Curl_with_Band", 0],
  shoulders: ["Anti-Gravity_Press", 0],
  core: ["Push-Up_Wide", 0],
  strength: ["Bodyweight_Flyes", 0],
  cardio: ["Rope_Climb", 0],
  women: ["Cable_Judo_Flip", 0],
  "women-partner": ["Medicine_Ball_Chest_Pass", 0],
  "gym-floor": ["Dumbbell_Tricep_Extension_-Pronated_Grip", 0],
  ropes: ["London_Bridges", 0],
};

fs.mkdirSync("public/photos", { recursive: true });
let bytes = 0;
for (const [name, [id, frame]] of Object.entries(PHOTOS)) {
  const res = await fetch(`${BASE}/${id}/${frame}.jpg`);
  if (!res.ok) throw new Error(`${id}: ${res.status}`);
  const buf = await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
  fs.writeFileSync(`public/photos/${name}.webp`, buf);
  bytes += buf.length;
}
console.log(Object.keys(PHOTOS).length, "photos,", Math.round(bytes / 1024), "KB");
