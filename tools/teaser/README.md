# Teaser toolkit

Cuts the vertical Arcanum teaser from generated clips, or from still images brought to life.

**From real footage:** put the source clips in a folder (paths in `footage` in `timeline.json`, relative to it) and run
`python3 tools/teaser/footage.py footage clips` first: it trims, reframes to 9:16 (`x` = horizontal focus, `zoom` = slow push),
grades blood-red and screen-blends real embers and mist (`overlays`). The current cut uses free Mixkit clips
(Mixkit licence, commercial use, no attribution needed): KL night footage 20137, 20183, 20122, 20119, mood clips 48919 (candle),
2396 (couple), 3465 (embers), 50957 (mist), from `https://assets.mixkit.co/videos/<id>/<id>-720.mp4` (or `-1080`).

**From stills:** put images named `1.*` … `4.*` in a folder and run `python3 tools/teaser/stills.py images clips` first.
Each still gets a smooth camera move (`moves` in `timeline.json`) plus drifting mist and rising embers (`atmos.py`);
the last shot dives into the portal and flares to white. Then run the three commands below with `clips`.

1. Put the clips in a folder, named `1.mp4` … `6.mp4` (any format or size; they are reframed to 1080×1920).
2. Render the titles and score, then assemble:

```bash
mkdir -p work
python3 tools/teaser/score.py work/score.wav      # needs numpy
node tools/teaser/titles.cjs work                  # needs Playwright (renders in the site fonts)
python3 tools/teaser/assemble.py clips work arcanum-teaser.mp4   # needs ffmpeg
```

`timeline.json` holds the cut: shot lengths, dissolve length, and every title's text and timing. The score and
titles read it too, so retiming a title or shot is one edit there followed by the three commands.

| Shot | Prompt idea | Title |
| --- | --- | --- |
| 1 | Crimson wax seal with the twin towers, cracking, molten light | A seal was left for you / Break it together |
| 2 | Descending through red-lit clouds onto the KL skyline | The city you know has a second face |
| 3 | Drone glide over wet, misty KL at night | Four doors open tonight |
| 4 | Golden portal above the Sultan Abdul Samad Building | A night made for two |
| 5 | A couple walking a misty lane, a phone glowing | Only two may enter |
| 6 | Push into a silver-blue portal before the Petronas Towers, into white | (end card follows) |
