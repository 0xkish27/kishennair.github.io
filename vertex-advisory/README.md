# Vertex Advisory

## Open the site
Double-click `site/index.html`, or run a local server:

```
npx serve site
```

## Use with Claude Code
1. Unzip this folder.
2. In a terminal: `cd vertex-advisory` then `claude`.
3. Claude Code reads `CLAUDE.md` automatically, so it knows the brand, copy rules and TODOs.
4. Good first prompts:
   - "Work through the Open TODOs in CLAUDE.md, starting with #5."
   - "Split site/index.html into a multi-page Astro site with real URLs, keeping the design identical."
   - "Set FORMSPREE_ID to xxxxxx and test every form."

## Deploy (free)
- **Cloudflare Pages** or **Netlify**: drag the `site` folder in, then connect your domain.

## Re-render the videos
```
cd video
npm install
npx playwright install chromium
npm run music
npm run render:intro   # also render:vertical, render:x
```
Needs Node 18+, Python 3 with numpy, and ffmpeg.
