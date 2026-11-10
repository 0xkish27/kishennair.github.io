# Arcanum

Arcanum is a self-guided, couples-first escape adventure across Kuala Lumpur. Two people book a journey, break a wax seal, then walk between free public landmarks solving riddles, locks and mini games on their phones. Every stop earns a collectible card and a letter. The letters spell a final word that opens the last lock.

Owner: Kish (Malaysia). This repo holds the clickable prototype, first exported from a Claude chat as one HTML file and now split into a Vite project. It is the starting point for the real product.

## What is in this folder

- `index.html`: the page markup. It loads `src/main.js` as a module.
- `src/`: the app, split into ES modules (see below). three.js r128 is installed from npm and pinned, because r128 APIs such as `outputEncoding` and `sRGBEncoding` were removed in later versions.
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
| `landing.js` | Renders the journey mirrors, card decks, collection, leaderboard and Keys; the hero seal |
| `three/landmarks.js` | `buildLandmark()` makes the glass-and-brass 3D landmark for each journey |
| `three/fog.js` | Raw WebGL fragment shader: raymarched colour-shifting fog tunnel plus the KL skyline (Petronas, KL Tower, Merdeka 118, Sultan Abdul Samad), blinking beacons and a monorail. Also tonight's moon phase |
| `three/stage.js` | One fixed three.js canvas drawn over the page with scissor viewports: the 3D wax seal that shatters, and a landmark inside each mirror |
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
- Three WebGL layers run at once, so older phones may struggle. Lower `SC` in `sizeCosmos()` (`src/three/fog.js`) or the step count in the fog shader if needed.

## Suggested next steps

1. Done: split into a Vite project with three.js from npm.
2. Turn it into a PWA so people can add it to their home screen.
3. Backend: Supabase for accounts (Google and phone OTP), sessions, photos (Storage), collection and the season leaderboard.
4. Payments through a Malaysian gateway: Billplz, ToyyibPay or iPay88 (FPX, DuitNow QR, Touch 'n Go, cards).
5. Real GPS check-ins with a radius per stop, and a real two-phone mode for split clues (Supabase Realtime).
6. Malaysia PDPA: privacy notice, photo consent, delete-account flow.

## Testing

Headless Chromium with `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist` renders the WebGL layers. Swiftshader is slow, so 3D frames can lag behind the DOM in screenshots.
