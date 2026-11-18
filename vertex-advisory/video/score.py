"""Vertex intro score: warm cinematic electronic, D major, 100 bpm, 39 s.
Timed to film.html / film_v.html:
  0-4.8   logo: pad swell
  4.8-9.6 headline: electric piano chords + sub
  9.6-14.4 "Stop overpaying": arp enters, hats, riser
  14.4    globe: beat drops (kick, clap, bass, arp with delay)
  33.6    CTA: drums out, final D major 9 pad rings out
Writes m_intro.wav and m_vert.wav (same track). Needs numpy + scipy.
"""
import numpy as np, wave
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
D = 39.0
N = int(SR * D)
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
DROP = 6 * BAR      # 14.4 s
END = 14 * BAR      # 33.6 s
rng = np.random.default_rng(7)
f = lambda m: 440 * 2 ** ((m - 69) / 12)


def bus():
    return np.zeros((N, 2))


def put(b, sig, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    n = min(len(sig), N - i)
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        b[i:i + n, 0] += sig[:n] * g * l
        b[i:i + n, 1] += sig[:n] * g * r
    else:
        b[i:i + n] += sig[:n] * g


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x, axis=0)


def adsr(n, a, d, s, r):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((dur - t) / max(r, 1e-4), 0, 1)
    return e * rel


# ---------- instruments ----------
def pad_note(m, dur, bright):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for det in (-0.09, 0.0, 0.08):
        fr = f(m) * 2 ** (det / 12)
        out += 2 * ((t * fr + rng.random()) % 1) - 1
    out = lp(out / 3, bright, 2)
    return out * adsr(n, 1.4, 1.0, 0.85, 1.6)


