// Motion layer shared by film.html and film_v.html.
// Wraps the film's seek(t) and adds beat-synced motion on top of it.
// Music: 100 bpm (beat 0.6 s), drop at 14.4 s, drums out at 33.6 s.
(function () {
  const W = innerWidth, H = innerHeight, V = H > W;
  const BEAT = 0.6, DROP = 14.4, END = 33.6;
  const cl = v => Math.max(0, Math.min(1, v));
  const p = (t, a, b) => cl((t - a) / (b - a));
  const ex = v => (v = cl(v), v === 1 ? 1 : 1 - Math.pow(2, -10 * v));   // expo out
  const eio = v => (v = cl(v), v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
  const $ = id => document.getElementById(id);

  // ---------- overlays ----------
  const css = document.createElement('style');
  css.textContent = `
  #dust{position:absolute;inset:0;width:${W}px;height:${H}px;pointer-events:none}
  .ov{position:absolute;inset:0;pointer-events:none}
  #flash{background:radial-gradient(60% 60% at 50% 50%,rgba(255,236,200,1),rgba(242,179,90,.55) 45%,rgba(0,0,0,0) 80%);opacity:0;mix-blend-mode:screen}
  #ring{left:50%;top:50%;right:auto;bottom:auto;width:200px;height:200px;margin:-100px 0 0 -100px;border-radius:50%;border:3px solid rgba(252,221,166,.9);box-shadow:0 0 60px rgba(242,179,90,.8),inset 0 0 40px rgba(242,179,90,.5);opacity:0}
  #sweep{background:linear-gradient(100deg,transparent 35%,rgba(242,179,90,.16) 47%,rgba(255,240,215,.28) 50%,rgba(242,179,90,.16) 53%,transparent 65%);mix-blend-mode:screen;opacity:0}
  #vig{background:radial-gradient(120% 90% at 50% 50%,transparent 55%,rgba(0,0,0,.75) 100%)}
  .w{display:inline-block;overflow:hidden;vertical-align:top;padding:.06em .02em .16em;margin:-.06em -.02em -.16em}
  .wi{display:inline-block;will-change:transform}
  .lw{position:relative;display:inline-block}
  .sk{position:absolute;left:-2%;top:54%;height:.075em;width:104%;background:linear-gradient(90deg,#F4A73C,#FCDDA6);box-shadow:0 0 18px rgba(242,179,90,.7);transform-origin:left center;transform:scaleX(0);border-radius:4px}
  `;
  document.head.appendChild(css);
  const glow = $('glow'), fade = $('fade');
  const dust = document.createElement('canvas'); dust.id = 'dust'; dust.width = W; dust.height = H;
  glow.after(dust);
  const mk = id => { const d = document.createElement('div'); d.id = id; d.className = 'ov'; fade.before(d); return d };
  const sweep = mk('sweep'), ring = mk('ring'), flash = mk('flash'); mk('vig');
  const dx = dust.getContext('2d');

  // ---------- kinetic words ----------
  // line id -> start time (seconds, real film time), all on the beat grid
  const LINES = { a1: 4.8, a2: 5.4, f1: 9.6, f2: 10.2, f3: 12.0, b1: 15.0, b2: 15.6, c0: 21.0, d0: 27.0, e1: 33.0, e2: 33.6 };
  const words = {};
  function split(el) {
    const out = [];
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.className = 'wi'; i.textContent = tok;
            w.appendChild(i); frag.appendChild(w); out.push(i);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return out;
  }
  Object.keys(LINES).forEach(id => { const el = $(id); if (el) words[id] = split(el) });

  // strike-through on the two "Stop ..." lines
  const strikes = {};
  ['f1', 'f2'].forEach(id => {
    const el = $(id); const lw = document.createElement('span'); lw.className = 'lw';
    while (el.firstChild) lw.appendChild(el.firstChild);
    el.appendChild(lw); const sk = document.createElement('i'); sk.className = 'sk'; lw.appendChild(sk); strikes[id] = sk;
  });

  // ---------- scenes (real time) ----------
  const SC = [['s1', 0, 4.6], ['s2', 4.5, 9.6], ['s2b', 9.5, 14.45], ['s3', 14.4, 21.2], ['s4', 21.1, 27.3], ['s5', 27.2, 32.8], ['s6', 32.7, 39]];
  const CUTS = [4.8, 9.6, 21.0, 27.0, 33.0];

  const kickPulse = t => {
    if (t < DROP || t >= END + .05) return 0;
    const k = (t - DROP) % BEAT; return Math.exp(-k / .11);
  };

  // deterministic motes
  const R = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x) };
  const MOTES = Array.from({ length: V ? 140 : 170 }, (_, i) => ({ x: R(i, 1), y: R(i, 2), z: .3 + R(i, 3) * .7, ph: R(i, 4) * 6.28 }));
  function drawDust(t) {
    dx.clearRect(0, 0, W, H);
    const warp = Math.exp(-Math.pow((t - DROP + .15) / .35, 2));      // hyperspace streaks into the drop
    const speed = t < DROP ? 18 : 34;
    const cx = W / 2, cy = H / 2;
    for (const m of MOTES) {
      let x = m.x * W + Math.sin(t * .3 + m.ph) * 30 * m.z;
      let y = ((m.y * H - t * speed * m.z) % H + H) % H;
      const a = (.10 + .35 * m.z) * (t < 4 ? cl(t / 4) : 1);
      if (warp > .02) {
        const vx = x - cx, vy = y - cy, L = Math.hypot(vx, vy) || 1, len = warp * 260 * m.z;
        dx.strokeStyle = `rgba(252,221,166,${a + warp * .5})`; dx.lineWidth = 1.2 + m.z * 1.8;
        dx.beginPath(); dx.moveTo(x, y); dx.lineTo(x + vx / L * len, y + vy / L * len); dx.stroke();
      } else {
        dx.fillStyle = `rgba(242,179,90,${a})`;
        dx.beginPath(); dx.arc(x, y, .8 + m.z * 1.8, 0, 7); dx.fill();
      }
    }
  }

  const base = window.seek;
  window.seek = function (t) {
    base(t);
    const kp = kickPulse(t);

    // scene camera: zoom-through between scenes, slow push, beat punch
    SC.forEach(([id, a, b]) => {
      const el = $(id); if (t < a || t > b) return;
      const inK = ex(p(t, a, a + .7)), outK = p(t, b - .45, b);
      const push = 1 + .05 * p(t, a, b);
      const s = (.9 + .1 * inK) * (1 + .14 * outK * outK) * push * (1 + .014 * kp);
      let shake = '';
      if (t > DROP && t < DROP + .45) { const k = 1 - p(t, DROP, DROP + .45); shake = ` translate(${Math.sin(t * 90) * 9 * k}px,${Math.cos(t * 77) * 7 * k}px)`; }
      el.style.transform = `scale(${s})${shake}`;
      el.style.filter = outK > 0 ? `blur(${outK * 10}px)` : (inK < 1 ? `blur(${(1 - inK) * 6}px)` : 'none');
    });
    // hard cut into the drop: the build scene snaps away under the flash
    if (t >= DROP - .05 && t < DROP + .3) $('s2b').style.opacity = 0;

    // kinetic word reveals
    Object.entries(words).forEach(([id, ws]) => {
      const line = $(id); line.style.opacity = 1; line.style.transform = 'none'; line.style.filter = 'none';
      const t0 = LINES[id];
      ws.forEach((w, i) => {
        const k = ex(p(t, t0 + i * .07, t0 + i * .07 + .75));
        w.style.transform = `translateY(${(1 - k) * 110}%) rotate(${(1 - k) * 5}deg)`;
      });
    });

    // strike the pain points on the beat, then dim them
    const s1k = eio(p(t, 11.1, 11.4)), s2k = eio(p(t, 11.4, 11.7));
    strikes.f1.style.transform = `scaleX(${s1k})`; strikes.f2.style.transform = `scaleX(${s2k})`;
    $('f1').style.opacity = 1 - .55 * s1k; $('f2').style.opacity = 1 - .55 * s2k;

    // count-up on the first stat
    const st = document.querySelector('#b3 b'); if (st) st.textContent = Math.round(5 * ex(p(t, 16.4, 17.6)));

    // globe slams in on the drop
    if (t >= DROP && t < 21.2) {
      const k = ex(p(t, DROP, DROP + 1.4));
      $('g').style.transform = `scale(${(1.45 - .45 * k) * (1 + .012 * kp)})`;
      $('g').style.opacity = cl(k * 2);
    }

    // drop + finale flashes, shockwave ring
    const f1 = Math.exp(-Math.max(0, t - DROP) / .22) * (t >= DROP ? 1 : 0);
    const f2 = Math.exp(-Math.max(0, t - END) / .3) * (t >= END ? .45 : 0);
    const f0 = Math.exp(-Math.max(0, t - 1.9) / .35) * (t >= 1.9 ? .22 : 0);   // logo apex lights
    flash.style.opacity = Math.max(f1 * .95, f2, f0, kp * .06);
    const rk = p(t, DROP, DROP + 1.1);
    ring.style.opacity = t >= DROP && rk < 1 ? (1 - rk) * .9 : 0;
    ring.style.transform = `scale(${1 + rk * (V ? 14 : 16)})`;

    // light sweep on each cut
    let sw = 0, sx = -100;
    CUTS.forEach(c => { const k = p(t, c - .1, c + .8); if (k > 0 && k < 1) { sw = Math.sin(k * Math.PI); sx = -100 + 200 * eio(k) } });
    sweep.style.opacity = sw; sweep.style.transform = `translateX(${sx}%)`;

    // glow breathes with the kick
    glow.style.opacity = Math.min(1, (.6 + .4 * Math.sin(t * .5)) * (1 + .5 * kp));

    drawDust(t);
  };
  window.seek(0);
})();
