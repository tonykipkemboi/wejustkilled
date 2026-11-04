/* We Just Killed v2 — Department of Launch Homicide. Static, no backend. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RM.matches;
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const slug = (s) =>
    String(s)
      .toLowerCase()
      .replace(/["“”'’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'x';
  const norm = (s) =>
    String(s)
      .toLowerCase()
      .replace(/^the\s+/, '')
      .replace(/[^a-z0-9]/g, '');
  const fmt = (n) =>
    n >= 1e6
      ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
      : n >= 1e4
        ? Math.round(n / 1e3) + 'K'
        : n >= 1e3
          ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
          : String(n);
  const TZ = 'America/New_York';
  const fdate = (s, o = { month: 'short', day: 'numeric', year: 'numeric' }) =>
    new Date(s).toLocaleDateString('en-US', { ...o, timeZone: TZ });
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONL = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const plural = (n, w, p = w + 's') => `${n} ${n === 1 ? w : p}`;
  const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);
  const hash32 = (s) => {
    let h = 2166136261;
    for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0;
  };
  const rng = (seed) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const avSize = (u, sz) => (u ? u.replace(/_(normal|bigger|mini|200x200|400x400)(\.\w+)$/, `_${sz}$2`) : u);
  // Brand domain printed on certificates; fixed so www/preview hosts don't leak in.
  const SITE = 'wejustkilled.app';
  const pageURL = (h) => location.href.split('#')[0] + h;
  /* ---------------- security helpers ----------------
   Everything in kills.json and the URL hash is treated as untrusted. URLs are only
   accepted for the hosts we expect; anything else becomes null and is not rendered. */
  const safeURL = (u, hosts) => {
    try {
      const x = new URL(String(u));
      return x.protocol === 'https:' && hosts.includes(x.hostname) && !x.username && !x.password ? x.href : null;
    } catch {
      return null;
    }
  };
  const POST_HOSTS = ['x.com', 'twitter.com', 'www.x.com', 'www.twitter.com', 'mobile.twitter.com'];
  const IMG_HOSTS = ['pbs.twimg.com', 'abs.twimg.com'];
  const HANDLE_RE = /^\w{1,15}$/,
    ID_RE = /^\d{1,25}$/,
    DATE_RE = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/,
    MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const safeDecode = (s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  /* Inline style attributes are blocked by the Content-Security-Policy (no 'unsafe-inline'),
   so templates put per-element CSS (custom properties, delays) in data-sty and we apply it
   through the CSSOM, which CSP allows. Values are always numbers we computed. */
  const hydrate = (root) => {
    if (root.nodeType !== 1) return;
    const els = root.matches('[data-sty]')
      ? [root, ...root.querySelectorAll('[data-sty]')]
      : root.querySelectorAll('[data-sty]');
    els.forEach((el) => {
      el.dataset.sty.split(';').forEach((d) => {
        const i = d.indexOf(':');
        if (i > 0) el.style.setProperty(d.slice(0, i).trim(), d.slice(i + 1).trim());
      });
      el.removeAttribute('data-sty');
    });
  };
  /* The only two HTML sinks. Every caller builds markup from constants, esc(), slug(),
   safeURL() and encodeURIComponent(); see docs/security-review.md. */
  const setHTML = (el, html) => {
    // eslint-disable-next-line no-unsanitized/property -- central sink, callers escape
    el.innerHTML = html;
  };
  const insertHTML = (el, where, html) => {
    // eslint-disable-next-line no-unsanitized/method -- central sink, callers escape
    el.insertAdjacentHTML(where, html);
  };
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(hydrate))).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  const I = {
    heart:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.8 0 5.9 3.8 4.4 7.2C19.5 16.4 12 21 12 21z"/></svg>',
    rt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 9V7a2 2 0 012-2h11l-3-3M20 15v2a2 2 0 01-2 2H7l3 3"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    chk: '<svg class="chk" viewBox="0 0 24 24" aria-label="Verified account" role="img"><path fill="currentColor" d="M12 1l2.6 2.3 3.4-.5.9 3.3 3.1 1.5-1.3 3.2 1.3 3.2-3.1 1.5-.9 3.3-3.4-.5L12 23l-2.6-2.3-3.4.5-.9-3.3-3.1-1.5L3.3 13 2 9.8l3.1-1.5.9-3.3 3.4.5z"/><path d="M8 12.3l2.6 2.6L16.2 9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mag: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  };

  /* ---------------- sound (off by default) ----------------
   Real CC0 foley (see docs/CREDITS.md), fetched lazily: nothing is downloaded until sound is
   switched on, or until someone reaches for the light cord. A small voice pool with slight pitch and
   volume variation keeps repeated sounds from sounding mechanical. */
  const Sound = (() => {
    let on = false,
      ctx = null,
      out = null,
      armed = false;
    try {
      on = localStorage.getItem('wjk-sound') === '1';
    } catch {
      /* storage blocked: keep sound off */
    }
    // group: [files, gain, pitch spread, min gap between plays in ms]
    const G = {
      key: [['key-1', 'key-2', 'key-3'], 0.55, 0.06, 40],
      paper: [['paper-1', 'paper-2'], 0.7, 0.05, 70],
      open: [['paper-2'], 0.8, 0.04, 120],
      stamp: [['stamp'], 0.9, 0.03, 250],
      shutter: [['shutter'], 0.85, 0.03, 250],
      folder: [['folder'], 0.75, 0.04, 200],
      chain: [['chain'], 0.9, 0.04, 150],
    };
    const buf = Object.create(null),
      req = Object.create(null),
      last = Object.create(null),
      voices = [];
    let ext = null;
    const sfxExt = () =>
      (ext ||= document.createElement('audio').canPlayType('audio/webm; codecs="opus"') ? 'webm' : 'mp3');
    const ac = () => {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        out = ctx.createGain();
        out.gain.value = 0.9;
        out.connect(ctx.destination);
      }
      return ctx;
    };
    const raw = Object.create(null);
    // bytes only: safe before any user gesture (no AudioContext needed)
    const fetchRaw = (name) =>
      (raw[name] ||= fetch(`assets/sfx/${name}.${sfxExt()}`).then((r) =>
        r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status)),
      ));
    const load = (name) =>
      (req[name] ||= fetchRaw(name)
        .then((b) => new Promise((ok, no) => ac().decodeAudioData(b.slice(0), ok, no)))
        .then((b) => (buf[name] = b))
        .catch(() => null));
    const preload = (...groups) => {
      if (!armed || !ac()) return;
      (groups.length ? groups : Object.keys(G)).forEach((g) => G[g][0].forEach(load));
    };
    const start = (name, gain, spread) => {
      const c = ctx,
        b = buf[name];
      if (!c || !b) return;
      if (c.state === 'suspended') c.resume().catch(() => {});
      while (voices.length >= 6) {
        try {
          voices.shift().stop();
        } catch {
          /* already stopped */
        }
      }
      const s = c.createBufferSource(),
        g = c.createGain();
      s.buffer = b;
      s.playbackRate.value = 1 + (Math.random() * 2 - 1) * spread;
      g.gain.value = gain * (0.85 + Math.random() * 0.3);
      s.connect(g).connect(out);
      s.onended = () => voices.splice(voices.indexOf(s) >>> 0, 1);
      voices.push(s);
      s.start();
    };
    // force: play even with sound off (only used for the light cord, a direct physical gesture).
    const play = (group, { force = false, vol = 1 } = {}) => {
      if ((!on && !force) || !armed || !has(G, group)) return;
      const [files, gain, spread, gap] = G[group],
        now = performance.now();
      if (now - (last[group] || 0) < gap) return;
      last[group] = now;
      if (!ac()) return;
      const name = files[(Math.random() * files.length) | 0];
      if (buf[name]) start(name, gain * vol, spread);
      // first use: fetch, then play only if it arrives quickly enough to still feel connected
      else load(name).then((b) => b && performance.now() - now < 350 && start(name, gain * vol, spread));
    };
    // AudioContext may only start after a user gesture; until then every sound is a no-op.
    const arm = () => {
      if (armed) return;
      armed = true;
      if (on) preload();
    };
    ['pointerdown', 'keydown'].forEach((t) => addEventListener(t, arm, { capture: true, passive: true }));
    const set = (v) => {
      on = v;
      try {
        localStorage.setItem('wjk-sound', v ? '1' : '0');
      } catch {
        /* storage blocked: preference not saved */
      }
      const b = $('#sound');
      b.setAttribute('aria-pressed', v);
      b.title = v ? 'Sound is on' : 'Sound is off';
      if (v) {
        arm();
        preload();
        play('paper');
      }
    };
    return {
      play,
      prefetch: (...g) => g.forEach((k) => has(G, k) && G[k][0].forEach((n) => fetchRaw(n).catch(() => {}))),
      set,
      get on() {
        return on;
      },
    };
  })();

  /* ---------------- theme: light / dark ----------------
   theme.js (in <head>) already set data-theme before first paint; this keeps it in sync. */
  const Theme = (() => {
    const root = document.documentElement,
      mq = matchMedia('(prefers-color-scheme: light)'),
      btn = $('#lights');
    let stored = null;
    try {
      stored = localStorage.getItem('wjk-theme');
    } catch {
      /* storage blocked: follow the OS */
    }
    const get = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
    const apply = (t) => {
      root.dataset.theme = t;
      $$('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', t === 'light' ? '#ffffff' : '#11100e'));
      btn.setAttribute('aria-pressed', String(t === 'light'));
      btn.title = t === 'light' ? 'Lights are on. Pull for night shift.' : 'Lights are off. Pull for day shift.';
      Cord.redraw();
      document.dispatchEvent(new Event('wjk:theme'));
    };
    mq.addEventListener?.('change', (e) => !stored && apply(e.matches ? 'light' : 'dark'));
    const set = (t) => {
      stored = t;
      try {
        localStorage.setItem('wjk-theme', t);
      } catch {
        /* storage blocked: choice lasts for this visit */
      }
      if (!reduced()) {
        root.classList.add('theme-anim');
        clearTimeout(set.t);
        set.t = setTimeout(() => root.classList.remove('theme-anim'), 450);
      }
      apply(t);
    };
    return { get, set, init: () => apply(get()), toggle: () => set(get() === 'light' ? 'dark' : 'light') };
  })();

  /* ---------------- the light cord: a verlet rope, no libraries ----------------
   A ball chain hangs from the top-right corner. Brushing it with the pointer pushes it;
   pulling the handle (click, tap, Enter/Space, or drag down and release) toggles the lights.
   The simulation sleeps when the chain is at rest or the tab is hidden. */
  const Cord = (() => {
    const wrap = $('#cord'),
      cv = $('#cord-c'),
      btn = $('#lights'),
      x = cv.getContext('2d');
    const N = 15;
    let W = 0,
      H = 0,
      ax = 0,
      seg = 7,
      len = 0,
      dpr = 1,
      raf = 0,
      still = 0,
      drag = null,
      anim = null,
      stretch = 1,
      rect = null,
      acc = 0,
      tPrev = 0,
      awake = false;
    const P = Array.from({ length: N }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
    const small = () => innerWidth <= 560;
    const layout = () => {
      W = 96;
      H = small() ? 170 : 200;
      len = small() ? 96 : 118;
      seg = len / (N - 1);
      dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px';
      cv.style.height = H + 'px';
      ax = W - 30;
      P.forEach((p, i) => {
        p.x = p.px = ax;
        p.y = p.py = i * seg;
      });
      rect = null;
      draw();
    };
    const box = () => (rect ||= cv.getBoundingClientRect());
    const wake = () => {
      still = 0;
      if (!raf) {
        tPrev = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const damp = () => (reduced() ? 0.8 : 0.988);
    const step = () => {
      const g = 0.38,
        d = damp();
      for (let i = 1; i < N; i++) {
        const p = P[i],
          vx = (p.x - p.px) * d,
          vy = (p.y - p.py) * d;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + g;
      }
      const hand = N - 1;
      let target = null;
      if (drag) target = drag;
      else if (anim) {
        const t = Math.min(1, (performance.now() - anim.t0) / anim.dur),
          e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        target = { x: anim.x, y: anim.y0 + anim.dy * e };
        if (t >= 1) {
          anim.done?.();
          anim = null;
          target = null;
        }
      }
      if (target) {
        const dx = target.x - ax,
          dy = Math.max(10, target.y),
          dist = Math.hypot(dx, dy),
          max = len * 1.42,
          k = dist > max ? max / dist : 1;
        P[hand].x = ax + dx * k;
        P[hand].y = dy * k;
        stretch = Math.max(1, Math.min(1.42, (dist * k) / len));
      } else stretch += (1 - stretch) * 0.35;
      const rest = seg * stretch;
      for (let it = 0; it < 14; it++) {
        P[0].x = ax;
        P[0].y = 0;
        for (let i = 0; i < N - 1; i++) {
          const a = P[i],
            b = P[i + 1],
            dx = b.x - a.x,
            dy = b.y - a.y,
            dd = Math.hypot(dx, dy) || 0.001,
            diff = (dd - rest) / dd;
          // inverse masses: the anchor is fixed, the handle is heavier, a held handle is pinned
          const wa = i === 0 ? 0 : 1,
            wb = i + 1 === hand ? (target ? 0 : 0.4) : 1,
            sum = wa + wb || 1;
          a.x += dx * diff * (wa / sum);
          a.y += dy * diff * (wa / sum);
          b.x -= dx * diff * (wb / sum);
          b.y -= dy * diff * (wb / sum);
        }
      }
      let m = 0;
      for (let i = 1; i < N; i++) m = Math.max(m, Math.abs(P[i].x - P[i].px) + Math.abs(P[i].y - P[i].py));
      still = m < 0.015 && !drag && !anim && Math.abs(stretch - 1) < 0.002 ? still + 1 : 0;
    };
    const ink = () => {
      const light = document.documentElement.dataset.theme === 'light';
      return light
        ? { bead: '#5c6570', hi: '#aeb6bf', bob: '#a8231b', bob2: '#d0483d', glow: 'rgba(0,0,0,0)' }
        : { bead: '#a48c5d', hi: '#e4cf9c', bob: '#c9b48a', bob2: '#f3e6c4', glow: 'rgba(0,0,0,.45)' };
    };
    const draw = () => {
      const c = ink();
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, W, H);
      // ball chain: beads spaced along the polyline
      let carry = 0;
      const gap = 4.6;
      x.fillStyle = c.bead;
      for (let i = 0; i < N - 1; i++) {
        const a = P[i],
          b = P[i + 1],
          L = Math.hypot(b.x - a.x, b.y - a.y);
        for (let t = carry; t < L; t += gap) {
          const k = t / L;
          x.beginPath();
          x.arc(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 1.55, 0, 7);
          x.fill();
        }
        carry = (carry - L) % gap;
        if (carry < 0) carry += gap;
      }
      // pull bob, oriented along the last link
      const a = P[N - 2],
        b = P[N - 1],
        ang = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
      x.save();
      x.translate(b.x, b.y);
      x.rotate(ang);
      x.shadowColor = c.glow;
      x.shadowBlur = 6;
      x.shadowOffsetY = 2;
      const gr = x.createLinearGradient(-6, 0, 6, 0);
      gr.addColorStop(0, c.bob);
      gr.addColorStop(0.45, c.bob2);
      gr.addColorStop(1, c.bob);
      x.fillStyle = gr;
      x.beginPath();
      x.moveTo(0, 0);
      x.bezierCurveTo(5, 3, 7, 13, 6, 18);
      x.quadraticCurveTo(0, 25, -6, 18);
      x.bezierCurveTo(-7, 13, -5, 3, 0, 0);
      x.fill();
      x.restore();
      btn.style.transform = `translate3d(${(b.x - 22).toFixed(1)}px,${(b.y - 10).toFixed(1)}px,0)`;
      wrap.classList.toggle('armed', !!drag && drag.y > len + 30);
    };
    const tick = (t) => {
      acc += Math.min(50, t - tPrev);
      tPrev = t;
      while (acc >= 1000 / 60) {
        step();
        acc -= 1000 / 60;
      }
      draw();
      raf = still > 45 ? 0 : requestAnimationFrame(tick);
    };
    const toggle = () => {
      Sound.play('chain', { force: true, vol: Sound.on ? 1 : 0.55 });
      Theme.toggle();
    };
    // a click, tap or key press pulls the cord down and lets go; the theme flips at the bottom
    const pull = () => {
      if (anim) return;
      const h = P[N - 1];
      anim = { t0: performance.now(), dur: reduced() ? 90 : 150, x: h.x, y0: h.y, dy: 34, done: toggle };
      wake();
    };
    let downAt = null,
      skipClick = false;
    btn.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      Sound.prefetch('chain');
      const r = box();
      downAt = {
        x: e.clientX,
        y: e.clientY,
        ox: P[N - 1].x - (e.clientX - r.left),
        oy: P[N - 1].y - (e.clientY - r.top),
      };
      btn.setPointerCapture(e.pointerId);
    });
    btn.addEventListener('pointermove', (e) => {
      if (!downAt) return;
      const r = box();
      if (!drag && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 5) return;
      drag = { x: e.clientX - r.left + downAt.ox, y: e.clientY - r.top + downAt.oy };
      wake();
    });
    const up = () => {
      if (!downAt) return;
      downAt = null;
      if (drag) {
        skipClick = true;
        const pulled = drag.y > len + 30;
        drag = null;
        if (pulled) toggle();
        wake();
      }
    };
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', () => {
      downAt = null;
      drag = null;
      wake();
    });
    // click covers mouse, touch and keyboard (Enter/Space on a <button>)
    btn.addEventListener('click', () => {
      if (skipClick) {
        skipClick = false;
        return;
      }
      pull();
    });
    btn.addEventListener('pointerenter', () => Sound.prefetch('chain'));
    btn.addEventListener('focus', () => Sound.prefetch('chain'));
    // brushing: pointer movement near the chain nudges the beads it passes
    let last = null;
    const brush = (cx, cy) => {
      if (reduced() || drag) return;
      const r = box(),
        lx = cx - r.left,
        ly = cy - r.top;
      if (lx < -20 || ly < -10 || lx > W + 20 || ly > H + 20) {
        last = null;
        return;
      }
      if (last) {
        const dx = lx - last.x,
          dy = ly - last.y;
        let hit = false;
        for (let i = 1; i < N; i++) {
          const p = P[i],
            d = Math.hypot(p.x - lx, p.y - ly);
          if (d < 16) {
            const f = (1 - d / 16) * 0.55;
            p.px -= dx * f;
            p.py -= dy * f * 0.4;
            hit = true;
          }
        }
        if (hit) wake();
      }
      last = { x: lx, y: ly };
    };
    addEventListener('pointermove', (e) => e.pointerType === 'mouse' && brush(e.clientX, e.clientY), { passive: true });
    addEventListener(
      'touchmove',
      (e) => {
        const t = e.touches[0];
        if (t) brush(t.clientX, t.clientY);
      },
      { passive: true },
    );
    addEventListener('touchend', () => (last = null), { passive: true });
    let rz;
    addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(layout, 120);
    });
    // a little sway on load so people notice it (skipped with reduced motion)
    const init = () => {
      layout();
      if (!reduced()) {
        P[N - 1].px += 6;
        P[N - 2].px += 3;
        wake();
      }
      awake = true;
    };
    return {
      init,
      pull,
      redraw: () => awake && (still ? wake() : draw()),
      _state: () => ({ resting: !raf, points: P.map((p) => [+p.x.toFixed(1), +p.y.toFixed(1)]) }),
    };
  })();
  Theme.init();
  Cord.init();

  /* ---------------- data ---------------- */
  const loadData = async () => {
    try {
      const r = await fetch('kills.json', { cache: 'no-cache' });
      if (!r.ok) throw 0;
      return await r.json();
    } catch {
      return new Promise((res, rej) => {
        if (window.WJK) return res(window.WJK);
        const s = document.createElement('script');
        s.src = 'data.js';
        s.onload = () => res(window.WJK);
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
  };
  // Self-hosted logos (scripts/fetch_logos.py). Paths are validated so the file can only point at assets/logos/.
  let LOGO = { victims: Object.create(null), killers: Object.create(null) };
  const LOGO_RE = /^(k\/)?[a-z0-9_-]{1,60}\.webp$/;
  const loadLogos = () =>
    fetch('assets/logos/logos.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const pick = (o, val) => {
          const m = Object.create(null);
          if (o && typeof o === 'object')
            for (const [k, v] of Object.entries(o)) {
              const f = val(v);
              if (typeof f === 'string' && LOGO_RE.test(f)) m[String(k)] = 'assets/logos/' + f;
            }
          return m;
        };
        LOGO = { victims: pick(j?.victims, (v) => v?.file), killers: pick(j?.killers, (v) => v) };
      })
      .catch(() => {});
  const vstat = (k) => {
    const v = k.verification;
    if (!v || typeof v !== 'object') return {};
    return { s: String(v.status ?? v.verdict ?? v.label ?? '').toLowerCase(), c: v.confidence };
  };
  const isRejected = (k) => /reject|remove|exclude|false|invalid|not[_ -]?a[_ -]?kill|drop/.test(vstat(k).s || '');
  const isConfirmed = (k) => {
    const { s, c } = vstat(k);
    if (!s) return false;
    const high =
      typeof c === 'number'
        ? c >= 0.8
        : /high|strong|certain/.test(String(c ?? '').toLowerCase()) || (c == null && /confirmed/.test(s));
    return (
      /confirm|correct|verified|valid|keep|accept|true|genuine|pass/.test(s) && !/un|not/.test(s.slice(0, 3)) && high
    );
  };

  let D,
    K,
    BR,
    V = Object.create(null),
    victims = [],
    A = Object.create(null),
    killers = [],
    byNew = [];
  const prep = (data) => {
    D = data && typeof data === 'object' ? data : {};
    BR = new Set(Array.isArray(D.meta?.brand_victims) ? D.meta.brand_victims.map(String) : []);
    K = (Array.isArray(D.kills) ? D.kills : [])
      .filter(
        (k) =>
          k &&
          typeof k === 'object' &&
          ID_RE.test(String(k.id)) &&
          HANDLE_RE.test(String(k.handle)) &&
          DATE_RE.test(String(k.created_at)) &&
          safeURL(k.url, POST_HOSTS) &&
          !isRejected(k),
      )
      .map((k) => {
        const vs = (Array.isArray(k.victims) && k.victims.length ? k.victims : [k.victim]).filter(Boolean).map(String);
        return {
          ...k,
          id: String(k.id),
          handle: String(k.handle),
          url: safeURL(k.url, POST_HOSTS),
          avatar: safeURL(k.avatar, IMG_HOSTS),
          image: safeURL(k.image, IMG_HOSTS),
          killer: k.killer ? String(k.killer) : null,
          verified: !!k.verified,
          victims: vs.length ? vs : ['Unknown'],
          text: String(k.text || ''),
          name: String(k.name || k.handle),
          likes: +k.likes || 0,
          reposts: +k.reposts || 0,
          replies: +k.replies || 0,
          views: +k.views || 0,
          quotes: +k.quotes || 0,
          conf: isConfirmed(k),
        };
      });
    const byOld = [...K].sort((a, b) => a.created_at.localeCompare(b.created_at));
    byOld.forEach((k, i) => {
      k.case = String(i + 1).padStart(4, '0');
      k.hay = (
        k.text +
        ' ' +
        k.name +
        ' ' +
        k.handle +
        ' ' +
        k.victims.join(' ') +
        ' ' +
        (k.killer || '')
      ).toLowerCase();
    });
    byNew = [...byOld].reverse();
    byOld.forEach((k) =>
      k.victims.forEach((v) => {
        const s = slug(v);
        const o = (V[s] ||= {
          name: v,
          slug: s,
          norm: norm(v),
          kills: [],
          brand: false,
          likes: 0,
          views: 0,
          killers: new Set(),
        });
        o.kills.push(k);
        o.brand ||= BR.has(v);
        o.likes += k.likes;
        o.views += k.views;
        o.killers.add(k.handle);
      }),
    );
    victims = Object.values(V).sort((a, b) => b.kills.length - a.kills.length || b.likes - a.likes);
    victims.forEach((v, i) => {
      v.rank = i + 1;
      v.first = v.kills[0];
      v.last = v.kills[v.kills.length - 1];
    });
    byOld.forEach((k) => {
      const h = k.handle.toLowerCase();
      A[h] ||= { handle: k.handle, name: k.name, avatar: k.avatar, key: h, kills: [], likes: 0 };
      A[h].kills.push(k);
      A[h].likes += k.likes;
      A[h].avatar = k.avatar || A[h].avatar;
      A[h].name = k.name;
    });
    killers = Object.values(A).sort((a, b) => b.kills.length - a.kills.length || b.likes - a.likes);
  };

  /* ---------------- shared bits ---------------- */
  /* Victim logo (self-hosted) or a typeset monogram. Never fetched from a third party at runtime. */
  const initials = (name) => {
    const w = String(name || '?')
      .replace(/^the\s+/i, '')
      .split(/[\s-]+/)
      .filter(Boolean);
    return ((w[0]?.[0] || '?') + (w.length > 1 ? w[1][0] : (w[0]?.[1] ?? ''))).toUpperCase();
  };
  const logoSrc = (name) => (has(LOGO.victims, slug(name)) ? LOGO.victims[slug(name)] : null);
  const logo = (name, cls = 'lg') => {
    const src = logoSrc(name);
    return src
      ? `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy" decoding="async" width="128" height="128" data-i="${esc(initials(name))}">`
      : `<span class="${cls} mono m${hash32(slug(name)) % 6}" aria-hidden="true">${esc(initials(name))}</span>`;
  };
  const avatarSrc = (o, sz) => {
    const h = String(o.handle || '').toLowerCase();
    return has(LOGO.killers, h) ? LOGO.killers[h] : o.avatar ? avSize(o.avatar, sz) : null;
  };
  const avatar = (o, cls = 'av', sz = 'bigger') =>
    avatarSrc(o, sz)
      ? `<img class="${cls}" src="${esc(avatarSrc(o, sz))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-i="${esc((o.name || o.handle || '?').trim()[0] || '?')}">`
      : `<span class="${cls} avi" aria-hidden="true">${esc((o.name || o.handle || '?').trim()[0] || '?').toUpperCase()}</span>`;
  document.addEventListener(
    'error',
    (e) => {
      const t = e.target;
      if (t.tagName === 'IMG' && t.dataset.i !== undefined && !t.dataset.f) {
        t.dataset.f = 1;
        const s = document.createElement('span');
        s.className = t.className + ' avi';
        s.textContent = t.dataset.i.toUpperCase();
        s.setAttribute('aria-hidden', 'true');
        t.replaceWith(s);
      } else if (t.tagName === 'IMG' && t.closest('.ev')) t.closest('.ev').remove();
    },
    true,
  );

  const linkify = (t, q) => {
    // Work on the raw text: split out t.co links and @mentions, escape every piece,
    // and only ever wrap escaped plain text in <mark>, so a search query cannot touch markup.
    const hl = q && q.length > 1 ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : null; // eslint-disable-line security/detect-non-literal-regexp -- query is regex-escaped
    const mark = (str) => {
      if (!hl) return esc(str);
      let out = '',
        last = 0;
      for (const m of str.matchAll(hl)) {
        if (!m[0]) break;
        out += esc(str.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>';
        last = m.index + m[0].length;
      }
      return out + esc(str.slice(last));
    };
    let h = '',
      last = 0;
    for (const m of String(t).matchAll(/https?:\/\/t\.co\/\w+|(^|[\s(])@(\w{1,15})/g)) {
      h += mark(t.slice(last, m.index));
      if (m[2] === undefined)
        h += `<a href="https://t.co/${esc(m[0].split('/').pop())}" target="_blank" rel="noopener noreferrer nofollow">link</a>`;
      else
        h +=
          mark(m[1]) +
          `<a href="https://x.com/${encodeURIComponent(m[2])}" target="_blank" rel="noopener noreferrer">${mark('@' + m[2])}</a>`;
      last = m.index + m[0].length;
    }
    return h + mark(t.slice(last));
  };
  const card = (k, q = '', big = false) => {
    const h = hash32(k.id),
      r = big ? 0 : ((h % 9) - 4) * 0.28,
      tr = ((h >> 4) % 7) - 3,
      er = ((h >> 8) % 5) - 2;
    const alive = k.victims.some((v) => BR.has(v));
    const long = !big && k.text.length > 380;
    return `<article class="card${big ? ' big' : ''}" data-sty="--r:${r.toFixed(2)}deg;--tr:${tr}deg;--er:${er * 0.6}deg">
  <header class="card-h"><a href="#/case/${k.id}">Case Nº ${k.case}</a>${k.conf ? `<span class="det" title="Our detectives re-checked this post and its replies">${I.mag}verified<span class="det-x"> by detectives</span></span>` : ''}<time datetime="${esc(k.created_at)}">${fdate(k.created_at)}</time></header>
  ${alive ? '<div class="stamp" aria-label="Victim still alive">STILL ALIVE</div>' : ''}
  <div class="card-v"><span class="lbl">Victim${k.victims.length > 1 ? 's' : ''}</span>${k.victims.map((v) => `<a class="vtag" href="#/victim/${slug(v)}">${BR.has(v) ? logo(v, 'lg lg-s') : ''}<span>${esc(v)}</span></a>`).join('')}</div>
  <div class="who">${avatar(k)}<div><div class="who-n">${esc(k.name)}${k.verified ? I.chk : ''}</div><div class="who-h"><a href="#/killer/${esc(k.handle.toLowerCase())}">@${esc(k.handle)}</a>${k.killer ? ` · weapon: ${esc(k.killer)}` : ''}</div></div></div>
  <p class="q${long ? ' clamp' : ''}">${linkify(k.text, q)}</p>${long ? '<button class="more-txt" type="button">Read the full statement</button>' : ''}
  ${k.image && k.url ? `<a class="ev" href="${esc(k.url)}" target="_blank" rel="noopener noreferrer" aria-label="Evidence photo, open the original post"><img src="${esc(k.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span>Exhibit A</span></a>` : ''}
  <footer class="card-f"><span class="m" title="Likes">${I.heart}${fmt(k.likes)}</span><span class="m" title="Reposts">${I.rt}${fmt(k.reposts)}</span>${k.views ? `<span class="m" title="Views">${I.eye}${fmt(k.views)}</span>` : ''}<span class="sp"></span><button class="lnk" type="button" data-copy="#/case/${k.id}">copy link</button>${k.url ? `<a class="x" href="${esc(k.url)}" target="_blank" rel="noopener noreferrer">View on X ↗</a>` : ''}</footer>
  </article>`;
  };
  const toast = (m) => {
    const t = $('#toast');
    t.textContent = m;
    t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(() => (t.hidden = true), 2200);
  };
  const copy = async (url, msg = 'Link copied to the clipboard') => {
    try {
      await navigator.clipboard.writeText(url);
      toast(msg);
    } catch {
      prompt('Copy this link:', url);
    }
  };

  /* reveal on scroll */
  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (es) =>
            es.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
              }
            }),
          { rootMargin: '0px 0px -12% 0px' },
        )
      : null;
  const reveal = (root = document) =>
    $$('.rv:not(.in),.chart:not(.in)', root).forEach((el) =>
      io && !reduced() ? io.observe(el) : el.classList.add('in'),
    );

  /* ---------------- hero ---------------- */
  const countUp = (el, to, dur = 1600) => {
    if (reduced()) {
      el.textContent = to.toLocaleString();
      return;
    }
    const t0 = performance.now();
    const f = (t) => {
      const p = Math.min(1, (t - t0) / dur),
        e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e).toLocaleString();
      if (p < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };
  // Timer handles, kept so the timers can be cancelled from a debugger.
  /* eslint-disable no-unused-vars */
  let heroTimer = null,
    feedTimer = null;
  /* eslint-enable no-unused-vars */
  const initHero = () => {
    countUp($('#c-kills'), K.length);
    countUp($('#c-victims'), victims.length, 1800);
    countUp($('#c-killers'), killers.length, 1800);
    // rotating victims: most-liked kill per named product, short names only
    const seen = new Set(),
      rot = [];
    [...K]
      .sort((a, b) => b.likes - a.likes)
      .forEach((k) => {
        const v = k.victims.find((v) => BR.has(v) && v.length <= 15);
        if (v && !seen.has(v)) {
          seen.add(v);
          rot.push({ v, k });
        }
      });
    const start = rot.findIndex((r) => r.v === 'Notion');
    if (start > 0) rot.unshift(...rot.splice(start, 1));
    const list = rot.slice(0, 16);
    if (!list.length) return;
    const hv = $('#hv'),
      by = $('#hl-by');
    const setLen = (t) => hv.parentElement.style.setProperty('--len', Math.max(7, t.length));
    const setBy = (r) => {
      setHTML(
        by,
        `claimed by <a href="${esc(r.k.url)}" target="_blank" rel="noopener noreferrer">@${esc(r.k.handle)}</a> · ${fdate(r.k.created_at)} · ${fmt(r.k.likes)} likes at the scene · <a href="#/check/${slug(r.v)}">run the check</a>`,
      );
    };
    let i = 0;
    hv.textContent = list[0].v + '.';
    setLen(hv.textContent);
    setBy(list[0]);
    if (reduced()) return;
    const type = async (target) => {
      const cur = hv.textContent;
      for (let n = cur.length; n >= 0; n--) {
        hv.textContent = cur.slice(0, n);
        await new Promise((r) => setTimeout(r, 28));
      }
      setLen(target);
      for (let n = 1; n <= target.length; n++) {
        hv.textContent = target.slice(0, n);
        Sound.play('key');
        await new Promise((r) => setTimeout(r, 55 + Math.random() * 40));
      }
    };
    const step = async () => {
      if (document.hidden || !heroVisible) {
        heroTimer = setTimeout(step, 1200);
        return;
      }
      i = (i + 1) % list.length;
      by.classList.add('fade');
      await type(list[i].v + '.');
      setBy(list[i]);
      by.classList.remove('fade');
      heroTimer = setTimeout(step, 2800);
    };
    heroTimer = setTimeout(step, 3200);
    // try chips
    const tries = ['Notion', 'Higgsfield', 'Cursor', 'LinkedIn', 'ChatGPT'].filter((t) =>
      victims.some((v) => v.norm.includes(norm(t))),
    );
    setHTML(
      $('#dead-try'),
      'Try ' +
        tries.map((t) => `<button type="button" data-try="${esc(t)}">${esc(t)}</button>`).join(', ') +
        ', or anything you ship.',
    );
  };
  let heroVisible = true;
  const initFeed = () => {
    const el = $('#feed');
    const multi = victims.filter((v) => v.kills.length >= 3);
    const items = [];
    byNew.slice(0, 60).forEach((k, i) => {
      items.push({ k });
      if (i % 5 === 4 && multi.length) items.push({ m: multi[((i / 5) | 0) % multi.length] });
    });
    const row = (it, isNew) => {
      if (it.m) {
        const v = it.m;
        return `<li><a class="kf multi${isNew ? ' new' : ''}" href="#/victim/${v.slug}"><span class="kf-t">ALERT</span><span class="kf-k">Repeat victim</span><span class="kf-x">·</span><span class="kf-v">${esc(v.name)} ×${v.kills.length}</span></a></li>`;
      }
      const k = it.k;
      return `<li><a class="kf${isNew ? ' new' : ''}" href="#/case/${k.id}" title="${esc(k.name)} claims to have killed ${esc(k.victims.join(', '))}"><span class="kf-t">${fdate(k.created_at, { month: '2-digit', day: '2-digit' })}</span><span class="kf-k">${esc(k.killer || k.name)}</span><span class="kf-x">killed</span><span class="kf-v">${esc(k.victims.join(' + '))}</span></a></li>`;
    };
    const max = () => (innerWidth <= 560 ? 3 : 6);
    let p = 0;
    const first = items.slice(0, max()).reverse();
    setHTML(
      el,
      first
        .map((it) => row(it))
        .reverse()
        .join(''),
    );
    p = max();
    if (reduced()) return;
    const push = () => {
      if (!document.hidden && heroVisible) {
        insertHTML(el, 'afterbegin', row(items[p % items.length], true));
        p++;
        while (el.children.length > max() + 1) el.lastElementChild.remove();
      }
      feedTimer = setTimeout(push, 2300);
    };
    feedTimer = setTimeout(push, 1800);
    if (io)
      new IntersectionObserver((es) => {
        heroVisible = es[0].isIntersecting;
      }).observe($('#hero'));
  };

  /* ---------------- verdict: is my product dead? ---------------- */
  const lookup = (q) => {
    const n = norm(q);
    if (n.length < 2) return { n, primary: null, rel: [] };
    let exact = victims.find((v) => v.norm === n) || null;
    const rel =
      n.length >= 3
        ? victims
            .filter((v) => v !== exact && (v.norm.includes(n) || (v.norm.length >= 4 && n.includes(v.norm))))
            .sort((a, b) => b.kills.length - a.kills.length || a.norm.length - b.norm.length)
        : [];
    const primary = exact || rel.shift() || null;
    return { n, primary, rel };
  };
  const sug = () => {
    const q = $('#dead-q').value,
      ul = $('#dead-sug');
    const n = norm(q);
    if (n.length < 2) {
      ul.hidden = true;
      return;
    }
    const m = victims
      .filter((v) => v.norm.includes(n))
      .sort((a, b) => b.norm.startsWith(n) - a.norm.startsWith(n) || b.kills.length - a.kills.length)
      .slice(0, 6);
    setHTML(
      ul,
      m
        .map(
          (v, i) =>
            `<li role="option" id="sg${i}" data-v="${v.slug}" aria-selected="false"><span>${esc(v.name)}</span><b>killed ${times(v.kills.length)}</b></li>`,
        )
        .join(''),
    );
    ul.hidden = !m.length;
    sel = -1;
  };
  let sel = -1;

  /* ---------------- share: per-context copy, menu, native share with the card PNG ---------------- */
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const SHARE = {
    safe: (name) =>
      pick([
        `Ran ${name} through the We Just Killed morgue. Verdict: MARKED SAFE. Nobody has “just killed” it… yet.`,
        `${name} is still alive. No launch post has claimed the kill (for now).`,
        `Good news for ${name}: zero kill claims on file. Somebody’s launch video is surely still rendering.`,
        `Checked the morgue. ${name} has a pulse. Enjoy it while it lasts.`,
      ]),
    killed: (v) => {
      const n = v.kills.length,
        k = v.last;
      if (!v.brand) return `“${v.name}” has been “just killed” ${times(n)} on X. Status: unconfirmed, probably fine.`;
      if (n === 1)
        return pick([
          `${v.name} was “just killed” by @${k.handle}. Doctors describe it as stable and still billing.`,
          `RIP ${v.name} (killed once, by @${k.handle}). It shipped an update the next morning.`,
        ]);
      if (n >= 5)
        return pick([
          `${v.name} is a serial victim: pronounced dead ${n} times on X and still shipping on Tuesdays.`,
          `${v.name} has ${n} kill claims on file and zero funerals. The morgue is running out of drawers.`,
        ]);
      return pick([
        `${v.name} has been “just killed” ${times(n)} by launch posts. Still taking signups.`,
        `RIP ${v.name}, ${times(n)} over. Cause of death: somebody’s launch video. Status: alive.`,
      ]);
    },
    killer: (a) =>
      `@${a.handle} has ${plural(a.kills.length, 'kill claim')} on file at the Department of Launch Homicide. Considered armed with a demo video.`,
    case: (k) =>
      `Case Nº ${k.case}: @${k.handle} claims to have killed ${k.victims.join(' and ')}. The victim could not be reached for comment (it was shipping).`,
    cert: (v) =>
      `Official death certificate: ${v.name}, pronounced dead ${times(v.kills.length)}. Status: ${v.brand ? 'still alive' : 'probably fine'}. Filed by the Department of Launch Homicide.`,
  };
  // Native share payloads, keyed by a counter so nothing user-controlled ends up in markup as code.
  const shares = new Map();
  let shareN = 0;
  const shareMenu = (text, hash, card = null) => {
    const url = pageURL(hash),
      t = encodeURIComponent(text),
      u = encodeURIComponent(url),
      tu = encodeURIComponent(text + ' ' + url),
      id = String(++shareN);
    shares.set(id, { text, url, card });
    const T = [
      ['X', `https://x.com/intent/post?text=${t}&url=${u}`],
      ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
      ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
      ['Threads', `https://www.threads.com/intent/post?text=${tu}`],
      ['WhatsApp', `https://wa.me/?text=${tu}`],
      ['Reddit', `https://www.reddit.com/submit?url=${u}&title=${t}`],
    ];
    return `<details class="share" data-share-id="${id}"><summary class="btn">Share<span class="caret-d" aria-hidden="true"></span></summary><div class="share-m"><p class="share-t">${esc(text)}</p>${
      navigator.share
        ? `<button type="button" class="share-i share-n" data-share="${id}">Share${card ? ' with the card' : ''}…</button>`
        : ''
    }${T.map(([n, h]) => `<a class="share-i" href="${esc(h)}" target="_blank" rel="noopener noreferrer">${n}</a>`).join('')}<a class="share-i" href="${esc('sms:?&body=' + tu)}">Messages / SMS</a><button type="button" class="share-i" data-copy-only="${esc(hash)}">Copy link</button></div></details>`;
  };
  const nativeShare = async (id) => {
    const s = shares.get(id);
    if (!s) return;
    const data = { title: 'We Just Killed', text: s.text, url: s.url };
    try {
      const blob = s.card ? await s.card() : null;
      if (blob) {
        const f = new File([blob], 'we-just-killed.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [f] })) data.files = [f];
      }
    } catch {
      /* no card: share the link alone */
    }
    navigator.share(data).catch(() => {});
  };

  /* ---------------- check result: is my product dead? ---------------- */
  const SAFE_LINES = [
    () => 'Marked safe from being “just killed” today.',
    (n) => `Phew. ${n} is still alive (for now).`,
    (n) => `No one has claimed to kill ${n}… yet.`,
    (n) => `${n} has a clean record. Suspiciously clean.`,
    (n) => `The coroner checked twice. ${n} has a pulse.`,
    () => 'Zero bodies on file. Carry on shipping.',
  ];
  const cleanName = (q) =>
    String(q)
      // eslint-disable-next-line no-control-regex -- strip control characters from a URL-provided name
      .replace(/[\u0000-\u001f\u007f<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);
  const checkHash = (name) => '#/check/' + (V[slug(name)] ? slug(name) : encodeURIComponent(name));
  const caseRow = (k) =>
    `<li><a href="#/case/${k.id}">${avatar(k, 'av', 'normal')}<span class="cr-h">@${esc(k.handle)}</span><span class="cr-d">${fdate(k.created_at)}</span><span class="cr-q">${esc(causeLine(k.text, 90))}</span></a></li>`;
  const checkHTML = (q) => {
    const { primary: v, rel } = lookup(q);
    if (!v) {
      const name = cleanName(q) || 'Your product',
        n = norm(name),
        wit = n.length >= 3 ? K.filter((k) => norm(k.text).includes(n)).length : 0,
        line = pick(SAFE_LINES)(esc(name));
      return `<article class="result safe"><p class="eyebrow r-eb">Check result · Form DLH-0</p>
      <div class="r-id"><span class="r-logo" id="r-logo">${logo(name, 'lg lg-l')}</span><div><h2 class="r-name" id="modal-title">${esc(name)}</h2><p class="r-kc">Kill claims on file: <b>0</b></p></div><span class="r-stamp ok">Marked safe</span></div>
      <p class="r-line">${line}</p>
      <p class="r-sub">No launch post in the case files claims to have killed it.${wit ? ` It has been mentioned at <a href="#/cases?q=${encodeURIComponent(name)}">${plural(wit, 'crime scene')}</a> though, so watch your back.` : ' Give it a week.'}</p>
      <figure class="r-card"><span class="r-slot" data-card="safe"></span><figcaption>Your “marked safe” card, ready to post.</figcaption></figure>
      <div class="r-pick"><label class="btn btn-sm file-l"><input type="file" id="logo-file" accept="image/png,image/jpeg,image/webp,image/gif">Add your logo</label><span>Optional. The image stays on your device and is drawn into the card locally. Nothing is uploaded.</span></div>
      <div class="m-acts"><button class="btn btn-stamp" type="button" data-dl-safe>Download the card</button>${shareMenu(SHARE.safe(name), checkHash(name), () => safeBlob(name))}<a class="btn" href="#/morgue">Browse the morgue</a></div></article>`;
    }
    const n = v.kills.length;
    const stamp = n >= 5 ? `Serial victim · ${n}×` : n === 1 ? 'Killed once' : `Killed ${n} times`;
    const ks = [...new Set(v.kills.map((k) => k.handle.toLowerCase()))].map((h) => A[h]);
    const family = rel.length
      ? `<p class="vrel">Related victims: ${rel
          .slice(0, 5)
          .map((r) => `<a href="#/check/${r.slug}">${esc(r.name)}</a> (${r.kills.length})`)
          .join(', ')}${rel.length > 5 ? '…' : ''}</p>`
      : '';
    return `<article class="result killed"><p class="eyebrow r-eb">Check result · Victim #${v.rank} of ${victims.length}</p>
    <div class="r-id"><span class="r-logo">${logo(v.name, 'lg lg-l')}</span><div><h2 class="r-name" id="modal-title">${esc(v.name)}</h2><p class="r-kc">Status: ${v.brand ? '<b>still alive</b>' : '<b>unconfirmed, probably fine</b>'}</p></div><span class="r-stamp">${stamp}</span></div>
    <p class="r-sub">First pronounced dead ${fdate(v.first.created_at)} by <a href="#/case/${v.first.id}">@${esc(v.first.handle)}</a>${n > 1 ? `, most recently ${fdate(v.last.created_at)} by <a href="#/case/${v.last.id}">@${esc(v.last.handle)}</a>` : ''}. ${fmt(v.likes)} likes at the scene${n > 1 ? 's' : ''}.</p>
    <div class="r-grid"><div class="r-cases"><h3 class="lbl">On file</h3><ol>${v.kills
      .slice()
      .reverse()
      .slice(0, 4)
      .map(caseRow)
      .join(
        '',
      )}</ol>${n > 4 ? `<a class="r-all" href="#/victim/${v.slug}">All ${n} case files</a>` : ''}<h3 class="lbl">Claimed by</h3><div class="vkillers">${ks
      .slice(0, 12)
      .map((a) => `<a href="#/killer/${esc(a.key)}" title="@${esc(a.handle)}">${avatar(a)}</a>`)
      .join('')}</div></div>
    <figure class="r-card"><a href="#/cert/${v.slug}" class="r-slot" data-card="cert" aria-label="Open the death certificate"></a><figcaption>Death certificate Nº WJK-${v.first.case}-${String(n).padStart(2, '0')}</figcaption></figure></div>${family}
    <div class="m-acts"><button class="btn btn-stamp" type="button" data-dl="${v.slug}">Download certificate</button>${shareMenu(SHARE.killed(v), '#/check/' + v.slug, () => certBlob(v))}<a class="btn" href="#/victim/${v.slug}">Read ${n > 1 ? `all ${n} case files` : 'the case file'}</a></div></article>`;
  };

  /* ---------------- certificates and cards (canvas → PNG, all drawn locally) ---------------- */
  const fontsReady = (() => {
    let p;
    return () =>
      (p ||= Promise.all(
        [
          '800 40px "Barlow Condensed"',
          '600 40px "Barlow Condensed"',
          '400 20px "IBM Plex Mono"',
          '600 20px "IBM Plex Mono"',
          'italic 400 30px "Source Serif 4"',
          '600 40px "Source Serif 4"',
        ].map((f) => document.fonts?.load(f).catch(() => 0)),
      ).then(() => 0));
  })();
  const causeLine = (text, max = 110) => {
    const t = String(text)
      .replace(/https?:\/\/\S+/g, '')
      // eslint-disable-next-line security/detect-unsafe-regex -- single code-point alternation, no nested quantifiers (no ReDoS)
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uf8ff]|\u{FE0F}|\u{200D}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
    const s = t.split(/(?<=[.!?])\s+/).find((x) => /kill/i.test(x)) || t;
    return s.length > max ? s.slice(0, max - 3).replace(/\s\S*$/, '') + '…' : s;
  };
  const causeOf = (v) => {
    const k = [...v.kills].sort((a, b) => b.likes - a.likes)[0];
    return { k, q: causeLine(k.text) };
  };
  const imgCache = new Map();
  const loadImg = (src) => {
    if (!src) return Promise.resolve(null);
    if (!imgCache.has(src))
      imgCache.set(
        src,
        new Promise((ok) => {
          const i = new Image();
          i.decoding = 'async';
          i.onload = () => ok(i);
          i.onerror = () => ok(null);
          i.src = src; // same-origin files only (assets/logos/), so the canvas stays exportable
        }),
      );
    return imgCache.get(src);
  };
  const MONO_INK = ['#7a2a22', '#28405f', '#2f5a3b', '#6a4b1d', '#4b3a5c', '#5b3030'];
  // certificate palettes: warm card stock at night, plain white form paper by day
  const PAL = {
    dark: {
      paper: '#f3ecdb',
      paper2: '#e6dabe',
      ink: '#1f1a14',
      mute: '#6b5d47',
      rule: '#9d8c6d',
      red: '#b0251c',
      green: '#2c6b3c',
      blue: '#1f2f63',
      logo: '#fbf7ee',
      mono: '#f6efe0',
      grain: 1,
    },
    light: {
      paper: '#ffffff',
      paper2: '#ffffff',
      ink: '#101317',
      mute: '#4d5560',
      rule: '#9aa3ad',
      red: '#b0251c',
      green: '#2a6534',
      blue: '#1f2f63',
      logo: '#ffffff',
      mono: '#ffffff',
      grain: 0,
    },
  };
  const P = { ...PAL.dark };
  const pal = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  const usePal = (t) => Object.assign(P, PAL[t]);
  const paper = (x, W, H, seed) => {
    const R = rng(seed);
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, P.paper);
    g.addColorStop(1, P.paper2);
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    for (let i = 0; i < (P.grain ? 2600 : 0); i++) {
      x.fillStyle = `rgba(${R() < 0.6 ? '80,60,30' : '255,255,255'},${R() * 0.05})`;
      x.fillRect(R() * W, R() * H, 1 + R() * 1.6, 1 + R() * 1.6);
    }
    return R;
  };
  const tracked = (x, ls) => {
    if ('letterSpacing' in x) x.letterSpacing = ls + 'px';
  };
  const txt = (x, t, px, py, font, col = P.ink, align = 'left', ls = 0) => {
    x.font = font;
    x.fillStyle = col;
    x.textAlign = align;
    tracked(x, ls);
    x.fillText(t, px, py);
    tracked(x, 0);
  };
  const fitFont = (x, t, w, size, min, fam) => {
    let fs = size;
    x.font = `${fam.replace('#', fs)}`;
    while (x.measureText(t).width > w && fs > min) x.font = fam.replace('#', (fs -= 2));
    return fs;
  };
  const wrapLines = (x, t, w, max = 2) => {
    const out = [];
    let line = '';
    for (const word of String(t).split(' ')) {
      const tryL = line ? line + ' ' + word : word;
      if (x.measureText(tryL).width > w && line) {
        out.push(line);
        line = word;
      } else line = tryL;
    }
    if (line) out.push(line);
    if (out.length > max) {
      out.length = max;
      out[max - 1] = out[max - 1].replace(/\s?\S*$/, '…');
    }
    return out;
  };
  const box = (x, bx, by, bw, bh, label, n) => {
    x.strokeStyle = P.rule;
    x.lineWidth = 1.2;
    x.strokeRect(bx, by, bw, bh);
    txt(x, (n ? n + '. ' : '') + label, bx + 14, by + 26, '600 15px "IBM Plex Mono"', P.mute, 'left', 1.5);
  };
  const drawLogo = async (x, name, src, bx, by, sz) => {
    const c = { ...P }; // palette as of the call; P can change across the await
    x.fillStyle = c.logo;
    x.fillRect(bx, by, sz, sz);
    const img = src && typeof src === 'object' ? src : await loadImg(src || logoSrc(name));
    const pad = 18;
    if (img) {
      x.save();
      x.globalAlpha = 0.97;
      const iw = img.width || img.naturalWidth,
        ih = img.height || img.naturalHeight,
        k = Math.min((sz - pad * 2) / iw, (sz - pad * 2) / ih);
      x.drawImage(img, bx + (sz - iw * k) / 2, by + (sz - ih * k) / 2, iw * k, ih * k);
      x.restore();
    } else {
      x.fillStyle = MONO_INK[hash32(slug(name)) % 6];
      x.fillRect(bx + pad, by + pad, sz - pad * 2, sz - pad * 2);
      txt(
        x,
        initials(name),
        bx + sz / 2,
        by + sz / 2 + sz * 0.17,
        `800 ${sz * 0.46}px "Barlow Condensed"`,
        c.mono,
        'center',
        1,
      );
    }
    x.strokeStyle = c.ink;
    x.lineWidth = 2;
    x.strokeRect(bx, by, sz, sz);
  };
  const stampAt = (x, R, label, col, cx, cy, rot, size = 64) => {
    x.save();
    x.translate(cx, cy);
    x.rotate(rot);
    x.font = `800 ${size}px "Barlow Condensed"`;
    tracked(x, 4);
    const tw = x.measureText(label).width;
    x.strokeStyle = col;
    x.fillStyle = col;
    x.globalAlpha = 0.88;
    x.lineWidth = 5;
    x.strokeRect(-tw / 2 - 26, -size * 0.86, tw + 52, size * 1.2);
    x.lineWidth = 1.6;
    x.strokeRect(-tw / 2 - 16, -size * 0.74, tw + 32, size * 0.96);
    x.textAlign = 'center';
    x.fillText(label, 2, size * 0.08);
    tracked(x, 0);
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 520; i++) {
      x.fillStyle = `rgba(0,0,0,${0.25 + R() * 0.6})`;
      x.beginPath();
      x.arc((R() - 0.5) * (tw + 60), -size * 0.9 + R() * size * 1.3, R() * 2.2, 0, 7);
      x.fill();
    }
    x.restore();
  };
  const frame = (x, W, H, formNo, right) => {
    x.strokeStyle = P.ink;
    x.lineWidth = 3;
    x.strokeRect(40, 40, W - 80, H - 80);
    x.lineWidth = 1;
    x.strokeRect(50, 50, W - 100, H - 100);
    txt(x, 'DEPARTMENT OF LAUNCH HOMICIDE', 84, 100, '600 18px "IBM Plex Mono"', P.ink, 'left', 3);
    txt(x, formNo, W - 84, 100, '400 18px "IBM Plex Mono"', P.mute, 'right', 2);
    x.fillStyle = P.ink;
    x.fillRect(84, 118, W - 168, 2);
    txt(x, right, W - 84, H - 76, '600 17px "IBM Plex Mono"', P.ink, 'right', 2);
  };
  const asOf = () => fdate(D.meta?.generated_at ? D.meta.generated_at + 'T17:00:00Z' : Date.now());
  const drawCert = async (v, t = pal()) => {
    await fontsReady();
    usePal(t);
    const W = 1500,
      H = 1000,
      c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const R = paper(x, W, H, hash32(v.slug));
    const n = v.kills.length,
      certNo = `WJK-${v.first.case}-${String(n).padStart(2, '0')}`;
    frame(x, W, H, `FORM DLH-7 · CERT. Nº ${certNo}`, SITE.toUpperCase());
    txt(x, 'Certificate of Death', 84, 196, '600 64px "Source Serif 4"', P.ink);
    txt(
      x,
      'This certifies that the product named below was publicly pronounced dead on X.',
      86,
      236,
      'italic 400 25px "Source Serif 4"',
      P.mute,
    );
    // ID block: logo + name
    await drawLogo(x, v.name, null, 84, 272, 196);
    usePal(t); // another theme's draw may have run during the await
    box(x, 300, 272, W - 384, 196, 'NAME OF DECEASED', 1);
    const nm = v.name.toUpperCase();
    // leave room on the right of the name box for the status stamp
    const fs = fitFont(x, nm, W - 920, 132, 44, '800 #px "Barlow Condensed"');
    txt(x, nm, 326, 272 + 98 + fs * 0.36, `800 ${fs}px "Barlow Condensed"`, P.ink, 'left', 1);
    // fields
    const ks = [...new Set(v.kills.map((k) => k.handle.toLowerCase()))].map((h) => A[h]),
      { q: cq } = causeOf(v);
    const top = 492,
      bh = 112,
      L = 84,
      CW = (W - 168 - 24) / 2,
      M = L + CW + 24;
    box(x, L, top, CW, bh, 'TIMES PRONOUNCED DEAD', 2);
    txt(x, n === 1 ? 'Once' : `${n} times`, L + 14, top + 84, '600 44px "IBM Plex Mono"');
    box(x, M, top, CW, bh, 'FIRST REPORTED DEATH', 3);
    txt(x, `${fdate(v.first.created_at)} · @${v.first.handle}`, M + 14, top + 80, '400 30px "IBM Plex Mono"');
    box(x, L, top + bh + 16, W - 168, bh, 'CAUSE OF DEATH (AS STATED BY THE SUSPECT)', 4);
    x.font = 'italic 400 30px "Source Serif 4"';
    wrapLines(x, `“${cq}”`, W - 210, 2).forEach((l, i) =>
      txt(x, l, L + 14, top + bh + 16 + 64 + i * 34, 'italic 400 30px "Source Serif 4"'),
    );
    const ky = top + 2 * (bh + 16);
    box(x, L, ky, CW, bh + 20, ks.length > 1 ? `KNOWN KILLERS (${ks.length})` : 'KNOWN KILLER', 5);
    const shown = ks.slice(0, 6);
    for (let i = 0; i < shown.length; i++) {
      const a = shown[i],
        ax = L + 16 + i * 66,
        ay = ky + 40;
      const im = await loadImg(has(LOGO.killers, a.key) ? LOGO.killers[a.key] : null);
      usePal(t);
      x.save();
      x.beginPath();
      x.rect(ax, ay, 56, 56);
      x.clip();
      if (im) x.drawImage(im, ax, ay, 56, 56);
      else {
        x.fillStyle = MONO_INK[hash32(a.key) % 6];
        x.fillRect(ax, ay, 56, 56);
        txt(x, initials(a.name), ax + 28, ay + 38, '800 28px "Barlow Condensed"', P.mono, 'center');
      }
      x.restore();
      x.strokeStyle = P.ink;
      x.lineWidth = 1.5;
      x.strokeRect(ax, ay, 56, 56);
    }
    txt(
      x,
      shown.length === 1 ? '@' + shown[0].handle : ks.length > 6 ? `+${ks.length - 6} more` : '',
      L + 16 + Math.min(shown.length, 6) * 66 + 8,
      ky + 78,
      '400 22px "IBM Plex Mono"',
      P.mute,
    );
    box(x, M, ky, CW, bh + 20, 'WITNESSES AT THE SCENE', 6);
    txt(
      x,
      `${fmt(v.likes)} likes${v.views ? ' · ' + fmt(v.views) + ' views' : ''}`,
      M + 14,
      ky + 84,
      '400 30px "IBM Plex Mono"',
    );
    // signature + stamp
    txt(x, `Filed ${asOf()} by the attending coroner`, 84, H - 76, '400 17px "IBM Plex Mono"', P.mute, 'left', 1);
    stampAt(x, R, v.brand ? 'STILL ALIVE' : 'PROBABLY FINE', v.brand ? P.green : P.red, W - 300, 362, -0.1, 66);
    return c;
  };
  const drawSafe = async (name, img = null, t = pal()) => {
    await fontsReady();
    usePal(t);
    const W = 1500,
      H = 1000,
      c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const R = paper(x, W, H, hash32(slug(name) + 'safe'));
    const caseNo = `WJK-S${String(hash32(norm(name)) % 100000).padStart(5, '0')}`;
    frame(x, W, H, `FORM DLH-0 · CASE Nº ${caseNo}`, SITE.toUpperCase());
    txt(x, 'Certificate of Survival', 84, 196, '600 64px "Source Serif 4"', P.ink);
    txt(
      x,
      'This certifies that no launch post on file claims to have killed the product below.',
      86,
      236,
      'italic 400 25px "Source Serif 4"',
      P.mute,
    );
    await drawLogo(x, name, img, 84, 272, 196);
    usePal(t);
    box(x, 300, 272, W - 384, 196, 'NAME OF PRODUCT', 1);
    const nm = name.toUpperCase();
    const fs = fitFont(x, nm, W - 430, 132, 54, '800 #px "Barlow Condensed"');
    txt(x, nm, 326, 272 + 98 + fs * 0.36, `800 ${fs}px "Barlow Condensed"`, P.ink, 'left', 1);
    const top = 492,
      bh = 112,
      L = 84,
      CW = (W - 168 - 24) / 2,
      M = L + CW + 24;
    box(x, L, top, CW, bh, 'KILL CLAIMS ON FILE', 2);
    txt(x, 'None', L + 14, top + 84, '600 44px "IBM Plex Mono"');
    box(x, M, top, CW, bh, 'DATE OF CHECK', 3);
    txt(x, fdate(Date.now()), M + 14, top + 80, '400 30px "IBM Plex Mono"');
    box(x, L, top + bh + 16, W - 168, bh * 2 + 36, "CORONER'S NOTE", 4);
    x.font = 'italic 400 40px "Source Serif 4"';
    wrapLines(x, `Marked safe from being “just killed” today. ${name} is still alive (for now).`, W - 640, 3).forEach(
      (l, i) => txt(x, l, L + 18, top + bh + 16 + 86 + i * 50, 'italic 400 40px "Source Serif 4"'),
    );
    txt(
      x,
      `Checked against ${plural(K.length, 'kill claim')} · ${asOf()} snapshot`,
      84,
      H - 76,
      '400 17px "IBM Plex Mono"',
      P.mute,
      'left',
      1,
    );
    stampAt(x, R, 'MARKED SAFE', P.green, W - 300, 790, -0.1, 76);
    return c;
  };
  const toBlob = (c) => new Promise((r) => c.toBlob(r, 'image/png'));
  // keyed by victim slug, which can be any string ("constructor" included): no prototype
  const certBlobs = Object.create(null),
    certCache = Object.create(null);
  // cached per theme: a light-mode PNG is white paper, a dark-mode one is card stock
  const certBlob = (v, t = pal()) => (certBlobs[t + ':' + v.slug] ||= drawCert(v, t).then(toBlob));
  const certURL = async (v, t = pal()) => (certCache[t + ':' + v.slug] ||= URL.createObjectURL(await certBlob(v, t)));
  let safeLogo = null,
    safeCur = null;
  const safeBlob = (name) => {
    const t = pal();
    if (!safeCur || safeCur.name !== name || safeCur.logo !== safeLogo || safeCur.t !== t)
      safeCur = { name, logo: safeLogo, t, blob: drawSafe(name, safeLogo, t).then(toBlob) };
    return safeCur.blob;
  };
  const saveBlob = (blob, file) => {
    const u = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = u;
    a.download = file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  };
  const downloadCert = async (v) => {
    saveBlob(await certBlob(v), `death-certificate-${v.slug}.png`);
    Sound.play('shutter');
    toast('Certificate issued. Frame it.');
  };
  const fillSlot = async (slot, blob, alt, paint, key) => {
    if (!slot || !blob) return;
    if (paint) Object.assign(slot.dataset, { paint, key, alt });
    const img = document.createElement('img');
    const u = URL.createObjectURL(blob);
    img.src = u;
    img.alt = alt;
    img.width = 1500;
    img.height = 1000;
    img.onload = () => slot.dataset.keep || setTimeout(() => URL.revokeObjectURL(u), 1000);
    slot.replaceChildren(img);
  };

  // a theme switch repaints any certificate or safe card on screen in the new paper
  document.addEventListener('wjk:theme', () => {
    $$('[data-paint]').forEach(async (el) => {
      const k = el.dataset.paint,
        key = el.dataset.key || '';
      if (k === 'safe') return fillSlot(el, await safeBlob(key), el.dataset.alt, 'safe', key);
      if (!has(V, key)) return;
      if (k === 'thumb') {
        const img = $('img', el);
        if (img) img.src = await certURL(V[key]);
      } else fillSlot(el, await certBlob(V[key]), el.dataset.alt, k, key);
    });
  });

  /* ---------------- modal ---------------- */
  let modalOpen = false,
    lastFocus = null;
  const openModal = (html, cls = '') => {
    lastFocus = modalOpen ? lastFocus : document.activeElement;
    setHTML($('#modal-body'), html);
    $('#modal-in').className = 'modal-in' + (cls ? ' ' + cls : '');
    $('#modal').hidden = false;
    modalOpen = true;
    document.body.classList.add('modal-on');
    setTimeout(() => $('.modal-x').focus({ preventScroll: true }), 30);
  };
  const hideModal = () => {
    $('#modal').hidden = true;
    modalOpen = false;
    document.body.classList.remove('modal-on');
    lastFocus?.focus?.({ preventScroll: true });
  };
  const closeModal = () => {
    Sound.play('folder');
    if (isModalRoute(location.hash)) {
      if (inAppNav) history.back();
      else {
        history.replaceState(null, '', underlying || '#/');
        hideModal();
        route();
      }
    } else hideModal();
  };
  const isModalRoute = (h) => /^#\/(case|cert|verdict|check)\//.test(h);
  $('#modal').addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = $('details.share[open]');
    if (open) {
      open.open = false;
      open.querySelector('summary').focus();
    } else if (modalOpen) closeModal();
  });

  const openCase = (id) => {
    const k = K.find((k) => k.id === id);
    if (!k) return false;
    openModal(
      `<div class="m-case">${card(k, '', true)}<div class="m-acts">${k.victims.map((v) => `<a class="btn" href="#/cert/${slug(v)}">${esc(v)}: death certificate</a>`).join('')}${shareMenu(SHARE.case(k), '#/case/' + k.id)}<a class="btn" href="#/killer/${esc(k.handle.toLowerCase())}">All kills by @${esc(k.handle)}</a><button class="btn" type="button" data-random>Another case</button></div></div>`,
      'mi-case',
    );
    $('#modal-body .card').id = 'modal-title';
    document.title = `Case Nº ${k.case}: ${k.victims.join(', ')} — We Just Killed`;
    Sound.play('open');
    return true;
  };
  const openCert = async (s) => {
    if (!has(V, s)) return false;
    const v = V[s];
    openModal(
      `<div class="m-cert"><p class="eyebrow">Form DLH-7 · Certificate of death</p><h2 id="modal-title">${esc(v.name)}</h2><div class="cert-slot"><span class="cert-wait">Typing up the certificate…</span></div><div class="m-acts"><button class="btn btn-stamp" type="button" data-dl="${v.slug}">Download PNG</button>${shareMenu(SHARE.cert(v), '#/cert/' + v.slug, () => certBlob(v))}<a class="btn" href="#/victim/${v.slug}">Case files (${v.kills.length})</a></div></div>`,
      'mi-cert',
    );
    document.title = `Death certificate: ${v.name} — We Just Killed`;
    const blob = await certBlob(v);
    const slot = $('.cert-slot');
    if (slot) {
      await fillSlot(
        slot,
        blob,
        `Death certificate for ${v.name}: killed ${times(v.kills.length)}, status ${v.brand ? 'still alive' : 'probably fine'}.`,
        'cert',
        v.slug,
      );
      Sound.play('stamp');
    }
    return true;
  };
  const openCheck = async (q) => {
    const name = cleanName(q);
    safeLogo = null;
    openModal(checkHTML(name), 'mi-result');
    document.title = `Is ${name} dead? — We Just Killed`;
    Sound.play('stamp');
    const slot = $('#modal-body .r-slot');
    const { primary: v } = lookup(name);
    if (v) fillSlot(slot, await certBlob(v), `Death certificate for ${v.name}`, 'cert', v.slug);
    else if (slot)
      fillSlot(
        slot,
        await safeBlob(name || 'Your product'),
        `Marked safe card for ${name}`,
        'safe',
        name || 'Your product',
      );
    return true;
  };

  /* ---------------- chart ---------------- */
  const monthsData = () => {
    const m = {};
    K.forEach((k) => {
      const key = k.created_at.slice(0, 7);
      m[key] = (m[key] || 0) + 1;
    });
    const keys = Object.keys(m).sort();
    const out = [];
    if (!keys.length) return { m, all: out };
    let [y, mo] = keys[0].split('-').map(Number);
    const [ey, em] = keys.at(-1).split('-').map(Number);
    while (y < ey || (y === ey && mo <= em)) {
      out.push(`${y}-${String(mo).padStart(2, '0')}`);
      if (++mo > 12) {
        mo = 1;
        y++;
      }
    }
    return { m, all: out };
  };
  const facts = () => {
    const { m, all } = monthsData();
    let streak = all.length - 1;
    while (streak > 0 && m[all[streak - 1]]) streak--;
    const peak = all.reduce((a, b) => ((m[b] || 0) > (m[a] || 0) ? b : a), all[0]);
    const days = {};
    K.forEach((k) => {
      const d = k.created_at.slice(0, 10);
      days[d] = (days[d] || 0) + 1;
    });
    const topDay = Object.entries(days).sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0];
    const viral = [...K].sort((a, b) => b.likes - a.likes)[0];
    return { m, all, outbreak: all[streak], peak, topDay, viral, first: byNew.at(-1), last: byNew[0] };
  };
  const mlabel = (key) => `${MONL[+key.slice(5) - 1]} ${key.slice(0, 4)}`;
  const chartHTML = (full) => {
    const F = facts();
    const months = full ? F.all : F.all.filter((k) => k >= F.outbreak);
    const max = Math.max(...months.map((k) => F.m[k] || 0));
    const pins = {};
    const addPin = (key, n) => {
      if (months.includes(key) && !pins[key]) pins[key] = n;
    };
    addPin(F.first.created_at.slice(0, 7), 1);
    addPin(F.outbreak, 2);
    addPin(F.peak, 3);
    let cum = full ? 0 : K.filter((k) => k.created_at.slice(0, 7) < months[0]).length;
    const pts = months.map((k, i) => {
      cum += F.m[k] || 0;
      return [((i + 0.5) / months.length) * 100, 100 - (cum / K.length) * 100];
    });
    const path = 'M' + pts.map((p) => p.map((n) => n.toFixed(2)).join(' ')).join(' L');
    return `<div class="chart${full ? ' chart-full' : ''}"><div class="chart-scroll"><div class="chart-plot">
    <svg class="cum" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" pathLength="1"/></svg><span class="cum-l">running total → ${K.length}</span>
    ${months
      .map((k, i) => {
        const n = F.m[k] || 0;
        return `<a class="bar${n ? '' : ' zero'}${k === F.peak ? ' peak' : ''}" href="#/month/${k}" data-sty="--h:${((n / max) * 86).toFixed(1)}%;--i:${i}" aria-label="${mlabel(k)}: ${plural(n, 'kill claim')}"><i></i>${n ? `<b>${n}</b>` : ''}${pins[k] ? `<span class="pin">${pins[k]}</span>` : ''}</a>`;
      })
      .join('')}
    </div><div class="chart-x">${months.map((k, i) => `<span class="${k.endsWith('-01') || i === 0 ? 'yr' : ''}">${MON[+k.slice(5) - 1]}${k.endsWith('-01') || i === 0 ? ` ’${k.slice(2, 4)}` : ''}</span>`).join('')}</div></div>
    <div class="legend"><span><i></i>kill claims per month</span><span><i class="l"></i>running body count</span></div>
    ${notesHTML(F, pins)}</div>`;
  };
  const notesHTML = (F, pins) => {
    const has = (n) => Object.values(pins).includes(n);
    const N = [];
    if (has(1))
      N.push([
        1,
        'Patient zero',
        `<a href="#/case/${F.first.id}">@${esc(F.first.handle)}</a> killed ${esc(F.first.victims.join(', '))} on ${fdate(F.first.created_at)}. Then, mostly silence.`,
      ]);
    N.push([
      has(2) ? 2 : 0,
      'The outbreak',
      `Since ${mlabel(F.outbreak)}, not a single month has gone by without a kill.`,
    ]);
    N.push([
      3,
      'Deadliest month',
      `${mlabel(F.peak)}: <b>${F.m[F.peak]}</b> kill claims, about ${((F.m[F.peak] / 31) * 7).toFixed(0)} a week. <a href="#/month/${F.peak}">See the carnage →</a>`,
    ]);
    N.push([
      0,
      'Deadliest day',
      `${fdate(F.topDay[0] + 'T17:00:00Z')}: ${plural(F.topDay[1], 'kill')} in one day (UTC).`,
    ]);
    N.push([
      0,
      'Most viral kill',
      `<a href="#/case/${F.viral.id}">@${esc(F.viral.handle)}</a> killed ${esc(F.viral.victims.join(', '))} for ${fmt(F.viral.likes)} likes.`,
    ]);
    return `<div class="notes">${N.map(([n, t, b]) => `<div class="note"><h3>${n ? `<span class="n">${n}</span>` : ''}${t}</h3><p>${b}</p></div>`).join('')}</div>`;
  };

  /* ---------------- morgue ---------------- */
  const EPI = [
    'Gone too soon (allegedly)',
    'Killed on launch day, back by lunch',
    'Survived by its paying customers',
    'Pronounced dead by a landing page',
    'Cause of death: a demo video',
    'Rest in pricing page',
    'Reports of its death are greatly exaggerated',
    'Taken from us by a waitlist',
    'Murdered in a thread, back by Monday',
    'Still answering support tickets from the afterlife',
    'In lieu of flowers, please star the repo',
    'Died as it lived: in a launch video',
    'Never saw the open-source clone coming',
    'Loved by its users, who did not notice',
    'It’s not dead, it’s pivoting',
    'Here lies a product. Still billing monthly.',
  ];
  const shortD = (s) => fdate(s, { month: 'short', year: '2-digit', timeZone: TZ }).replace(' ', ' ’');
  const tombHTML = (v, i) => {
    const n = v.kills.length;
    const ds = n > 1 ? `${shortD(v.first.created_at)} – ${shortD(v.last.created_at)}` : fdate(v.first.created_at);
    return `<a class="tomb${i === 0 ? ' top1' : ''} rv" href="#/cert/${v.slug}" data-sty="transition-delay:${(i % 6) * 50}ms" aria-label="${esc(v.name)}, killed ${times(n)}. Open death certificate.">
    <span class="t-no">Drawer ${String(i + 1).padStart(2, '0')}</span><span class="t-st${v.brand ? '' : ' unk'}">${v.brand ? 'Still alive' : 'Status unknown'}</span>
    <span class="t-tag">${logo(v.name, 'lg lg-m')}<span><b class="t-n">${esc(v.name)}</b><span class="t-ct">Killed <b>${n}</b>${n === 1 ? ' time' : ' times'} · ${ds}</span></span></span>${i === 0 ? '<span class="crown">The most murdered product on the internet</span>' : ''}<span class="ep">${esc(EPI[hash32(v.slug + 'e') % EPI.length])}</span><span class="t-h" aria-hidden="true"></span></a>`;
  };
  const morgueList = (lim) => {
    const multi = victims.filter((v) => v.kills.length > 1),
      solo = victims.filter((v) => v.kills.length === 1 && v.brand).sort((a, b) => b.likes - a.likes);
    return multi.concat(solo).slice(0, lim);
  };

  /* ---------------- wanted ---------------- */
  const posterHTML = (a, i) => {
    const vs = [...new Set(a.kills.flatMap((k) => k.victims))];
    const r = [-2.2, 1.4, -0.8, 2, -1.5, 0.9][i % 6];
    return `<a class="poster rv" href="#/killer/${esc(a.key)}" data-sty="--r:${r}deg;transition-delay:${(i % 4) * 60}ms"><div class="p-w">WANTED</div><div class="p-for">for <b>${a.kills.length}</b> counts of<br>launch homicide</div><div class="p-ph">${avatar(a, 'av', '200x200')}</div><div class="p-n">${esc(a.name)}</div><div class="p-h">@${esc(a.handle)}</div><p class="p-v">Known victims: ${esc(vs.slice(0, 5).join(', '))}${vs.length > 5 ? ` +${vs.length - 5} more` : ''}</p><div class="p-r"><small>Bounty collected</small>${fmt(a.likes)} likes</div><div class="p-l">Last seen ${fdate(a.kills.at(-1).created_at)}</div></a>`;
  };
  const wantedList = () => killers.filter((a) => a.kills.length > 1);

  /* ---------------- cases view ---------------- */
  let filter = null,
    page = 1;
  const PER = 24;
  const listFor = () => {
    const q = $('#q').value.trim().toLowerCase();
    let L = K.slice();
    if (filter?.type === 'victim') L = L.filter((k) => k.victims.some((v) => slug(v) === filter.v));
    if (filter?.type === 'killer') L = L.filter((k) => k.handle.toLowerCase() === filter.v);
    if (filter?.type === 'month') L = L.filter((k) => k.created_at.startsWith(filter.v));
    if ($('#brands').checked) L = L.filter((k) => k.victims.some((v) => BR.has(v)));
    if (q) L = L.filter((k) => k.hay.includes(q));
    const s = $('#sort').value;
    L.sort(
      s === 'viral'
        ? (a, b) => b.likes - a.likes
        : s === 'old'
          ? (a, b) => a.created_at.localeCompare(b.created_at)
          : s === 'victims'
            ? (a, b) => b.victims.length - a.victims.length || b.likes - a.likes
            : (a, b) => b.created_at.localeCompare(a.created_at),
    );
    return { L, q };
  };
  const renderWall = (append = false) => {
    const { L, q } = listFor();
    const wall = $('#wall');
    const from = append ? (page - 1) * PER : 0,
      slice = L.slice(from, page * PER);
    const html = slice.map((k) => card(k, q)).join('');
    if (append) insertHTML(wall, 'beforeend', html);
    else
      setHTML(
        wall,
        L.length
          ? html
          : `<div class="empty"><b>No bodies found.</b>Maybe it really is alive. <br><br><a class="btn" href="#/cases">Clear the scene</a></div>`,
      );
    $('#more').hidden = L.length <= page * PER;
    $('#more-btn').textContent = `Open more case files (${L.length - page * PER} left)`;
    $('#result-n').textContent = L.length ? `${plural(L.length, 'case')} on file${q ? ` matching “${q}”` : ''}` : '';
    $$('.chip').forEach((c) => c.classList.toggle('on', filter?.type === 'victim' && c.dataset.s === filter.v));
  };
  const renderDossier = async () => {
    const el = $('#dossier');
    if (!filter) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    if (filter.type === 'victim') {
      const v = V[filter.v];
      if (!v) {
        el.hidden = true;
        return;
      }
      const n = v.kills.length;
      setHTML(
        el,
        `<div><p class="eyebrow">Victim #${v.rank} of ${victims.length}</p><h2>${esc(v.name)}</h2><p><span class="status${v.brand ? '' : ' unk'}"><i></i>${v.brand ? 'still alive' : 'status unconfirmed'}</span></p><p>Pronounced dead <b class="big-n">${times(n)}</b> by ${plural(v.killers.size, 'suspect')}, first on ${fdate(v.first.created_at)}. ${fmt(v.likes)} likes at the scene${n > 1 ? 's' : ''}.</p>
      <div class="acts"><button class="btn btn-stamp" type="button" data-dl="${v.slug}">Download death certificate</button>${shareMenu(SHARE.killed(v), '#/check/' + v.slug, () => certBlob(v))}<a class="btn" href="#/cases">All cases</a></div></div>
      <a class="cert-thumb" href="#/cert/${v.slug}" aria-label="Open death certificate"></a>`,
      );
      const u = await certURL(v);
      const t = $('.cert-thumb', el);
      if (t) {
        Object.assign(t.dataset, { paint: 'thumb', key: v.slug });
        const img = document.createElement('img');
        img.src = u;
        img.alt = `Death certificate for ${v.name}`;
        t.replaceChildren(img);
      }
      document.title = `RIP ${v.name}, killed ${times(n)} — We Just Killed`;
    } else if (filter.type === 'killer') {
      const a = A[filter.v];
      if (!a) {
        el.hidden = true;
        return;
      }
      const vs = [...new Set(a.kills.flatMap((k) => k.victims))];
      setHTML(
        el,
        `<div><p class="eyebrow">Suspect file</p><div class="u-sus">${avatar(a, 'av', '200x200')}<div><h2 class="u-m0">${esc(a.name)}</h2><p class="u-m0">@${esc(a.handle)}</p></div></div><p class="u-mt16">${plural(a.kills.length, 'kill claim')} on file. Victims: ${vs.map((v) => `<a href="#/victim/${slug(v)}" class="u-chalk">${esc(v)}</a>`).join(', ')}. Bounty collected: ${fmt(a.likes)} likes.</p>
      <div class="acts"><a class="btn" href="https://x.com/${encodeURIComponent(a.handle)}" target="_blank" rel="noopener noreferrer">Profile on X ↗</a>${shareMenu(SHARE.killer(a), '#/killer/' + a.key)}<a class="btn" href="#/cases">All cases</a></div></div><div></div>`,
      );
      document.title = `Suspect @${a.handle} — We Just Killed`;
    } else if (filter.type === 'month') {
      const n = K.filter((k) => k.created_at.startsWith(filter.v)).length;
      setHTML(
        el,
        `<div><p class="eyebrow">Month in review</p><h2>${esc(mlabel(filter.v))}</h2><p>${plural(n, 'kill claim')} that month.</p><div class="acts"><a class="btn" href="#/timeline">Outbreak report</a><a class="btn" href="#/cases">All cases</a></div></div><div></div>`,
      );
    }
  };

  /* ---------------- evidence board ---------------- */
  let board = null;
  const buildBoard = () => {
    const vset = new Set(victims.filter((v) => v.kills.length > 1).map((v) => v.slug)),
      kset = new Set(killers.filter((a) => a.kills.length > 1).map((a) => a.key));
    K.forEach((k) => {
      const kk = k.handle.toLowerCase();
      k.victims.forEach((v) => {
        const s = slug(v);
        if (vset.has(s)) kset.add(kk);
      });
    });
    K.forEach((k) => {
      const kk = k.handle.toLowerCase();
      if (killers.find((a) => a.key === kk)?.kills.length > 1) k.victims.forEach((v) => vset.add(slug(v)));
    });
    const nodes = [],
      idx = {};
    const R = rng(42);
    vset.forEach((s) => {
      idx['v:' + s] = nodes.length;
      nodes.push({ id: 'v:' + s, t: 'v', v: V[s], x: (R() - 0.5) * 1600, y: (R() - 0.5) * 1100, w: 160, h: 70 });
    });
    kset.forEach((h) => {
      idx['k:' + h] = nodes.length;
      nodes.push({ id: 'k:' + h, t: 'k', a: A[h], x: (R() - 0.5) * 1600, y: (R() - 0.5) * 1100, w: 110, h: 120 });
    });
    const edges = [],
      es = new Set();
    K.forEach((k) => {
      const kk = 'k:' + k.handle.toLowerCase();
      if (idx[kk] == null) return;
      k.victims.forEach((v) => {
        const vv = 'v:' + slug(v);
        const key = kk + '>' + vv;
        if (idx[vv] != null && !es.has(key)) {
          es.add(key);
          edges.push({ s: idx[kk], t: idx[vv], k });
        }
      });
    });
    nodes.forEach((n) => (n.deg = 0));
    edges.forEach((e) => {
      nodes[e.s].deg++;
      nodes[e.t].deg++;
    });
    nodes.forEach((n) => {
      if (n.t === 'v') {
        const c = n.v.kills.length;
        n.big = c >= 5;
        n.w = n.big ? 240 : 170;
        n.h = n.big ? 100 : 74;
      }
    });
    // force layout (deterministic)
    const N = nodes.length;
    const vx = new Float32Array(N),
      vy = new Float32Array(N);
    for (let it = 0; it < 420; it++) {
      const alpha = 1 - it / 420;
      for (let i = 0; i < N; i++)
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i],
            b = nodes[j];
          let dx = a.x - b.x,
            dy = a.y - b.y;
          let d2 = dx * dx + dy * dy || 0.01;
          const d = Math.sqrt(d2);
          const min = ((a.w + b.w) / 2) * 0.62 + ((a.h + b.h) / 2) * 0.4 + 22;
          let f = 9000 / d2;
          if (d < min) f += (((min - d) * 0.5) / d) * d;
          const fx = (dx / d) * f,
            fy = (dy / d) * f;
          vx[i] += fx;
          vy[i] += fy;
          vx[j] -= fx;
          vy[j] -= fy;
        }
      edges.forEach((e) => {
        const a = nodes[e.s],
          b = nodes[e.t];
        const dx = b.x - a.x,
          dy = b.y - a.y,
          d = Math.hypot(dx, dy) || 1;
        const f = (d - 190) * 0.035;
        vx[e.s] += (dx / d) * f;
        vy[e.s] += (dy / d) * f;
        vx[e.t] -= (dx / d) * f;
        vy[e.t] -= (dy / d) * f;
      });
      for (let i = 0; i < N; i++) {
        const n = nodes[i];
        vx[i] -= n.x * 0.012;
        vy[i] -= n.y * 0.018;
        n.x += Math.max(-40, Math.min(40, vx[i] * alpha));
        n.y += Math.max(-40, Math.min(40, vy[i] * alpha));
        vx[i] *= 0.55;
        vy[i] *= 0.55;
      }
    }
    nodes.forEach((n) => (n.r = ((hash32(n.id) % 11) - 5) * 0.9));
    return { nodes, edges, z: 1, tx: 0, ty: 0 };
  };
  const renderBoard = () => {
    if (!board) board = buildBoard();
    const { nodes, edges } = board,
      world = $('#world'),
      svg = $('#strings');
    if (!$('#nodes').children.length) {
      setHTML(
        $('#nodes'),
        nodes
          .map((n, i) =>
            n.t === 'v'
              ? `<div class="nd nd-v${n.big ? ' bigv' : ''}" data-n="${i}" data-sty="--r:${n.r}deg" tabindex="0" role="button" aria-label="Victim ${esc(n.v.name)}, killed ${times(n.v.kills.length)}"><div class="t">${esc(n.v.name)}</div><div class="c">killed ${n.v.kills.length}×</div></div>`
              : `<div class="nd nd-k${n.a.kills.length > 1 ? ' multi' : ''}" data-n="${i}" data-sty="--r:${n.r}deg" tabindex="0" role="button" aria-label="Suspect @${esc(n.a.handle)}, ${plural(n.a.kills.length, 'kill')}">${avatar(n.a, 'av', '200x200')}<div class="h">@${esc(n.a.handle)}${n.a.kills.length > 1 ? ` ×${n.a.kills.length}` : ''}</div></div>`,
          )
          .join(''),
      );
      setHTML(svg, edges.map((e, i) => `<path data-e="${i}"/>`).join(''));
      const vbig = victims[0];
      setHTML(
        $('#board-legend'),
        `Index cards are victims, polaroids are suspects, each red string is a kill claim. ${esc(vbig.name)} alone has ${plural(vbig.killers.size, 'different suspect')}. Tap anything to follow the string.`,
      );
      bindBoard();
    }
    const pos = () => {
      $$('.nd', world).forEach((d) => {
        const n = nodes[+d.dataset.n];
        d.style.left = n.x + 'px';
        d.style.top = n.y + 'px';
      });
      edges.forEach((e, i) => {
        const a = nodes[e.s],
          b = nodes[e.t];
        const mx = (a.x + b.x) / 2,
          my = (a.y + b.y) / 2 + Math.hypot(b.x - a.x, b.y - a.y) * 0.1;
        svg.children[i].setAttribute('d', `M${a.x} ${a.y - a.h / 2 + 4}Q${mx} ${my} ${b.x} ${b.y - b.h / 2 + 4}`);
      });
    };
    board.pos = pos;
    pos();
    if (!board.fitted) {
      fit();
      board.fitted = true;
    }
  };
  const applyT = () => {
    $('#world').style.transform = `translate(${board.tx}px,${board.ty}px) scale(${board.z})`;
  };
  const fit = () => {
    const el = $('#board'),
      { nodes } = board;
    const xs = nodes.map((n) => n.x),
      ys = nodes.map((n) => n.y);
    const minx = Math.min(...xs) - 140,
      maxx = Math.max(...xs) + 140,
      miny = Math.min(...ys) - 110,
      maxy = Math.max(...ys) + 110;
    const W = el.clientWidth,
      H = el.clientHeight;
    const z = Math.min(W / (maxx - minx), H / (maxy - miny)) * (W < 700 ? 1.6 : 1.05);
    board.z = Math.max(0.25, Math.min(1.2, z));
    board.tx = W / 2 - ((minx + maxx) / 2) * board.z;
    board.ty = H / 2 - ((miny + maxy) / 2) * board.z + (W < 700 ? 0 : 20);
    applyT();
  };
  const zoomAt = (f, cx, cy) => {
    const z = Math.max(0.2, Math.min(2.6, board.z * f));
    const k = z / board.z;
    board.tx = cx - (cx - board.tx) * k;
    board.ty = cy - (cy - board.ty) * k;
    board.z = z;
    applyT();
  };
  const focusNode = (i) => {
    const el = $('#board'),
      { nodes, edges } = board;
    const n = nodes[i];
    const nb = new Set([i]);
    edges.forEach((e, j) => {
      const hit = e.s === i || e.t === i;
      $('#strings').children[j].classList.toggle('hi', hit);
      if (hit) {
        nb.add(e.s);
        nb.add(e.t);
      }
    });
    el.classList.add('focus');
    $$('.nd').forEach((d) => d.classList.toggle('hi', nb.has(+d.dataset.n)));
    const p = $('#board-panel');
    p.hidden = false;
    if (n.t === 'v') {
      const v = n.v;
      setHTML(
        p,
        `<button class="x" type="button" data-unfocus aria-label="Close">×</button><p class="eyebrow u-pmute">Victim #${v.rank}</p><h3>${esc(v.name)}</h3><p>Killed ${times(v.kills.length)} by ${plural(v.killers.size, 'suspect')}. Status: ${v.brand ? '<b class="u-alive">still alive</b>' : 'unconfirmed'}.</p><ul>${v.kills
          .slice()
          .reverse()
          .slice(0, 8)
          .map(
            (k) =>
              `<li><a href="#/case/${k.id}">@${esc(k.handle)}</a> · ${fdate(k.created_at)} · ♥ ${fmt(k.likes)}</li>`,
          )
          .join(
            '',
          )}</ul><div class="acts"><a class="btn btn-sm" href="#/cert/${v.slug}">Certificate</a><a class="btn btn-sm" href="#/victim/${v.slug}">Case files</a></div>`,
      );
    } else {
      const a = n.a;
      setHTML(
        p,
        `<button class="x" type="button" data-unfocus aria-label="Close">×</button><p class="eyebrow u-pmute">Suspect</p><h3>@${esc(a.handle)}</h3><p>${esc(a.name)} · ${plural(a.kills.length, 'kill claim')} · ${fmt(a.likes)} likes collected.</p><ul>${a.kills
          .slice()
          .reverse()
          .slice(0, 8)
          .map((k) => `<li><a href="#/case/${k.id}">${esc(k.victims.join(', '))}</a> · ${fdate(k.created_at)}</li>`)
          .join('')}</ul><div class="acts"><a class="btn btn-sm" href="#/killer/${esc(a.key)}">Suspect file</a></div>`,
      );
    }
    Sound.play('paper');
  };
  const unfocus = () => {
    $('#board').classList.remove('focus');
    $$('.nd.hi').forEach((d) => d.classList.remove('hi'));
    $$('#strings .hi').forEach((p) => p.classList.remove('hi'));
    $('#board-panel').hidden = true;
  };
  const bindBoard = () => {
    const el = $('#board');
    const pts = new Map();
    let drag = null,
      pinch = null,
      moved = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.board-ctl,.board-panel')) return;
      el.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: board.z };
        drag = null;
        return;
      }
      const nd = e.target.closest('.nd');
      drag = nd ? { n: +nd.dataset.n, el: nd, x: e.clientX, y: e.clientY } : { pan: true, x: e.clientX, y: e.clientY };
      if (nd) nd.classList.add('dragging');
      else el.classList.add('drag');
    });
    el.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size === 2) {
        const [a, b] = [...pts.values()],
          d = Math.hypot(a.x - b.x, a.y - b.y),
          r = el.getBoundingClientRect();
        zoomAt((pinch.z * d) / pinch.d / board.z, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
        moved = 99;
        return;
      }
      if (!drag) return;
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      moved += Math.abs(dx) + Math.abs(dy);
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (drag.pan) {
        board.tx += dx;
        board.ty += dy;
        applyT();
      } else {
        const n = board.nodes[drag.n];
        n.x += dx / board.z;
        n.y += dy / board.z;
        board.pos();
      }
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (!drag) return;
      if (!drag.pan) {
        drag.el.classList.remove('dragging');
        if (moved < 6) focusNode(drag.n);
      } else if (moved < 6 && !e.target.closest('.nd')) unfocus();
      el.classList.remove('drag');
      drag = null;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const r = el.getBoundingClientRect();
        zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX - r.left, e.clientY - r.top);
      },
      { passive: false },
    );
    el.addEventListener('keydown', (e) => {
      const nd = e.target.closest?.('.nd');
      if (nd && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        focusNode(+nd.dataset.n);
      }
      if (e.key === 'Escape') unfocus();
      if (e.key === '+' || e.key === '=') zoomAt(1.2, el.clientWidth / 2, el.clientHeight / 2);
      if (e.key === '-') zoomAt(0.83, el.clientWidth / 2, el.clientHeight / 2);
    });
    $('.board-ctl').addEventListener('click', (e) => {
      const b = e.target.closest('[data-z]');
      if (!b) return;
      const z = +b.dataset.z;
      z ? zoomAt(z, el.clientWidth / 2, el.clientHeight / 2) : fit();
    });
    $('#board-panel').addEventListener('click', (e) => {
      if (e.target.closest('[data-unfocus]')) unfocus();
    });
    addEventListener('resize', () => {
      if (!$('#v-board').hidden) fit();
    });
  };

  /* ---------------- router ---------------- */
  const VIEWS = ['home', 'cases', 'board', 'morgue', 'wanted', 'timeline', 'report'];
  const done = {};
  let underlying = null,
    inAppNav = false,
    curKey = null;
  const showView = (v) => {
    VIEWS.forEach((n) => {
      $('#v-' + n).hidden = n !== v;
    });
    $$('[data-nav]').forEach((a) =>
      a.classList.toggle('on', a.dataset.nav === v || (v === 'cases' && a.dataset.nav === 'cases' && filter)),
    );
    document.body.classList.toggle('board-on', v === 'board');
  };
  const renderView = (v) => {
    if (v === 'home' && !done.home) {
      done.home = 1;
      initHero();
      initFeed();
      const F = facts();
      $('#h-outbreak-sub').textContent =
        `${plural(K.length, 'kill claim')} on file, from ${fdate(F.first.created_at)} to ${fdate(F.last.created_at)}. The curve speaks for itself.`;
      setHTML($('#h-chart'), chartHTML(false));
      setHTML(
        $('#h-graves'),
        morgueList(innerWidth <= 560 ? 7 : 11)
          .map(tombHTML)
          .join(''),
      );
      setHTML(
        $('#h-posters'),
        wantedList()
          .slice(0, innerWidth <= 560 ? 4 : 5)
          .map(posterHTML)
          .join(''),
      );
      setHTML(
        $('#h-wall'),
        byNew
          .slice(0, 9)
          .map((k) => card(k))
          .join(''),
      );
    }
    if (v === 'morgue' && !done.morgue) {
      done.morgue = 1;
      setHTML($('#graves'), morgueList(60).map(tombHTML).join(''));
    }
    if (v === 'wanted' && !done.wanted) {
      done.wanted = 1;
      setHTML($('#posters'), wantedList().map(posterHTML).join(''));
    }
    if (v === 'timeline' && !done.timeline) {
      done.timeline = 1;
      setHTML($('#t-chart'), chartHTML(true));
    }
    if (v === 'cases' && !done.cases) {
      done.cases = 1;
      setHTML(
        $('#chips'),
        victims
          .filter((v) => v.kills.length > 1)
          .slice(0, 24)
          .map(
            (v) =>
              `<a class="chip" data-s="${v.slug}" href="#/victim/${v.slug}">${esc(v.name)}<b>${v.kills.length}</b></a>`,
          )
          .join(''),
      );
    }
    if (v === 'board') renderBoard();
    reveal($('#v-' + v));
  };
  const TITLES = {
    home: 'Is your product dead?',
    cases: 'Case files — We Just Killed',
    board: 'Evidence board — We Just Killed',
    morgue: 'The morgue — We Just Killed',
    wanted: 'Most wanted — We Just Killed',
    timeline: 'Outbreak report — We Just Killed',
    report: 'Report a kill — We Just Killed',
  };
  const route = () => {
    const raw = location.hash || '#/';
    const [path, qs] = raw.replace(/^#\/?/, '').split('?');
    const [a, ...rest] = path.split('/');
    const b = safeDecode(rest.join('/'));
    if (isModalRoute(raw)) {
      if (!underlying) {
        underlying = a === 'case' ? '#/cases' : a === 'cert' && V[b] ? '#/victim/' + b : '#/';
        routeView(underlying);
      }
      if (a === 'verdict') history.replaceState(null, '', '#/check/' + rest.join('/'));
      const ok = a === 'case' ? openCase(b) : a === 'cert' ? openCert(b) : openCheck(has(V, b) ? V[b].name : b);
      if (ok === false) {
        history.replaceState(null, '', underlying);
        hideModal();
        routeView(underlying);
      }
      return;
    }
    if (modalOpen) hideModal();
    underlying = raw;
    routeView(raw, qs);
  };
  const routeView = (h, qs) => {
    const [path] = h.replace(/^#\/?/, '').split('?');
    const [a, ...rest] = path.split('/');
    const b = safeDecode(rest.join('/'));
    let v = VIEWS.includes(a) ? a : a === 'victim' || a === 'killer' || a === 'month' ? 'cases' : 'home';
    const nf =
      a === 'victim' && b
        ? { type: 'victim', v: b }
        : a === 'killer' && b
          ? { type: 'killer', v: b.toLowerCase() }
          : a === 'month' && MONTH_RE.test(b)
            ? { type: 'month', v: b }
            : null;
    const key = h;
    if (key === curKey) return;
    const sameView = curKey && !$('#v-' + v).hidden;
    curKey = key;
    if (v === 'cases') {
      filter = nf;
      if (qs) {
        const p = new URLSearchParams(qs);
        if (p.get('q') != null) $('#q').value = p.get('q');
      }
      page = 1;
    }
    showView(v);
    renderView(v);
    if (v === 'cases') {
      renderWall();
      renderDossier();
    }
    document.title = v === 'cases' && filter ? document.title : TITLES[v];
    if (!(v === 'home' && sameView)) scrollTo({ top: 0, behavior: 'instant' });
  };
  addEventListener('hashchange', () => {
    inAppNav = true;
    route();
  });

  /* ---------------- events ---------------- */
  const bindEvents = () => {
    $('#sound').addEventListener('click', () => Sound.set(!Sound.on));
    let qt;
    $('#q').addEventListener('input', () => {
      clearTimeout(qt);
      qt = setTimeout(() => {
        page = 1;
        renderWall();
      }, 140);
    });
    // a share menu opening: render its card in advance so native share keeps the user gesture
    document.addEventListener(
      'toggle',
      (e) => {
        const d = e.target;
        if (!d.matches?.('details.share') || !d.open) return;
        Sound.play('paper');
        shares.get(d.dataset.shareId)?.card?.();
      },
      true,
    );
    // optional local logo for the "marked safe" card: decoded in the browser, never uploaded
    document.addEventListener('change', async (e) => {
      if (e.target.id !== 'logo-file') return;
      const f = e.target.files?.[0];
      if (!f) return;
      if (!/^image\/(png|jpeg|webp|gif)$/.test(f.type) || f.size > 5e6) {
        toast('That file will not fit in the evidence bag. PNG, JPG or WebP under 5 MB.');
        return;
      }
      try {
        safeLogo = await createImageBitmap(f);
      } catch {
        toast('Could not read that image.');
        return;
      }
      const name = $('#modal-title')?.textContent || 'Your product';
      const u = URL.createObjectURL(f),
        im = document.createElement('img');
      im.className = 'lg lg-l';
      im.alt = '';
      im.src = u;
      im.onload = () => URL.revokeObjectURL(u);
      $('#r-logo')?.replaceChildren(im);
      fillSlot($('#modal-body .r-slot'), await safeBlob(name), `Marked safe card for ${name}`, 'safe', name);
      Sound.play('paper');
    });
    $('#sort').onchange = () => {
      Sound.play('paper');
      page = 1;
      renderWall();
    };
    $('#brands').onchange = () => {
      Sound.play('paper');
      page = 1;
      renderWall();
    };
    $('#more-btn').onclick = () => {
      page++;
      renderWall(true);
    };
    if (io)
      new IntersectionObserver(
        (es) => {
          if (es[0].isIntersecting && !$('#v-cases').hidden && !$('#more').hidden && page < 6) {
            page++;
            renderWall(true);
          }
        },
        { rootMargin: '600px' },
      ).observe($('#more'));
    const dq = $('#dead-q'),
      ul = $('#dead-sug');
    dq.addEventListener('input', sug);
    dq.addEventListener('blur', () => setTimeout(() => (ul.hidden = true), 150));
    dq.addEventListener('focus', sug);
    dq.addEventListener('keydown', (e) => {
      const li = $$('li', ul);
      if (ul.hidden || !li.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + li.length) % li.length;
        li.forEach((l, i) => l.setAttribute('aria-selected', i === sel));
        dq.setAttribute('aria-activedescendant', 'sg' + sel);
      }
      if (e.key === 'Escape') ul.hidden = true;
    });
    ul.addEventListener('mousedown', (e) => {
      const li = e.target.closest('li');
      if (li) {
        e.preventDefault();
        ul.hidden = true;
        location.hash = '#/check/' + li.dataset.v;
      }
    });
    $('#dead-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const li = sel >= 0 && !ul.hidden ? $$('li', ul)[sel] : null;
      ul.hidden = true;
      const q = dq.value.trim();
      if (!q && !li) {
        dq.focus();
        return;
      }
      const { primary } = lookup(q);
      location.hash =
        '#/check/' +
        (li ? li.dataset.v : primary && norm(primary.name) === norm(q) ? primary.slug : encodeURIComponent(q));
    });
    document.addEventListener('click', (e) => {
      const t = e.target;
      const tr = t.closest('[data-try]');
      if (tr) {
        dq.value = tr.dataset.try;
        location.hash = '#/check/' + (lookup(tr.dataset.try).primary?.slug || encodeURIComponent(tr.dataset.try));
        return;
      }
      const co = t.closest('[data-copy-only]');
      if (co) {
        copy(pageURL(co.dataset.copyOnly));
        co.closest('details')?.removeAttribute('open');
        return;
      }
      const ns = t.closest('[data-share]');
      if (ns) {
        nativeShare(ns.dataset.share);
        return;
      }
      if (t.closest('.share-m a')) {
        t.closest('details')?.removeAttribute('open');
        return;
      }
      $$('details.share[open]').forEach((d) => !d.contains(t) && d.removeAttribute('open'));
      if (t.closest('[data-dl-safe]')) {
        const name = $('#modal-title')?.textContent || 'Your product';
        safeBlob(name).then((b) => {
          saveBlob(b, `marked-safe-${slug(name)}.png`);
          Sound.play('shutter');
          toast('Card saved. Go gloat.');
        });
        return;
      }
      const c = t.closest('[data-copy]');
      if (c) {
        const u = pageURL(c.dataset.copy);
        if (navigator.share && matchMedia('(pointer:coarse)').matches)
          navigator.share({ title: 'We Just Killed', url: u }).catch(() => {});
        else copy(u);
        return;
      }
      const d = t.closest('[data-dl]');
      if (d) {
        if (has(V, d.dataset.dl)) downloadCert(V[d.dataset.dl]);
        return;
      }
      if (t.closest('[data-random]')) {
        const k = K[Math.floor(Math.random() * K.length)];
        location.hash = '#/case/' + k.id;
        return;
      }
      const m = t.closest('.more-txt');
      if (m) {
        m.previousElementSibling.classList.remove('clamp');
        m.remove();
      }
    });
  };

  /* ---------------- boot ---------------- */
  Promise.all([loadData(), loadLogos()])
    .then((data) => {
      prep(data[0]);
      $('#snap').textContent = D.meta?.generated_at
        ? fdate(D.meta.generated_at + 'T17:00:00Z')
        : 'the day the file was opened';
      $$('.n-kills').forEach((e) => (e.textContent = K.length));
      if (Sound.on) {
        const b = $('#sound');
        b.setAttribute('aria-pressed', 'true');
        b.title = 'Sound is on';
      }
      bindEvents();
      route();
      window.WJK_API = { drawCert: (s) => (has(V, s) ? drawCert(V[s]) : null), V };
    })
    .catch((err) => {
      console.error(err);
      insertHTML(
        $('#main'),
        'afterbegin',
        '<p class="nojs">The evidence locker is jammed (could not load kills.json). Try serving this folder over HTTP.</p>',
      );
    });
})();