def ep(m, dur, vel=1.0):
    """Soft FM electric piano."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = f(m)
    idx = 0.5 * vel * np.exp(-t * 6)
    tone = np.sin(2 * np.pi * fr * t + idx * np.sin(2 * np.pi * fr * t))
    tone += 0.12 * np.sin(2 * np.pi * fr * 2 * t) * np.exp(-t * 8)
    tone = lp(tone, 2200)
    return tone * np.exp(-t * 1.8) * np.minimum(1, t / 0.004) * vel


def pluck(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = f(m)
    saw = 2 * ((t * fr) % 1) - 1
    sq = np.sign(np.sin(2 * np.pi * fr * 1.002 * t))
    x = 0.6 * saw + 0.4 * sq
    # decaying filter: approximate with two filtered copies crossfaded
    bright = lp(x, 6000)
    dark = lp(x, 1400)
    k = np.exp(-t * 9)
    return (bright * k + dark * (1 - k)) * np.exp(-t * 5.5) * np.minimum(1, t / 0.002)


def sub(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f(m) * t)
    s = np.tanh(1.6 * s) / np.tanh(1.6)
    return lp(s, 260) * adsr(n, 0.01, 0.3, 0.8, 0.08)


def kick():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    fr = 45 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    body = np.sin(ph) * np.exp(-t * 7)
    click = lp(rng.standard_normal(n), 4000) * np.exp(-t * 300) * 0.3
    return np.tanh(1.4 * (body + click))


def clap():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    env = np.zeros(n)
    for o in (0, 0.011, 0.022):
        tt = np.clip(t - o, 0, None)
        env = np.maximum(env, (t >= o) * np.exp(-tt * 60))
    env = np.maximum(env, np.exp(-t * 14) * 0.35)
    x = sosfilt(butter(2, [900, 5000], 'band', fs=SR, output='sos'), nz)
    return x * env


def hat(open_=False):
    n = int((0.25 if open_ else 0.07) * SR)
    t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 7000)
    return x * np.exp(-t * (14 if open_ else 70))


def shaker():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    x = sosfilt(butter(2, [5000, 11000], 'band', fs=SR, output='sos'), rng.standard_normal(n))
    return x * np.sin(np.pi * t / (n / SR)) ** 2


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    k = (t / dur) ** 2.2
    nz = rng.standard_normal(n)
    lo, hi = lp(nz, 900), hp(nz, 2500)
    x = lo * (1 - k) + hi * k
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * k) / SR) * 0.15
    return (x * 0.5 + tone) * k


def impact():
    n = int(4 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.6)
    air = hp(rng.standard_normal(n), 3000) * np.exp(-t * 1.8) * 0.12
    return boom + air


# ---------- effects ----------
def reverb(x, secs=3.2, decay=0.75, tone=5200):
    n = int(secs * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t / decay)[:, None]
    ir = lp(ir, tone)
    ir[: int(0.012 * SR)] = 0          # pre-delay
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    out = np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], 1)
    return out


def pingpong(x, d, fb=0.42, taps=6, tone=3500):
    out = np.zeros_like(x)
    k = int(d * SR)
    src = lp(x, tone)
    g = 1.0
    for i in range(1, taps + 1):
        g *= fb
        sh = k * i
        if sh >= N:
            break
        ch = i % 2
        out[sh:, ch] += src[:N - sh, 0 if ch else 1] * g + src[:N - sh, ch] * g * 0.3
    return out


# ---------- arrangement ----------
# one chord per bar: Bm9 | Gmaj9 | Dmaj9 | Asus4  (loop), final Dmaj9
CH = [
    dict(root=35, pad=[62, 66, 69, 73], arp=[59, 62, 66, 69, 73, 74]),   # Bm9
    dict(root=31, pad=[59, 62, 66, 69], arp=[55, 59, 62, 66, 69, 71]),   # Gmaj9
    dict(root=38, pad=[57, 61, 64, 66], arp=[57, 61, 62, 66, 69, 73]),   # Dmaj9
    dict(root=33, pad=[57, 62, 64, 71], arp=[57, 62, 64, 69, 71, 74]),   # Asus4
]
FINAL = dict(root=38, pad=[50, 57, 61, 64, 66, 69], arp=[62, 66, 69, 73, 76, 78])

pads, keys, arps, bass, drums, fx = (bus() for _ in range(6))
kicks = []

nbars = int(np.ceil(D / BAR))
for b in range(nbars):
    a = b * BAR
    c = FINAL if a >= END else CH[b % 4]
    final = a >= END
    # pads all the way, opening the filter as the film builds
    bright = 900 if b < 2 else 1500 if b < 4 else 2200 if b < 6 else 3000
    if final:
        bright = 2600
    if not final or a == END:
        dur = (D - a) if final else BAR + 0.9
        for i, m in enumerate(c['pad']):
            put(pads, pad_note(m, dur, bright), a, 0.10, -0.5 + i * (1 / max(1, len(c['pad']) - 1)))
    if final:
        continue
    # electric piano chords from bar 2
    if b >= 2:
        for hit, vel in ((0, 0.9), (BEAT * 2.5, 0.55)):
            for i, m in enumerate(c['pad']):
                put(keys, ep(m, 2.4, vel), a + hit + i * 0.012, 0.16, -0.3 + i * 0.2)
    # sub bass from bar 2, eighth-note pulse after the drop
    if b >= 2:
        if a < DROP:
            put(bass, sub(c['root'] + 12, BAR * 0.95), a, 0.12)
        else:
            for q in range(8):
                put(bass, sub(c['root'] + 12, BEAT * 0.46), a + q * BEAT / 2, 0.17 if q % 2 == 0 else 0.12)
    # arp: 16ths from bar 4 (soft) and full after the drop
    if b >= 4:
        pat = [0, 2, 4, 1, 3, 5, 2, 4, 0, 3, 5, 2, 4, 1, 3, 5]
        g = 0.12 if a < DROP else 0.2
        for s, ix in enumerate(pat):
            put(arps, pluck(c['arp'][ix] + 12, 0.5), a + s * BEAT / 4, g * (1 if s % 4 == 0 else 0.75), np.sin(s * 0.9) * 0.45)
    # drums
    if b >= 4 and a < DROP:
        for s in range(16):
            if b == 5 or s % 2 == 0:
                put(drums, shaker(), a + s * BEAT / 4, 0.09 + 0.06 * (b == 5) * (s / 16), np.sin(s) * 0.5)
    if a >= DROP:
        for q in range(4):
            tt = a + q * BEAT
            put(drums, kick(), tt, 0.24)
            kicks.append(tt)
            if q in (1, 3):
                put(drums, clap(), tt, 0.22)
            put(drums, hat(open_=True), tt + BEAT / 2, 0.16, 0.3)
            for s in (1, 3):
                put(drums, hat(), tt + s * BEAT / 4, 0.11, -0.3)
        if b == 13:   # little fill into the CTA resolve
            for s in range(8):
                put(drums, clap(), a + BAR - BEAT * 2 + s * BEAT / 4, 0.05 + 0.012 * s)

# moments
put(fx, riser(BAR * 1.5), DROP - BAR * 1.5, 0.22)
put(fx, impact(), DROP, 0.35)
put(fx, impact(), END, 0.22)

# sidechain pump on pads, keys and bass after the drop
t = np.arange(N) / SR
duck = np.ones(N)
for k in kicks:
    i = int(k * SR)
    seg = t[i:i + int(0.5 * SR)] - k
    duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], 1 - 0.55 * np.exp(-seg / 0.11))
duck = duck[:, None]

pads = hp(pads, 160)
dry = pads * duck + keys * (0.6 + 0.4 * duck) + bass * duck + arps + drums + fx
send = pads * 0.5 + keys * 0.5 + arps * 0.35 + fx * 0.3 + drums * 0.08
mix = dry + reverb(send) * 0.55 + pingpong(arps, BEAT * 0.75) * 0.6
mix = hp(mix, 28)
mix = mix + hp(mix, 3000) * 0.5   # presence / air

# master: gentle glue, soft clip, fades, normalise
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(1.5 * mix) / np.tanh(1.5)
env = np.minimum(1, np.minimum(t / 0.6, (D - t) / 3.5)).clip(0)
mix *= env[:, None]
mix /= np.abs(mix).max() / 0.89


def write(name, x):
    w = wave.open(name, 'wb')
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((x * 32767).astype('<i2').tobytes())
    w.close()


write('m_intro.wav', mix)
write('m_vert.wav', mix)
for lbl, a_, b_ in (('intro', 0, 4.8), ('headline', 4.8, 9.6), ('build', 9.6, 14.4), ('drop', 14.4, 33.6), ('end', 33.6, 39)):
    seg = mix[int(a_ * SR):int(b_ * SR)]
    print(f'{lbl:9s} rms {20*np.log10(np.sqrt((seg**2).mean())+1e-9):6.1f} dB')
