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

**Gym finder (India)**
- Finds nearby gyms automatically. It guesses the city from Vercel's IP headers with no prompt, or uses GPS if you tap "Use my exact location".
- Filters: women only, men only, unisex, distance, nearest, top rated, budget.
- Flip cards show distance, rating, open now, an estimated monthly price, what the gym offers, and Call and Directions buttons.
- Data comes from Google Places when `GOOGLE_MAPS_API_KEY` is set. Otherwise it uses OpenStreetMap, which is free but has patchier coverage and no ratings.
- Prices and women/men-only status are estimates. The app labels them that way.

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
