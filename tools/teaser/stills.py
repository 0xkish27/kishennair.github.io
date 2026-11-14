"""Turns still images into moving shots: a smooth sub-pixel camera move on each still (push, tilt, or a dive into
a point that flares to white), with drifting mist and rising embers screen-blended on top.
Usage: python3 tools/teaser/stills.py <imagesDir with 1.* 2.* ...> <outClipsDir>"""
import json, os, glob, subprocess, sys
import numpy as np
from PIL import Image

TL = json.load(open(os.path.join(os.path.dirname(__file__), 'timeline.json')))
src, out = sys.argv[1:3]; os.makedirs(out, exist_ok=True)
W, H, FPS = 1080, 1920, TL['fps']
HERE = os.path.dirname(os.path.abspath(__file__))
ease = lambda k: k * k * (3 - 2 * k)

def shot(img, d, move):
    """move: (z0, z1, cx0, cy0, cx1, cy1, kind) — zoom and focus centre (0..1 of the image) at start and end."""
    z0, z1, cx0, cy0, cx1, cy1, kind = move
    iw, ih = img.size; n = int(round(d * FPS)); frames = []
    base = min(iw / W, ih / H)                       # the crop at zoom 1 fills the frame
    for f in range(n):
        k = f / max(1, n - 1)
        e = k ** 2.6 if kind == 'dive' else ease(k)
        z = z0 * (z1 / z0) ** e
        cx, cy = cx0 + (cx1 - cx0) * e, cy0 + (cy1 - cy0) * e
        cw, ch = W * base / z, H * base / z
        x0 = min(max(cx * iw - cw / 2, 0), iw - cw); y0 = min(max(cy * ih - ch / 2, 0), ih - ch)
        fr = img.transform((W, H), Image.EXTENT, (x0, y0, x0 + cw, y0 + ch), Image.BICUBIC)
        if kind == 'dive':                           # the portal swallows the camera: flare to white at the end
            a = np.asarray(fr).astype(np.float32); w = max(0., (k - .55) / .45) ** 1.8
            yy, xx = np.mgrid[0:H, 0:W]; core = np.exp(-(((xx - W / 2) / (W * .45)) ** 2 + ((yy - H / 2) / (H * .35)) ** 2))
            a = a + (255 - a) * np.clip(w * (.35 + .65 * core) * 1.3, 0, 1)[..., None]
            fr = Image.fromarray(a.clip(0, 255).astype(np.uint8))
        frames.append(fr)
    return frames

# per-shot camera moves, matched to what each image shows
MOVES = TL.get('moves') or [[1.0, 1.14, .5, .45, .5, .47, 'push']] * len(TL['shots'])
for i, d in enumerate(TL['shots']):
    m = sorted(glob.glob(os.path.join(src, f'{TL.get("images", list(range(1, 99)))[i]}.*')))
    if not m: sys.exit(f'missing image for shot {i + 1}')
    img = Image.open(m[0]).convert('RGB')
    frames = shot(img, d, MOVES[i])
    raw = os.path.join(out, f'_raw{i + 1}.mp4'); atm = os.path.join(out, f'_atm{i + 1}.mp4')
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p', raw], stdin=subprocess.PIPE)
    for fr in frames: p.stdin.write(fr.tobytes())
    p.stdin.close(); p.wait()
    subprocess.run([sys.executable, os.path.join(HERE, 'atmos.py'), atm, str(d), str(i + 3)], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-i', atm, '-filter_complex', '[0]format=gbrp[a];[1]format=gbrp[b];[a][b]blend=all_mode=screen:all_opacity=.85,format=yuv420p',
                    '-c:v', 'libx264', '-crf', '14', os.path.join(out, f'{i + 1}.mp4')], check=True)
    os.remove(raw); os.remove(atm)
    print(f'shot {i + 1} ({d}s) ->', os.path.join(out, f'{i + 1}.mp4'))
