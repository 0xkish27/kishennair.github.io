# Arcanum

A couples-first escape adventure through Kuala Lumpur after dark. This is the clickable prototype, now a Vite project.

## Run it

```bash
npm install
npm run dev       # local dev server with hot reload
npm run build     # production build into dist/
npm run preview   # serve the production build
```

three.js (r128) comes from npm. Google Fonts still loads from the web.

## Try the flow

Pick any journey and press **Begin**. Every screen links to the next one, and **Skip this step** jumps ahead. Payment, sign-in and GPS are simulated. Add `#play` to the URL to jump straight into The Lantern Path.

## Deploy

Pushing to `main` builds and publishes the site with GitHub Actions (`.github/workflows/deploy.yml`). One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Working on it with Claude Code

`CLAUDE.md` gives Claude the full context: structure, design rules and next steps.
