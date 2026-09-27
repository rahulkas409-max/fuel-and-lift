# 🏋️ Fuel & Lift

A mobile-first gym tracker, meal planner and macro mini-game arcade. **It's 100% free, with no sign-up.**
All data lives in the browser's localStorage.

## Features

**Train**
- Built-in splits: 3-Day Full Body, 4-Day Upper/Lower and 6-Day Push/Pull/Legs.
- Set-by-set logging of kg and reps, with checkboxes. Your last weight for each lift is pre-filled.
- A floating rest timer (60/90/120 s) with a progress ring, a chime and vibration.
- A GitHub-style heatmap and a session streak (up to 2 rest days in a row don't break it).

**Custom Builder**
- Add, remove and swap exercises from a library of 37.
- Change sets and reps, rename days, and drag to reorder them.
- Set each day's intensity (heavy, moderate, light or rest), or let the app work it out from the exercises.

**Meals**
- 37 high-protein recipes split into vegetarian (paneer, tofu, soya, dal) and non-veg.
- A roulette wheel for each meal slot, plus recipe cards with macros, ingredients and three method steps.

**Smart Auto-Sync**
- Daily targets come from your body weight, your goal and the day's intensity. Heavy days get +300 kcal and more carbs; rest days get −200 kcal and a recovery focus.
- Auto-Sync tries every meal combination and portion size (1–2×) to hit those targets.

**Food database**
- Search 7,279 foods by English or Hindi/regional name, e.g. *baingan*, *dahi* or *palak*.
- Each food shows calories, protein, carbs and fat, plus fibre, sugars, saturated fat, sodium, potassium, calcium, iron and vitamin C where the source provides them.
- Pick a serving or enter grams, then log the food to today's totals.

**Body-part workouts** (Train → Body-part workouts)
- 31 guided workouts in three groups:
  - Popular gym days: chest, back, shoulders, arms, legs, glutes and abs.
  - No-equipment home workouts: belly fat, waist, thighs, glutes, toned arms, shoulders and posture, double chin and face, neck, full-body HIIT.
  - Yoga: abs, Surya Namaskar, flexibility, back pain, hips and thighs, face yoga, bedtime.
- Filter by 12 body areas, by Gym, Home or Yoga, and by "For women". "For women" is on by default for women.
- Every home, yoga and face move has an animated illustration drawn in one consistent style. It shows the real start and finish position, and Surya Namaskar steps through all 12 positions. The drawings come from a small pose rig: poses in `src/data/figures.ts`, drawing code in `src/lib/figure.ts` and `src/components/workout/Figure.tsx`. Gym lifts keep their free-exercise-db photos.
- Yoga moves use their proper Sanskrit and English names.
- A guided player runs countdowns for holds and rests and has a Done button for rep moves. It keeps the screen awake and logs the finished workout to your streak.
- Plans that target one spot (belly, thighs, arms, face) explain that fat loss comes from your whole body, not one area.
- Data lives in `src/data/programs.ts`. Photos come from free-exercise-db via `scripts/fetch-exercise-media.mjs`.

**Fitso: fitness coach chat** (the "Ask Fitso" button on every screen)
- **Works free, with no API key.** A built-in coach (`src/lib/fitso-brain.ts`) answers about 60 topics:
  - Nutrition and weight: protein, calories, fat loss, belly/face/thigh fat, muscle and weight gain, meal ideas from the app's recipes, pre/post-workout food, supplements, budget protein, water, fasting/keto, cravings and alcohol.
  - Pain and injuries: knee, back and shoulder pain, and muscle soreness.
  - Training: beginner and home workouts, workout frequency, cardio and steps, abs, plateaus, results, motivation, warm-ups, yoga, women's training, sleep and workout timing.
  - Food nutrition lookup from the 7,000+ food database, and BMI with Indian cut-offs.
- It understands Hinglish (for example "pet kaise kam kare"), follows up on short questions like "and for veg?", and offers tap-to-ask follow-up suggestions. Replies are typed out naturally.
- Safety comes first: emergencies go to 112, mental health to Tele-MANAS 14416, and steroids and crash diets get a firm no.
- Answers use the member's profile, today's workout and today's meals.
- **Optional upgrade:** if `ANTHROPIC_API_KEY` is set in Vercel, Fitso automatically uses Claude (`src/app/api/fitso/route.ts`, prompt in `src/lib/fitso-prompt.ts`) and falls back to the built-in coach if that fails.

**Streak leaderboard** (Home → Streak leaderboard)
- A 1-2-3 podium with medals, plus places 4–20, on three boards: current streak, longest streak, and this week (resets every Monday).
- Joining is optional. Only the name and town you type are shown, and you can leave any time. The device keeps a private ID and the server stores only a hash of it.
- It needs a free Upstash Redis database. In Vercel, open the project, go to **Storage → Create → Upstash for Redis (free)**, connect it to this project, then redeploy. That adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`; `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` also work. Until then the board says "opens soon".

**Gym finder (India)**
- Finds nearby gyms automatically. It guesses the city from Vercel's IP headers with no prompt, or uses GPS if you tap "Use my exact location".
- Your location shows the actual town you're in (from 1,549 Indian towns and cities with gyms). You can also search for any of them under "Change".
- Filters: women only, men only, unisex, distance, nearest, top rated, budget.
- Flip cards show distance, rating, open now, an estimated monthly price, what the gym offers, and Call and Directions buttons.
- **Built-in open data:** 35,418 unique gyms and fitness studios (duplicate listings merged) across India from [Overture Maps](https://overturemaps.org) (release in `data/gyms/meta.json`, licence in `data/gyms/LICENSE.txt`). About 87% have phone numbers.
  - Refresh the data with `python scripts/fetch-gyms-overture.py <release>`. It needs `pip install pyarrow`.
- If nothing is bundled for an area, the app falls back to live OpenStreetMap.
- If `GOOGLE_MAPS_API_KEY` is set, it uses Google Places instead, which adds ratings and opening hours.
- Price estimates depend on town size (how many gyms are within 10 km), gym style (CrossFit, studio, premium club, traditional akhada and so on), whether the gym has a website, and whether it's in a busy central area or on the outskirts. Known chains use their typical prices. Each card is tagged Budget, Standard or Premium.
- Prices and women/men-only status are estimates. The app labels them that way.

**Fitness News**
- Indian fitness headlines, grouped into Top stories, Competitions, Influencers, Diet & nutrition and Athletes.
- Tap an Indian fitness creator to see news about them.
- Tap a story to open a readable view with a "Read full story" link to the publisher.
- Headlines come from Google News RSS (India edition), cached for 30 minutes (`/api/news`). For a commercial launch, switch to a licensed news API.

**Grocery**
- "Add to Grocery List" pulls a recipe's ingredients into a checklist sorted into Produce, Protein & Dairy and Pantry.
- Tap an item to cross it off.

**Arcade**
- Macro Guessr: 18 food matchups.
- Plate Balancer: 4 challenges.
- Form Check: swipe through 12 lifting cues.

## Design

- Inspired by Google Fit and Material 3: a light theme with **Google Sans**, Google blue and green, the two progress rings, and a pill-style navigation bar.
- Dark mode follows the device setting automatically.
- Exercise photos and how-to steps come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain). Each exercise shows its start and end positions alternating like a GIF. Run `node scripts/fetch-exercise-media.mjs` to refresh them.
- Illustrations come from [unDraw](https://undraw.co) via `undraw-svg` (MIT) and are recoloured to the brand blue.
- Food and game icons are [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT), so they look the same on every device.
- The logo lives in `public/logo.svg`. Run `node scripts/build-icons.mjs` to regenerate the favicon and the iOS/Android home-screen icons.

## Food data sources

| Source | Foods | Notes |
| --- | --- | --- |
| [IFCT 2017](https://www.nin.res.in/) (ICMR–National Institute of Nutrition), via `@ifct2017/compositions` (MIT) | 542 | Lab-analysed raw Indian ingredients, with regional names and micronutrients |
| USDA FoodData Central SR Legacy + TempoLife, via `tempo-food-db` (CC-BY-4.0) | 6,494 | Global foods. *Food nutrition data from TempoLife (tempolife.app), CC-BY-4.0.* |
| Curated Indian dishes (`scripts/indian-dishes.mjs`) | 243 | Cooked dishes from every region. **These values are estimates** from standard recipes. |

The database is generated into `public/data/foods.json` (about 1.1 MB, about 215 KB gzipped) and loads only
when the search opens. To rebuild it after editing sources, run `npm run build:foods`.

## Run it

```bash
npm install
npm run dev   # http://localhost:3000
```

## The ₹9 Custom Pass (switched off)

The paywall is built in but disabled. When `NEXT_PUBLIC_ENABLE_PAYWALL=true`:

- Saving a custom routine or using Auto-Sync opens the ₹9 modal.
- `/api/razorpay/create-order` creates a 900-paise INR order.
- `/api/razorpay/verify-payment` checks the HMAC-SHA256 signature.
- The pass (7 days) is then stored in localStorage.
- If `NEXT_PUBLIC_RAZORPAY_KEY_ID` is empty, a **Simulate ₹9 Payment (Sandbox Mode)** button appears instead of real checkout.

Because the pass lives in localStorage, a tech-savvy user could grant it to themselves. For real
enforcement, store passes server-side against a user account.

## Structure

```
src/data/        workouts.ts · meals.ts · games.ts   (seed data)
src/lib/         store.ts (Zustand + persist) · nutrition.ts (targets & Auto-Sync) · date.ts · sound.ts
src/components/  workout/ · meals/ · arcade/ · paywall/ · ui/
src/app/api/razorpay/   create-order · verify-payment
```

Macros are per-serving estimates. Deploys to Vercel with default settings.
