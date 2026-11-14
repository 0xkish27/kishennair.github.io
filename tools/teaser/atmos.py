"""Renders an atmosphere layer (drifting mist and rising embers on black) as a video,
to be screen-blended over a still so it never feels static.  Usage: python3 atmos.py <out.mp4> <seconds> [seed]"""
import sys, subprocess, numpy as np
out, dur = sys.argv[1], float(sys.argv[2]); seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1
W, H, FPS = 540, 960, 30; n = int(dur * FPS)
rng = np.random.default_rng(seed)
def smooth_noise(h, w, scale):
    g = rng.random((h // scale + 3, w // scale + 3))
    ys, xs = np.linspace(0, g.shape[0] - 3, h), np.linspace(0, g.shape[1] - 3, w)
    y0, x0 = ys.astype(int), xs.astype(int); fy, fx = (ys - y0)[:, None], (xs - x0)[None, :]
    fy, fx = fy * fy * (3 - 2 * fy), fx * fx * (3 - 2 * fx)
    a, b = g[y0][:, x0], g[y0][:, x0 + 1]; c, d = g[y0 + 1][:, x0], g[y0 + 1][:, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
# two mist layers, larger than the frame, that slide at different speeds
m1, m2 = smooth_noise(H * 2, W * 2, 160), smooth_noise(H * 2, W * 2, 90)
E = 70; ex, ey = rng.random(E) * W, rng.random(E) * H; ev = 14 + rng.random(E) * 30; es = .8 + rng.random(E) * 1.8; ep = rng.random(E) * 6.28
yy, xx = np.mgrid[0:H, 0:W]
p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-vf', 'scale=1080:1920', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
for f in range(n):
    t = f / FPS
    o1 = int(t * 14) % W; o2 = int(t * 26) % W
    mist = .55 * m1[H // 3:H // 3 + H, o1:o1 + W] + .45 * m2[H // 2:H // 2 + H, o2:o2 + W]
    mist = np.clip((mist - .45) * 1.8, 0, 1) ** 1.6 * (.35 + .65 * (yy / H))      # thicker low down
    img = np.stack([mist * 70, mist * 46, mist * 52], -1)
    py = (ey - ev * t) % (H + 40) - 20; px = ex + np.sin(t * .8 + ep) * 12
    for x, y, s, ph in zip(px, py, es, ep):
        x0, x1, y0, y1 = int(max(0, x - 10)), int(min(W, x + 11)), int(max(0, y - 10)), int(min(H, y + 11))
        if x1 <= x0 or y1 <= y0: continue
        d2 = (xx[y0:y1, x0:x1] - x) ** 2 + (yy[y0:y1, x0:x1] - y) ** 2
        g = np.exp(-d2 / (s * s * 2)) * (.6 + .4 * np.sin(t * 3 + ph))
        img[y0:y1, x0:x1] += g[..., None] * np.array([255, 150, 70])
    p.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
p.stdin.close(); p.wait(); print('atmosphere ->', out)
