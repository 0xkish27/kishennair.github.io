"""The teaser's soundtrack, synthesised to the cut in timeline.json: a dark drone, a heartbeat under the seal,
a boom on the dive, whooshes on every cut, a bell on every title, and a final boom on the end card.
All original, so it is free to post anywhere.  Usage: python3 tools/teaser/score.py <out.wav>"""
import json, sys, wave, os
import numpy as np

TL = json.load(open(os.path.join(os.path.dirname(__file__), 'timeline.json')))
SR, DUR = 44100, TL['total']
N = int(SR * DUR); t = np.arange(N) / SR
rng = np.random.default_rng(118)
L = np.zeros(N); R = np.zeros(N)

def put(sig, at, gain=1., pan=0.):
    i = int(at * SR); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[:j - i] * gain; L[i:j] += s * np.sqrt((1 - pan) / 2); R[i:j] += s * np.sqrt((1 + pan) / 2)
def onepole(x, fc):
    fc = np.broadcast_to(np.asarray(fc, float), x.shape); a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); acc = 0.
    for k in range(len(x)): acc = (1 - a[k]) * x[k] + a[k] * acc; y[k] = acc
    return y
def bell(f, at, dur=5., gain=.12, pan=0.):
    n = int(dur * SR); tt = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt / (dur * d)) for m, a, d in [(1, 1, .45), (2.76, .4, .22), (5.4, .16, .1), (.5, .25, .6)])
    put(s * np.minimum(1, tt / .004), at, gain, pan)
def boom(at, gain=.9, f0=70, f1=28, dur=2.8):
    n = int(dur * SR); tt = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-tt * 3)
    put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .9), at, gain)
def crack(at, gain=.5, dur=.9):
    n = int(dur * SR); tt = np.arange(n) / SR; put(onepole(rng.standard_normal(n), 5000) * np.exp(-tt / .18), at, gain)
def riser(at, dur, gain=.3):
    n = int(dur * SR); tt = np.arange(n) / SR; put(onepole(rng.standard_normal(n), 300 + 5000 * (tt / dur) ** 2) * (tt / dur) ** 2.2, at, gain)
def whoosh(at, dur=1.4, gain=.2, pan=0.):
    n = int(dur * SR); tt = np.arange(n) / SR
    put(onepole(rng.standard_normal(n), 3500 * np.exp(-tt * 2.2) + 200) * np.sin(np.pi * np.minimum(1, tt / dur)) ** 1.5, at, gain, pan)
def heartbeat(at, gain=.6):
    for d, g in [(0, 1), (.16, .7)]:
        n = int(.35 * SR); tt = np.arange(n) / SR; put(np.sin(2 * np.pi * (55 - 20 * tt) * tt) * np.exp(-tt / .07), at + d, gain * g)

S, END = TL['starts'], TL['starts'][-1]
root = 55.; notes = [root * 2 ** (k / 12) for k in [0, 3, 5, 7, 10, 12, 15, 19]]

# the drone under everything, ducking just before the end card
dr = sum(a * np.sin(2 * np.pi * root * m * t + .6 * np.sin(2 * np.pi * (.07 + det * .05) * t)) for m, a, det in [(1, 1, 0), (1.5, .55, .4), (2, .35, -.3), (3, .18, .2), (.5, .9, 0)])
dr *= (.5 + .5 * np.sin(2 * np.pi * .11 * t) ** 2) * np.clip(t / 2.5, 0, 1) * np.clip((DUR - .1 - t) / 3.2, 0, 1)
dr *= np.where(t < S[1], .7, 1.) * np.where((t > END - .4) & (t < END), .3, 1.)
put(onepole(dr, 420), 0, .32)
put(onepole(rng.standard_normal(N), 700) * np.clip((t - S[1]) / 3, 0, 1) * np.clip((END - .3 - t) / .5, 0, 1) * .6, 0, .06)   # city air

# the seal: a heartbeat that quickens and a riser, then it breaks into the dive
for k, a in enumerate(np.arange(S[1] - 1.6, S[1] - .1, .4)): heartbeat(a, .45 + k * .1)
riser(S[1] - 1.6, 1.6, .3); crack(S[1] - .05); boom(S[1], 1.)
for i, f in enumerate([notes[0], notes[3], notes[5]]): bell(f * 4, S[1] + .05 + i * .09, 6, .1, (i - 1) * .6)
whoosh(S[1] + .1, 3.4, .3)
# a whoosh on every later cut, a bell on every title
for i, s in enumerate(S[2:-1]): whoosh(s - .4, 1.5, .18, (-.4, .4, -.2, .3)[i % 4])
for i, c in enumerate(TL['cues']): bell(notes[(2, 4, 1, 6, 5, 7)[i % 6]] * (4 if i < 2 else 2), c['t0'], gain=.12, pan=(-.3, .3)[i % 2])
# the last shot rushes into the portal; the end card lands on a boom and a chord
riser(S[-2] + 1, END - S[-2] - 1, .4); crack(END - .1, .35, 1.2)
boom(END, .9, 60, 25, 3.5); boom(END + .4, .7, 45, 22, 4.)
for i, k in enumerate([0, 2, 4, 6]): bell(notes[k] * 2, END + .45 + i * .14, 7, .085, (i - 1.5) * .4)

def verb(x, seed):
    g = np.random.default_rng(seed); n = int(2.6 * SR); ir = g.standard_normal(n) * np.exp(-np.arange(n) / SR / .75); ir[0] = 0
    size = 1 << int(np.ceil(np.log2(len(x) + n))); y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
    return y / np.max(np.abs(ir)) * .012
L, R = L + verb(L, 1) * .9, R + verb(R, 2) * .9
mix = np.stack([L, R], 1); mix /= np.max(np.abs(mix)) / .89; mix *= np.clip((DUR - t) / .4, 0, 1)[:, None]
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('score ->', sys.argv[1], f'{DUR}s')
