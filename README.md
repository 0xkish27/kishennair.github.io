# Arcanum

A couples-first escape adventure through Kuala Lumpur after dark. This is the clickable prototype.

## Run it

Open `index.html` in Chrome or Safari, or serve the folder:

```bash
npx serve .
```

It loads Google Fonts and three.js r128 from the CDN, so it needs internet.

## Try the flow

Pick any journey and press **Begin**. Every screen links to the next one, and **Skip this step** jumps ahead. Payment, sign-in and GPS are simulated.

## Working on it with Claude Code

Open this folder in your terminal and run `claude`. `CLAUDE.md` gives Claude the full context: structure, design rules and next steps. A good first prompt:

> Read CLAUDE.md, then split index.html into a Vite project with the same behaviour, installing three.js from npm.
