# Arcanum

Arcanum is a self-guided, couples-first escape adventure across Kuala Lumpur. Two people book a journey, break a wax seal, then walk between free public landmarks solving riddles, locks and mini games on their phones. Every stop earns a collectible card and a letter. The letters spell a final word that opens the last lock.

Owner: Kish (Malaysia). This folder is the clickable prototype, exported from a Claude chat. It is the starting point for the real product.

## What is in this folder

- `index.html` — the whole prototype in one file: HTML, CSS and JavaScript. Open it in a browser. It needs internet for Google Fonts and three.js from the CDN.
- `docs/plan.md` — the business plan: positioning, journeys, pricing, partner-free model, rewards.
- `README.md` — how to run it.

## How `index.html` is organised

The script is one IIFE. Sections are marked with `/* ---------------- name ---------------- */` comments, in this order:

| Section | What it does |
| --- | --- |
| emblems | Line-art SVG icons used on cards and mirrors (`EM`, `em()`) |
| journeys | `J`: the four journeys as data. Each has stops, and each stop has `tasks` |
| state | `S`: one object holding the whole play session; `fresh(id)` resets it |
| landing | Renders the journey mirrors, card decks, collection, leaderboard and Keys |
| KL landmarks | `buildLandmark()` makes the glass-and-brass 3D landmark for each journey |
| volumetric fog | Raw WebGL fragment shader: raymarched colour-shifting fog tunnel plus the KL skyline (Petronas, KL Tower, Merdeka 118, Sultan Abdul Samad), blinking beacons and a monorail |
| 3D stage | One fixed three.js canvas drawn over the page with scissor viewports: the 3D wax seal that shatters, and a landmark inside each mirror |
| 3D relics | A second three.js renderer with bloom for the landmark shown inside the game screens |
| app shell | The full-screen play overlay, top bar, HUD and `render()` |
| views | `VIEWS`: brief → book → pay → register → seal → prologue → travel → checkin → task → card → final → ending → scrapbook |
| task types | `TASKS`: riddle, code, split, knowme, photo, dare, spend, blind, rate, purse, capsule, checklist, hum, simon |
| mini games | lightsout, beam, catchstars, constellation, memory, scale, rhythm. Canvas games register a `cleanup` |
| flow helpers | `nextTask`, `solved`, `wrongAns`, the single delegated click handler (`data-a` actions) |

To add a stop or a challenge, edit the `J` data. A new challenge type needs a `TASKS` entry, an action in the click handler, and a `GAMEINIT` entry if it uses a canvas.

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
- Three WebGL layers run at once, so older phones may struggle. Lower `SC` in `sizeCosmos()` or the step count in the fog shader if needed.

## Suggested next steps

1. Split into a Vite project: `src/data/journeys.js`, `src/game/`, `src/three/` (fog, stage, relics), `src/styles/`. Install three.js from npm instead of the CDN.
2. Turn it into a PWA so people can add it to their home screen.
3. Backend: Supabase for accounts (Google and phone OTP), sessions, photos (Storage), collection and the season leaderboard.
4. Payments through a Malaysian gateway: Billplz, ToyyibPay or iPay88 (FPX, DuitNow QR, Touch 'n Go, cards).
5. Real GPS check-ins with a radius per stop, and a real two-phone mode for split clues (Supabase Realtime).
6. Malaysia PDPA: privacy notice, photo consent, delete-account flow.

## Testing

Headless Chromium with `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist` renders the WebGL layers. Swiftshader is slow, so 3D frames can lag behind the DOM in screenshots.
