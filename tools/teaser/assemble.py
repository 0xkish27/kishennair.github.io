"""Cuts the Arcanum teaser from six clips (any size or format) using timeline.json:
conforms each to 1080x1920 at 30 fps, grades it in the Arcanum look, dissolves between shots,
overlays the title cards and the end card, and lays the synthesised score underneath.
Usage: python3 tools/teaser/assemble.py <clipsDir with 1.* .. 6.*> <workDir with cue*.png, end.png, score.wav> <out.mp4>"""
import json, os, subprocess, sys, glob

TL = json.load(open(os.path.join(os.path.dirname(__file__), 'timeline.json')))
clips_dir, work, out = sys.argv[1:4]
shots = []
for i in range(1, len(TL['shots']) + 1):
    m = sorted(glob.glob(os.path.join(clips_dir, f'{i}.*')) + glob.glob(os.path.join(clips_dir, f'{i}_*')) + glob.glob(os.path.join(clips_dir, f'shot{i}*')))
    if not m: sys.exit(f'missing clip {i} in {clips_dir}')
    shots.append(m[0])

W, H, FPS, T = 1080, 1920, TL['fps'], TL['dissolve']
GRADE = ('eq=contrast=1.07:brightness=-0.025:saturation=0.86,'
         'colorbalance=rs=0.07:gs=-0.02:bs=-0.03:rm=0.035:bm=-0.02:rh=0.015,'
         'vignette=angle=PI/4.3,noise=alls=7:allf=t+u')
# transitions: a white flash as the seal breaks into the dive, dissolves between shots, black into the end card
TRANS = TL.get('transitions') or (['fadewhite'] + ['fade'] * (len(TL['shots']) - 2) + ['fadeblack'])

args, f = ['ffmpeg', '-y', '-loglevel', 'error'], []
for s in shots: args += ['-i', s]
args += ['-loop', '1', '-framerate', str(FPS), '-t', str(TL['end']), '-i', os.path.join(work, 'end.png')]
for k, c in enumerate(TL['cues']): args += ['-loop', '1', '-framerate', str(FPS), '-t', str(TL['total']), '-i', os.path.join(work, f'cue{k}.png')]
args += ['-i', os.path.join(work, 'score.wav')]

for i, d in enumerate(TL['shots']):
    f.append(f'[{i}:v]tpad=stop_mode=clone:stop_duration=6,trim=duration={d},setpts=PTS-STARTPTS,fps={FPS},'
             f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,format=yuv420p,{GRADE}[v{i}]')
n = len(shots)
f.append(f'[{n}:v]fps={FPS},scale={W}:{H},setsar=1,format=yuv420p[v{n}]')
prev = 'v0'
for k in range(1, n + 1):
    f.append(f'[{prev}][v{k}]xfade=transition={TRANS[k - 1]}:duration={T}:offset={TL["starts"][k]}[x{k}]'); prev = f'x{k}'
for k, c in enumerate(TL['cues']):
    idx = n + 1 + k
    f.append(f'[{idx}:v]format=rgba,fade=t=in:st={c["t0"]}:d=0.55:alpha=1,fade=t=out:st={c["t1"] - 0.45}:d=0.45:alpha=1[c{k}]')
    f.append(f'[{prev}][c{k}]overlay=format=auto[o{k}]'); prev = f'o{k}'
f.append(f'[{prev}]format=yuv420p[vout]')
audio = n + 1 + len(TL['cues'])
args += ['-filter_complex', ';'.join(f), '-map', '[vout]', '-map', f'{audio}:a', '-t', str(TL['total']),
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
         '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out]
subprocess.run(args, check=True)
print('teaser ->', out)
