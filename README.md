# 🏋️ Fuel & Lift

A mobile-first gym tracker, meal planner and macro mini-game arcade. **It's 100% free, with no sign-up.**
All data lives in the browser's localStorage.

## Features

**Train**
- Built-in routines: 3-Day Full Body, 4-Day Upper/Lower, 6-Day Push/Pull/Legs, plus body-part splits: 3-Day (Chest & Triceps / Back & Biceps / Legs & Shoulders), 4-Day, 5-Day Bro Split and a 4-Day Glute-Focused split.
- **Men's plans / Women's plans** toggle (starts on your own; both are one tap away). 26 plans for 2–6 days a week:
  - Men: 2-Day Full Body, 3-Day Full Body, 5×5 Strength, 3-Day PPL, 3-Day Dumbbell-Only, Beginner Machines, 3/4/5-Day Body-Part Splits, Upper/Lower, PHUL, Powerbuilding, Calisthenics, 6-Day PPL and the Arnold Split.
  - Women: 2-Day Full Body Toning, 3-Day Toned Full Body, Lower/Upper/Lower, Strength for Women, Dumbbell Toning (home), Beginner Machines, 4-Day Glute Focus, Upper/Lower Toning, 5-Day Split, Booty & Abs and the 6-Day Glute & Tone Split.
