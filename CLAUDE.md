# Arcanum

Arcanum is a self-guided, couples-first escape adventure across Kuala Lumpur. Two people book a journey, break a wax seal, then walk between free public landmarks solving riddles, locks and mini games on their phones. Every stop earns a collectible card and a letter. The letters spell a final word that opens the last lock.

Owner: Kish (Malaysia). This repo holds the clickable prototype, first exported from a Claude chat as one HTML file and now split into a Vite project. It is the starting point for the real product.

## What is in this folder

- `index.html`: the page markup. It loads `src/main.js` as a module.
- `src/`: the app, split into ES modules (see below). three.js is pinned at 0.180 (the 3D tiles library needs ≥ 0.167). `src/three/setup.js` turns off automatic colour management so colours behave as they did in r128; scenes render in linear and the world's grade pass (or the relic's ACES pass, which runs *before* bloom) does the tone mapping. Light intensities use physical units, so legacy values were multiplied by π where needed.
- `docs/plan.md`: the business plan: positioning, journeys, pricing, partner-free model, rewards.
- `README.md`: how to run, build and deploy.
- `.github/workflows/deploy.yml`: builds with Vite and publishes `dist/` to GitHub Pages on every push to `main`.

Commands: `npm run dev`, `npm run build`, `npm run preview`.

## How `src/` is organised

| File | What it does |
| --- | --- |
| `main.js` | Entry point. Boots everything in the same order as the original single file |
| `styles/main.css` | All styles |
| `lib/util.js` | `$`, `esc`, `norm`, `store` (safe localStorage) and `reduce` (prefers-reduced-motion) |
| `data/emblems.js` | Line-art SVG icons used on cards and mirrors (`EM`, `em()`) |
| `data/journeys.js` | `J`: the four journeys as data. Each has stops, and each stop has `tasks` |
| `data/cards.js` | `DECKS`, `LEG` (legendaries), `SECRETS`, `SAMPLE` leaderboard couples |
| `landing.js` | Renders the flight's chapters (opening line, one card per journey, closing view), card decks, collection, leaderboard and Keys. Every `data-open` goes through the portal dive |
| `three/landmarks.js` | `buildLandmark()` makes the glass-and-brass 3D landmark for each journey |
| `three/fog.js` | Tonight's moon phase (`phase`, `illum`) and `fogBurst()`, a pulse the 3D world flares on |
| `three/world/world.js` | **The landing page is a 3D world.** Two camera/portal sets: `REALKL` (real city) and `DRAWN` (procedural fallback). Gate (hold the 3D seal) → camera dives through clouds → scroll flies along `CAM`/`LOOK` keyframes to four portals (`PORTALS`), pausing at each chapter (`SK`/`UK` map scroll to flight). Touching a portal or any Begin button dives through it (`dive()`), then opens the journey. Pauses rendering while the game overlay is open |
| `three/world/realcity.js` | **The real KL**: Google Photorealistic 3D Tiles via `3d-tiles-renderer`, re-lit as night by a custom shader (moonlight, crimson wall glow, synthetic lit windows, sodium street light, floodlit landmarks in `FLOODS`). Positions come from real lat/lon (`REAL`, `toLocal`). Needs `VITE_GOOGLE_MAPS_KEY` at build time (GitHub secret `GOOGLE_MAPS_KEY`); add `?tiles=proxy` to test through a proxy that injects the key. If the tiles fail, the session falls back to the drawn city (`arc-notiles`). Google's attribution is shown in `#mapCredit` and must stay visible |
| `three/world/city.js` | `KL` landmark coordinates; instanced buildings with window shader (kept below the flight path by `ceiling()`), wet reflective streets, traffic, River of Life, monorail, Bukit Bintang screens, Saloma Link, beacons and motes |
| `three/world/skyline.js` | Petronas Twin Towers, KL Tower, Merdeka 118, Sultan Abdul Samad and Dataran Merdeka, lit by one pattern shader (`litMat`) |
| `three/world/sky.js` | Star dome with tonight's real moon phase, and two cloud layers lit red from below |
| `three/world/portals.js` | The four portal mirrors: seamless vortex shader, brass rim, light studs, orbiting shards |
| `three/world/seal.js` | The 3D wax seal at the gate: cracks open under a hold, then bursts |
| `three/world/glsl.js` | Shared noise, height fog, and the film grade (ACES, crimson shadows, vignette, aberration, grain, flash) |
| `three/relic.js` | A second three.js renderer with bloom for the landmark shown inside the game screens |
| `ui/fx.js` | `sfx`, `toast`, glow bursts, scroll reveals, card tilt, mist-in text, and the `--tx`/`--ty` CSS variables that lean `[data-tilt3d]` elements and the hero |
| `ui/motion.js` | One tilt signal (`onTilt`): the phone's gyroscope when available (asked for on the first tap, as iOS requires), the pointer otherwise. Also `haptic()` |
| `ui/ambience.js` | Generative WebAudio soundscape per journey (drone, city wind, distant bells), `swell()` on solves, `dread()` on mistakes, `chime()` when the relic is tapped. Off/on stored in `arc-sound` |
| `game/nightly.js` | Tonight's Omen (a daily rule; Full and Dark Moon override it) and the Nightly Riddle with its streak, stored in `arc-nightly`. Nightly points count towards the season score |
| `game/state.js` | `S`: one object holding the whole play session; `fresh(id)` resets it (any new per-run field must be reset there). Also the HUD timer, the running mini game's cleanup (`setCleanup`, `stopGame`) and `RES_MULT` |
| `game/collection.js` | Card HTML, the on-device collection, season standings and `saveRun()` |
| `game/shell.js` | The full-screen play overlay, top bar, HUD, `render()`, `go()`, `award()` and the route map |
| `game/views.js` | `VIEWS`: brief → book → pay → register → seal → prologue → travel → checkin → task → card → final → ending → scrapbook |
| `game/tasks.js` | `TASKS`: riddle, code, split, knowme, photo, dare, spend, blind, rate, purse, capsule, checklist, hum, simon |
| `game/minigames.js` | `GAME_TASKS` and `GAMEINIT`: lightsout, beam, catchstars, constellation, memory, scale, rhythm, tilt (The Wandering Light: tilt, drag or arrow keys; layouts in `TILT_LAYOUTS`). Canvas games register a cleanup with `setCleanup` |
| `game/flow.js` | `nextTask`, `solved`, `wrongAns`, and the single delegated click handler (`data-a` actions) |

