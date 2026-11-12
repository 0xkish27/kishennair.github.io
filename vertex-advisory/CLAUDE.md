# Vertex Advisory

The Web3 connection hub. Vertex connects projects with exchanges (Tier 1–3 CEXs, DEXs), market makers, investors/VCs, auditors, KOLs, launchpads, blockchains and event teams through warm, vetted intros. Free to join. Founder: Kishen, based in Asia (Malaysia).

## Business model (keep the site consistent with this)
- **Free for projects.** Partners (exchanges, market makers etc.) cover a success fee when a deal closes through Vertex. Projects never pay more because of it. This is disclosed on the site ("How we earn").
- **Starting focus:** projects that need the right exchange or market maker. Other audiences are shown as "also in the network".
- **Secondary revenue:** consulting programs (Readiness Review, Listing Program, Market Entry, Partner Retainer) and custom services (Custom TGE Plan $70, MM Contract Review $40, Pitch Deck Review $25).
- **Partner Program:** Scout (up to 30%), Closer (up to 50%), Connector (bonus on a new partner's deals for 6 months). Shares are released only after Vertex's fee is received. Written terms, code of conduct.
- **Intro rules:** apply-based, limited intros per week, reply within 2 business days, every intro made in a shared chat/email so there's a written record.
- Not an agency: no retainers, no guarantees, works for every side of the deal.

## Copy rules (strict)
- Never use the word **"paid"** publicly. Say "cover a fee", "fee reaches us", "on success".
- No "AI" wording anywhere. Everything is done "by our team", custom, by hand.
- Never use "collaboration". Avoid em dashes in copy.
- No overclaims: no "117 hubs", no "24/7", no "guaranteed", no "several exchanges compete for you". Use "compare more than one", "connected across every corner of Web3".
- Short, punchy, consulting-style hooks (reference: consulting.com). If copy gets long, cut it.
- CTA wording: **"Apply for an intro"** (not "Request").
- No memecoin-specific content.

## Design system
- Single dark look. Background `#000`, surfaces `#0B0B0C` / `#141416`, lines `#232326` / `#2F2F33`, text `#FFF`, muted `#8B8B93`.
- Accent gold `#F2B35A`, gradient `#F4A73C → #F8C373 → #FCDDA6` (buttons). Green `#3DDC97` only for the LIVE badge.
- Fonts: **Newsreader** (all h1/h2/h3, weight 400; italic 300 only via `em.it`, always on its own line, never mixed on one line) and **Schibsted Grotesk** for everything else.
- **Type scale** (tokens at the end of the `<style>` block in `site/index.html`, edit there, never per component): hero `--t-hero` 44→84px, section h2 `--t-h2` 36→60px, sub h2 `--t-h2s`, card h3 `--t-h3` 22→26px, lead `--t-lead` 17→19px, body 16px, small 14px, labels 12px Schibsted 600 uppercase +0.1em (every eyebrow, kicker, date, crumb, tag), stats `--t-num` Schibsted 700. No inline font sizes; use `.t-lead`, `.t-sm`, `.t-xs`.
- Never use monospace "AI-looking" fonts (e.g. Martian Mono) or numbered markers (01/02/03, STEP 01). No ✦ symbols.
- Italic headlines are used sparingly (e.g. "Who do you need to meet?", "Meet them in person. Before you land.").
- Logo: **G5 "String Art"** mark (`brand/Vertex-Logo.svg`): white V arms, gold strings woven between them, gold apex point with glow. Wordmark "Vertex" in Newsreader + small "advisory".

## Performance rules (the globe must never lag)
- No `backdrop-filter` anywhere. Animate only `transform`/`opacity`.
- Globe canvas: cached sphere, batched land dots, adaptive quality, pauses offscreen, pixel cap ~1.4M, `contain:strict`.
- Globe canvas uses `touch-action:none`; touches that start off the globe scroll the page manually.
- `html,body{overflow-x:clip}` (NOT `hidden`, it breaks the sticky nav). Mobile menu is `position:fixed`.
- Must work at 390px with zero horizontal scroll. Test desktop + iPhone size after every change.

## Project structure
```
site/index.html        The whole website (single file, hash routes: #home #network #exchanges #events
                       #services #get #consulting #readiness-review #listing-program #market-entry
                       #partner-retainer #about #membership (Partner Program) #intro #join-free #apply)
brand/                 Logo SVG, profile picture, logo option pages
video/                 Video sources (HTML scenes rendered frame-by-frame with Playwright + ffmpeg)
video/renders/         Final MP4s (intro 16:9, intro 9:16, X square)
docs/LAUNCH.md         Launch checklist
```

## Home page order
Hero ("Your Direct Line to Everyone in Web3" / "Stop overpaying. Stop cold pitching." / "One warm intro. The right deal.") → globe + stats → Why we built Vertex → Pain points (9 tabs incl. Events) → Not an agency table → How we earn → Who we work with → Matchmaker → How it works → Teams → Events marquee → CTA → footer with disclaimer.

## Open TODOs
1. Domain (vertexadvisory.com planned) and email (hello@ via Cloudflare Email Routing + Gmail send-as).
2. Replace placeholders `partners@vertex.advisory` and `@vertexadvisory` with real email/Telegram.
3. Forms: set `FORMSPREE_ID` in `site/index.html` (search for it). All forms then POST to Formspree.
4. Founder photo + real LinkedIn URL (About page currently links to linkedin.com).
5. Home page is long: move the Matchmaker up (after "Why we built"), cut the "A team for everything" section, merge "How we earn" into the agency table.
6. SEO: split hash routes into real pages/URLs (e.g. Astro or Next.js static export), add meta descriptions, OG image, sitemap, analytics (GA4 or Plausible + Search Console + Clarity).
7. Case studies / partner logos once the first deals close.