- Picking a number of days filters the plan list to plans of that length.
- A "How many days a week can you train?" card suggests the right routine for 3, 4, 5 or 6 days, separately for men and women, and explains why.
- Set-by-set logging of kg and reps, with checkboxes. Your last weight for each lift is pre-filled.
- A floating rest timer (60/90/120 s) with a progress ring, a chime and vibration.
- A GitHub-style heatmap and a session streak (up to 2 rest days in a row don't break it).

**Custom Builder**
- Add, remove and swap exercises from a library of 138. The 101 extra lifts (incline press, pec deck, T-bar row, preacher curl, hack squat, hip thrust and more) come from the public-domain free-exercise-db, via `scripts/build-exercise-library.mjs`.
- **Body-part days:** pick up to 3 parts (Chest, Back, Shoulders, Biceps, Triceps, Legs, Glutes, Hamstrings, Calves, Abs, Forearms), choose full gym or dumbbells only and beginner or experienced, and get a ready day: compound lifts first, then isolation work. Shuffle for different exercises, or build a whole 2–6 day body-part week, as a men's or women's split (`src/lib/bodypart.ts`).
- Change sets and reps, rename days, and drag to reorder them.
- Set each day's intensity (heavy, moderate, light or rest), or let the app work it out from the exercises.

**Meals**
- 72 high-protein Indian recipes split into vegetarian (paneer, tofu, soya, dal, chana, idli, dosa…) and non-veg. Every meal slot has 8–10 choices per diet.
- A roulette wheel for each meal slot, plus recipe cards with macros, ingredients and three method steps.
- **A different menu every day, no repeats in a week.** A 7-day strip lets you view and edit any day this week, and **Plan my week** fills all 7 days at once, matched to each day's training. Each new day is filled automatically. Auto-Sync, the dice and the roulette skip any meal already on another day within 7 days (the roulette greys those out). Last week's menu, and especially the same weekday last week, is avoided too, so weeks don't copy each other (`src/lib/meal-week.ts`, `planDays` in `src/lib/nutrition.ts`).

**Smart Auto-Sync**
- Daily targets come from your body weight, your goal and the day's intensity. Heavy days get +300 kcal and more carbs; rest days get −200 kcal and a recovery focus.
- Auto-Sync tries every meal combination and portion size (1–2×) to hit those targets.

**Food database**
- Search 7,279 foods by English or Hindi/regional name, e.g. *baingan*, *dahi* or *palak*.
- Each food shows calories, protein, carbs and fat, plus fibre, sugars, saturated fat, sodium, potassium, calcium, iron and vitamin C where the source provides them.
- Pick a serving or enter grams, then log the food to today's totals.

**Body-part workouts** (Train → Body-part workouts)
- 99 guided workouts (gym, home and yoga, beginner to advanced) in a **Men's** and a **Women's** library. Every body part has at least 7 workouts in each, including advanced ones. Groups:
  - Popular gym days: chest & triceps, back & biceps, shoulders, biceps, triceps, forearms, quads, hamstrings & glutes, calves, core, dumbbell-only and machine-only beginner days.
  - No-equipment home workouts: belly fat, waist, thighs, glutes, toned arms, shoulders and posture, double chin and jawline, neck, full-body HIIT.
  - Yoga: abs, Sun Salutation, flexibility, back pain, hips and thighs, bedtime.
- Filter by 12 body areas, by Gym, Home or Yoga, and by level. The library opens on your own (men's or women's).
- **Real photos and real videos, no cartoons.** 55 home and yoga moves use real start and finish photos from the public-domain free-exercise-db. Each pair was checked by eye against the move (`scripts/fetch-move-photos.mjs`). Moves with no free photo (Warrior II, Tree, Downward Dog, Sun Salutation, neck and face moves and others) show a real YouTube demo video (`src/data/move-videos.ts`). The women's library (and a woman's own routine) shows demos by women trainers for 108 moves: Yoga With Adriene for yoga, and Krissy Cela, Lita Lewis, Holly Perkins, Women's Health and others for gym and home moves. It plays in YouTube's own privacy-friendly embedded player (youtube-nocookie) only when tapped. "Watch real video demos" opens more YouTube demos (by women in the women's library). Gym lifts keep their free-exercise-db photos.
- Moves use clean, standard gym and yoga names in English (Downward Dog, Warrior II, Child's Pose).
- A guided player runs countdowns for holds and rests and has a Done button for rep moves. It keeps the screen awake and logs the finished workout to your streak.
- Plans that target one spot (belly, thighs, arms, face) explain that fat loss comes from your whole body, not one area.
- Data lives in `src/data/programs.ts`. Photos come from free-exercise-db via `scripts/fetch-exercise-media.mjs`.

**Fitso: fitness coach chat** (the "Ask Fitso" button on every screen)
- **Works free, with no API key.** A built-in coach (`src/lib/fitso-brain.ts`) answers about 60 topics:
  - Nutrition and weight: protein, calories, fat loss, belly/face/thigh fat, muscle and weight gain, meal ideas from the app's recipes, pre/post-workout food, supplements, budget protein, water, fasting/keto, cravings and alcohol.
  - Pain and injuries: knee, back and shoulder pain, and muscle soreness.
  - Training: beginner and home workouts, workout frequency, cardio and steps, abs, plateaus, results, motivation, warm-ups, yoga, women's training, sleep and workout timing.
  - Food nutrition lookup from the 7,000+ food database, and BMI with Indian cut-offs.
- **Builds plans** (`src/lib/fitso-plans.ts`):
  - **Body-part days** like "chest and triceps workout" or "leg day", with an **Add to my routine** button, and body-part splits ("5 day bro split").
  - **Workout plans**, gym or home, 2–6 days a week. It reads the goal (fat loss, muscle, strength), level, focus area (glutes, arms, abs and so on) and minutes per session from the message, e.g. "4-day gym plan for muscle gain" or "3-day home plan for glutes, 30 minutes".
  - Gym plans save straight into **Train** as your routine. Home plans have **Start Day 1/2/3** buttons that open the guided player.
  - **Meal plans** built from the app's recipes to your calorie and protein targets, with a **Use as today's plan** button. Ask for another plan to get a different combination.
  - Follow-ups like "make it 3 days" or "make it a home plan" tweak the last plan.
- About 40 extra quick answers (`src/lib/fitso-faq.ts`), e.g. eggs, ghee, milk at night, height, stamina, push-ups, pull-ups, reps and sets, being sick, smoking, hair fall, fasting (Navratri/Ramadan), squat/deadlift/bench form, soya, teens, older adults, bloating, chai. Typos like "stamna" still match.
- Food lookups understand counts, e.g. "protein in 3 eggs" or "calories in 2 roti".
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
- Headlines come from Google News RSS (India edition), with Bing News RSS as an automatic backup if Google refuses or is slow; cached for 30 minutes (`/api/news`). For a commercial launch, switch to a licensed news API.

**Grocery**
- "Add to Grocery List" pulls a recipe's ingredients into a checklist sorted into Produce, Protein & Dairy and Pantry.
- **Add this week's meals** fills any unplanned days, then adds everything for the week in one tap, with amounts totalled (e.g. "Onion 7", "Paneer 300 g"). "Today's meals only" does the same for today.
- Tap an item to cross it off.

**Arcade**
- Macro Guessr: 18 food matchups.
- Plate Balancer: 4 challenges.
- Form Check: swipe through 12 lifting cues.

## Design

- **Gym-website look**, following the patterns of the best gym websites (real photography over stock art, a clear first action above the fold, bold contrast): near-black surfaces, one loud **volt-lime accent** with dark text on it, and big condensed uppercase headlines in **Oswald** (self-hosted via `@fontsource-variable/oswald`) over Google Sans body text.
- **Real photos everywhere it matters.** Full-bleed banners with a dark gradient (`PhotoHero`) on the welcome screen, Home (a photo matched to today's workout: legs, push, pull, arms, shoulders, glutes or core), Train (the selected day and every plan card), the workout library (a women's photo in the women's library), Gyms, News and Arcade. Photos are public-domain gym photography from free-exercise-db, fetched by `node scripts/fetch-hero-photos.mjs` into `public/photos/`.
- Exercise photos and how-to steps come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain). Each exercise shows its start and end positions alternating like a GIF. Run `node scripts/fetch-exercise-media.mjs` to refresh them.
- Food and game icons are [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT), so they look the same on every device. A few empty-state illustrations come from [unDraw](https://undraw.co) (MIT).
- The logo (volt flame on a black tile) lives in `public/logo.svg`; the favicon and home-screen icons are generated from it.

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