## Engagement systems

- **Resonance:** each task solved without a hint, wrong answer or failed game raises `S.res` (0 to 4, multipliers in `RES_MULT`, up to ×2.2). Any slip calls `breakResonance()`. It drives the HUD bar, the relic's glow, bloom and spin, and the soundscape's brightness.
- **Scoring:** `award()` multiplies by the omen and resonance; `solved()` also applies the omen's mini game bonus.
- **Boons:** after the prologue the couple draws one of three face-down cards (`BOONS` in `data/cards.js`): an extra hint, one forgiven mistake, or starting resonance.
- **Omens:** see `game/nightly.js`. Effects are read from `S.omen` (`mult`, `hints`, `hintCost`, `resStep`, `forgive`, `gameMult`, `swift`).
- **Nightly Riddle:** on the landing page; streaks reward 40 to 100 season points a night.
- **Feel:** the in-game seal is press-and-hold (Enter breaks it at once for keyboard users), screens surface from mist only when the step changes, and a whisper of the stop's lore fades in while travelling.

To add a stop or a challenge, edit the `J` data. A new challenge type needs an entry in `TASKS` (or `GAME_TASKS` if it is a mini game), a `case` in the click handler in `game/flow.js`, and a `GAMEINIT` entry if it uses a canvas.

## The four journeys

| Journey | Route | Landmark relic | Final word | Spend on the night |
| --- | --- | --- | --- | --- |
| The Lantern Path | Masjid Jamek / River of Life → Sultan Abdul Samad → Dataran Merdeka → Central Market → Kwai Chai Hong | Sultan Abdul Samad clock tower | LUMEN | RM 0–10 |
| The Starfall Garden | KLCC Esplanade → Lake Symphony → KLCC Park trail → park gate → Saloma Link | Petronas Twin Towers | STARS | RM 0 |
| The Feast of Riddles | Bukit Bintang → Jalan Alor → Changkat (RM 40 in-game purse) | Jalan Alor paper lantern | FEAST | Capped at RM 40 |
| The Echo Trail | Bukit Bintang → walkway buskers → Changkat | KL Tower | ECHO | RM 0–5 |

## Design direction (agreed after many rounds)

- Dark, scary, mystical escape room in KL after dark. Blood red, bone and near-black. Cormorant Garamond for display, Schibsted Grotesk for body, Newsreader italic for accents.
- Everything should feel 3D and immersive, and animations should tie back to KL (skyline, landmarks, monorail, beacons).
- The crimson wax seal and "Break the seal" are loved. Keep them.
- Rejected, do not bring back: horoscope or zodiac wheels and occult glyphs; childish effects (bouncing, pop, confetti, pixie dust, cursor comet trails, cartoon lanterns); alien or sci-fi styling; studded doors; anything styled as Malay or culturally themed (KL landmarks are fine); monospace "AI-looking" label fonts; numbered markers like 01 / 02 / STEP 01.
- Kish prefers short, direct replies and wants Claude to just proceed rather than ask clarifying questions.

## Prototype limits

- Payment, sign-in, GPS check-in and the partner's second phone are all simulated. Every screen has "Skip this step" for testing.
- The collection and season score are stored in the viewer's browser (`localStorage`). The leaderboard couples are sample data.
- The world renders the whole city with bloom. On phones it uses fewer buildings and cars and a lower pixel ratio (`low` in `world.js` and `city.js`); tune those first if a device struggles. Without WebGL the chapters fall back to a plain stacked page.
- The gate shows once per browser session (`arc-entered` in sessionStorage).

## Suggested next steps

1. Done: split into a Vite project with three.js from npm.
2. Turn it into a PWA so people can add it to their home screen.
3. Backend: Supabase for accounts (Google and phone OTP), sessions, photos (Storage), collection and the season leaderboard.
4. Payments through a Malaysian gateway: Billplz, ToyyibPay or iPay88 (FPX, DuitNow QR, Touch 'n Go, cards).
5. Real GPS check-ins with a radius per stop, and a real two-phone mode for split clues (Supabase Realtime).
6. Malaysia PDPA: privacy notice, photo consent, delete-account flow.

## Testing

Headless Chromium with `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist` renders the WebGL layers. Swiftshader runs at a few frames per second, so wait several seconds after scrolling before a screenshot, and set `sessionStorage['arc-entered']='1'` (via an init script) to skip the gate in gameplay tests.
