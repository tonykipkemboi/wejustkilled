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
  const SITE =
    /^(localhost|127\.|0\.0\.0\.0|$)/.test(location.hostname) || location.protocol === 'file:'
      ? 'wejustkilled.com'
      : location.host;
  const pageURL = (h) => location.href.split('#')[0] + h;
  const intent = (text, url) =>
    'https://x.com/intent/post?text=' + encodeURIComponent(text) + (url ? '&url=' + encodeURIComponent(url) : '');
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
    knife:
      '<svg class="kf-x" viewBox="0 0 44 24" aria-hidden="true"><path d="M2 13 L28 6 L40 10 L28 15 Z" fill="currentColor"/><rect x="28" y="8" width="3" height="8" rx="1" fill="#888" transform="rotate(-8 29 12)"/><rect x="31" y="9" width="11" height="5" rx="2" fill="#5a3b26" transform="rotate(-8 36 12)"/></svg>',
    skull:
      '<svg class="kf-x" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C7 2 3.5 5.6 3.5 10.2c0 2.7 1.2 4.6 3 5.8V19a1 1 0 001 1h1.5v-2h1.5v2h3v-2h1.5v2H16.5a1 1 0 001-1v-3c1.8-1.2 3-3.1 3-5.8C20.5 5.6 17 2 12 2zM8.5 13.5a2 2 0 110-4 2 2 0 010 4zm7 0a2 2 0 110-4 2 2 0 010 4z"/></svg>',
    heart:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.8 0 5.9 3.8 4.4 7.2C19.5 16.4 12 21 12 21z"/></svg>',
    rt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 9V7a2 2 0 012-2h11l-3-3M20 15v2a2 2 0 01-2 2H7l3 3"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    chk: '<svg class="chk" viewBox="0 0 24 24" aria-label="Verified account" role="img"><path fill="currentColor" d="M12 1l2.6 2.3 3.4-.5.9 3.3 3.1 1.5-1.3 3.2 1.3 3.2-3.1 1.5-.9 3.3-3.4-.5L12 23l-2.6-2.3-3.4.5-.9-3.3-3.1-1.5L3.3 13 2 9.8l3.1-1.5.9-3.3 3.4.5z"/><path d="M8 12.3l2.6 2.6L16.2 9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mag: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  };

  /* ---------------- sound (off by default) ---------------- */
  const Sound = (() => {
    let on = false,
      ctx = null;
    try {
      on = localStorage.getItem('wjk-sound') === '1';
    } catch {
      /* storage blocked: keep sound off */
    }
    const ac = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());
    const thud = () => {
      if (!on) return;
      const c = ac(),
        t = c.currentTime;
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.22);
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.32);
      const b = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate),
        d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
      const n = c.createBufferSource(),
        ng = c.createGain();
      n.buffer = b;
      ng.gain.value = 0.25;
      n.connect(ng).connect(c.destination);
      n.start(t);
    };
    const tick = () => {
      if (!on) return;
      const c = ac(),
        t = c.currentTime;
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = 'square';
      o.frequency.value = 1800;
      g.gain.setValueAtTime(0.025, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.05);
    };
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
        ac().resume?.();
        thud();
      }
    };
    return {
      thud,
      tick,
      set,
      get on() {
        return on;
      },
    };
  })();

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
  const avatar = (o, cls = 'av', sz = 'bigger') =>
    o.avatar
      ? `<img class="${cls}" src="${esc(avSize(o.avatar, sz))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-i="${esc((o.name || o.handle || '?').trim()[0] || '?')}">`
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
  <header class="card-h"><a href="#/case/${k.id}">CASE Nº ${k.case}</a>${k.conf ? `<span class="det" title="Our detectives re-checked this post and its replies">${I.mag}verified<span class="det-x"> by detectives</span></span>` : ''}<time datetime="${esc(k.created_at)}">${fdate(k.created_at)}</time></header>
  ${alive ? '<div class="stamp" aria-label="Victim still alive">STILL ALIVE</div>' : ''}
  <div class="card-v">Victim${k.victims.length > 1 ? 's' : ''} ${k.victims.map((v) => `<a class="vtag" href="#/victim/${slug(v)}">${esc(v)}</a>`).join('')}</div>
  <div class="who">${avatar(k)}<div><div class="who-n">${esc(k.name)}${k.verified ? I.chk : ''}</div><div class="who-h"><a href="#/killer/${esc(k.handle.toLowerCase())}">@${esc(k.handle)}</a>${k.killer ? ` · weapon: ${esc(k.killer)}` : ''}</div></div></div>
  <p class="q${long ? ' clamp' : ''}">${linkify(k.text, q)}</p>${long ? '<button class="more-txt" type="button">Read the full statement ↓</button>' : ''}
  ${k.image && k.url ? `<a class="ev" href="${esc(k.url)}" target="_blank" rel="noopener noreferrer" aria-label="Evidence photo, open the original post"><img src="${esc(k.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span>exhibit A</span></a>` : ''}
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
  const copy = async (url, msg = 'Link copied 🔪') => {
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
        `claimed by <a href="${esc(r.k.url)}" target="_blank" rel="noopener noreferrer">@${esc(r.k.handle)}</a> · ${fdate(r.k.created_at)} · ${fmt(r.k.likes)} likes at the scene · <a href="#/victim/${slug(r.v)}">death certificate →</a>`,
      );
    };
    let i = 0;
    hv.textContent = list[0].v.toUpperCase() + '.';
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
        Sound.tick();
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
      await type(list[i].v.toUpperCase() + '.');
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
      'Try: ' + tries.map((t) => `<button type="button" data-try="${esc(t)}">${esc(t)}</button>`).join(' · '),
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
        return `<li><a class="kf multi${isNew ? ' new' : ''}" href="#/victim/${v.slug}"><span class="kf-k">MULTI-KILL</span>${I.skull}<span class="kf-v">${esc(v.name)} ×${v.kills.length}</span></a></li>`;
      }
      const k = it.k;
      return `<li><a class="kf${isNew ? ' new' : ''}" href="#/case/${k.id}" title="${esc(k.name)} claims to have killed ${esc(k.victims.join(', '))}">${avatar(k, 'av', 'normal')}<span class="kf-k">${esc(k.killer || k.name)}</span>${I.knife}<span class="kf-v">${esc(k.victims.join(' + '))}</span></a></li>`;
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
  const verdictHTML = (q) => {
    const { primary: v, rel } = lookup(q);
    if (!v) {
      const n = norm(q),
        wit = n.length >= 3 ? K.filter((k) => norm(k.text).includes(n)).length : 0,
        name = String(q).trim().slice(0, 40);
      return `<div class="verdict"><p class="eyebrow">Coroner’s verdict</p><h2 class="vname" id="modal-title">${esc(name || '???')}</h2><div class="vstamp g">NOT DEAD YET</div>
      <p class="vstat">No launch post on file claims to have killed it.</p><p class="vsub">Give it a week.${wit ? ` It has been spotted at <a href="#/cases?q=${encodeURIComponent(name)}">${plural(wit, 'crime scene')}</a> though, so watch your back.` : ''}</p>
      <div class="m-acts"><a class="btn" href="#/morgue">Browse the morgue</a><a class="btn" target="_blank" rel="noopener noreferrer" href="${intent(`I checked if ${name} is dead. Verdict: not dead yet. Give it a week 🔪`, pageURL('#/verdict/' + encodeURIComponent(name)))}">Share on X</a></div></div>`;
    }
    const n = v.kills.length,
      alive = v.brand;
    const stamp = n >= 5 ? `SERIAL VICTIM · ${n}×` : n === 1 ? 'KILLED ONCE' : `KILLED ${n} TIMES`;
    const ks = [...new Set(v.kills.map((k) => k.handle.toLowerCase()))].map((h) => A[h]);
    const family = rel.length
      ? `<p class="vrel">Related victims: ${rel
          .slice(0, 5)
          .map((r) => `<a href="#/verdict/${r.slug}">${esc(r.name)}</a> (${r.kills.length})`)
          .join(', ')}${rel.length > 5 ? '…' : ''}</p>`
      : '';
    const shareText = alive
      ? `${v.name} has been killed ${times(n)} and is somehow still alive 🔪`
      : `“${v.name}” has been killed ${times(n)}. Status: unconfirmed, probably fine 🔪`;
    return `<div class="verdict"><p class="eyebrow">Coroner’s verdict · Victim #${v.rank} of ${victims.length}</p><h2 class="vname" id="modal-title">${esc(v.name)}</h2><div class="vstamp">${stamp}</div>
    <p class="vstat">Status: ${alive ? '<b>still alive.</b>' : '<b class="q">unconfirmed. Probably fine.</b>'}</p>
    <p class="vsub">First pronounced dead ${fdate(v.first.created_at)} by <a href="#/case/${v.first.id}">@${esc(v.first.handle)}</a>${n > 1 ? `, most recently ${fdate(v.last.created_at)} by <a href="#/case/${v.last.id}">@${esc(v.last.handle)}</a>` : ''}. ${fmt(v.likes)} likes at the scene${n > 1 ? 's' : ''}.</p>
    <div class="vkillers" aria-label="Suspects">${ks
      .slice(0, 12)
      .map((a) => avatar(a))
      .join('')}</div>${family}
    <div class="m-acts"><a class="btn btn-red" href="#/cert/${v.slug}">📜 Death certificate</a><a class="btn" href="#/victim/${v.slug}">Read ${n > 1 ? `all ${n} case files` : 'the case file'}</a><a class="btn" target="_blank" rel="noopener noreferrer" href="${intent(shareText, pageURL('#/verdict/' + v.slug))}">Share on X</a></div></div>`;
  };

  /* ---------------- death certificate (canvas → PNG) ---------------- */
  const fontsReady = (() => {
    let p;
    return () =>
      (p ||= Promise.all(
        [
          '400 40px Anton',
          '400 20px "Special Elite"',
          'italic 900 40px "Playfair Display"',
          '700 40px "Playfair Display"',
          '400 30px "Permanent Marker"',
          '600 20px Inter',
        ].map((f) => document.fonts?.load(f).catch(() => 0)),
      ).then(() => 0));
  })();
  const causeOf = (v) => {
    const k = [...v.kills].sort((a, b) => b.likes - a.likes)[0];
    const t = k.text
      .replace(/https?:\/\/\S+/g, '')
      // eslint-disable-next-line security/detect-unsafe-regex -- single code-point alternation, no nested quantifiers (no ReDoS)
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uf8ff]|\u{FE0F}|\u{200D}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
    const s = t.split(/(?<=[.!?])\s+/).find((x) => /kill/i.test(x)) || t;
    return { k, q: s.length > 110 ? s.slice(0, 107).replace(/\s\S*$/, '') + '…' : s };
  };
  const drawCert = async (v) => {
    await fontsReady();
    const W = 1500,
      H = 1000,
      c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const R = rng(hash32(v.slug));
    // paper
    const g = x.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 900);
    g.addColorStop(0, '#f5ecd7');
    g.addColorStop(1, '#dcc9a2');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) {
      x.fillStyle = `rgba(${R() < 0.5 ? '90,60,30' : '255,255,255'},${R() * 0.07})`;
      x.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2);
    }
    for (let i = 0; i < 5; i++) {
      const sx = R() * W,
        sy = R() * H,
        rr = 40 + R() * 120;
      const sg = x.createRadialGradient(sx, sy, 0, sx, sy, rr);
      sg.addColorStop(0, 'rgba(140,100,50,.07)');
      sg.addColorStop(1, 'rgba(140,100,50,0)');
      x.fillStyle = sg;
      x.fillRect(sx - rr, sy - rr, rr * 2, rr * 2);
    }
    // border + guilloche band
    const INK = '#2a1d14',
      RED = '#b3121c',
      MUTE = '#7b6248';
    x.strokeStyle = INK;
    x.lineWidth = 4;
    x.strokeRect(34, 34, W - 68, H - 68);
    x.lineWidth = 1.2;
    x.strokeRect(46, 46, W - 92, H - 92);
    x.strokeRect(78, 78, W - 156, H - 156);
    x.save();
    x.beginPath();
    x.rect(46, 46, W - 92, H - 92);
    x.rect(78, 78, W - 156, H - 156);
    x.clip('evenodd');
    x.strokeStyle = 'rgba(122,30,30,.55)';
    x.lineWidth = 0.9;
    for (const ph of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      x.beginPath();
      for (let t = 0; t <= 1; t += 0.0006) {
        const per = 2 * (W - 124) + 2 * (H - 124),
          d = t * per;
        let px,
          py,
          nx = 0,
          ny = 0;
        if (d < W - 124) {
          px = 62 + d;
          py = 62;
          ny = 1;
        } else if (d < W - 124 + H - 124) {
          px = W - 62;
          py = 62 + d - (W - 124);
          nx = 1;
        } else if (d < 2 * (W - 124) + H - 124) {
          px = W - 62 - (d - (W - 124) - (H - 124));
          py = H - 62;
          ny = 1;
        } else {
          px = 62;
          py = H - 62 - (d - 2 * (W - 124) - (H - 124));
          nx = 1;
        }
        const o = Math.sin(d / 9 + ph) * 12;
        px += nx * o;
        py += ny * o;
        t ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.stroke();
    }
    x.restore();
    const ctr = (t, y, f, col = INK, ls = 0) => {
      x.font = f;
      x.fillStyle = col;
      x.textAlign = 'center';
      if ('letterSpacing' in x) x.letterSpacing = ls + 'px';
      x.fillText(t, W / 2, y);
      if ('letterSpacing' in x) x.letterSpacing = '0px';
    };
    ctr('DEPARTMENT OF LAUNCH HOMICIDE  ·  ' + SITE.toUpperCase(), 140, '400 21px "Special Elite"', MUTE, 4);
    ctr('Certificate of Death', 228, 'italic 900 86px "Playfair Display"', INK);
    ctr(
      'This certifies that the product named below has been publicly pronounced dead on X',
      276,
      '400 21px "Special Elite"',
      MUTE,
    );
    // name
    let fs = 116;
    const nm = v.name.toUpperCase();
    x.font = `400 ${fs}px Anton`;
    while (x.measureText(nm).width > 1120 && fs > 50) {
      fs -= 4;
      x.font = `400 ${fs}px Anton`;
    }
    ctr(nm, 300 + fs * 0.92, `400 ${fs}px Anton`, INK, 2);
    const ny = 300 + fs * 0.92 + 22;
    x.strokeStyle = INK;
    x.lineWidth = 1.5;
    x.beginPath();
    x.moveTo(330, ny);
    x.lineTo(W - 330, ny);
    x.stroke();
    // fields
    const n = v.kills.length,
      ks = [...new Set(v.kills.map((k) => '@' + k.handle))],
      { q: cq } = causeOf(v);
    const wrap = (t, w) => {
      const out = [];
      let line = '';
      for (const word of t.split(' ')) {
        const tryL = line ? line + ' ' + word : word;
        if (x.measureText(tryL).width > w && line) {
          out.push(line);
          line = word;
        } else line = tryL;
      }
      if (line) out.push(line);
      if (out.length > 2) {
        out.length = 2;
        out[1] = out[1].replace(/\s?\S*$/, '…');
      }
      return out;
    };
    const field = (lx, y, label, val, w, vf = '700 31px "Playfair Display"') => {
      x.textAlign = 'left';
      x.font = '400 17px "Special Elite"';
      x.fillStyle = MUTE;
      if ('letterSpacing' in x) x.letterSpacing = '3px';
      x.fillText(label, lx, y);
      if ('letterSpacing' in x) x.letterSpacing = '0px';
      x.font = vf;
      x.fillStyle = INK;
      wrap(val, w).forEach((l, i) => x.fillText(l, lx, y + 38 + i * 34));
    };
    const top = ny + 54,
      L = 150,
      M = 790,
      G = 96,
      wit = `${fmt(v.likes)} likes${v.views ? ' · ' + fmt(v.views) + ' views' : ''}`;
    field(L, top, 'TIMES PRONOUNCED DEAD', n === 1 ? 'Once' : `${n} times`, 560, '700 34px "Playfair Display"');
    field(
      M,
      top,
      'FIRST REPORTED DEATH',
      `${fdate(v.first.created_at)} · @${v.first.handle}`,
      560,
      '700 28px "Playfair Display"',
    );
    field(L, top + G, 'CAUSE OF DEATH', `“${cq}”`, 580, 'italic 900 24px "Playfair Display"');
    field(
      M,
      top + G,
      n > 1 ? 'MOST RECENT DEATH' : 'WITNESSES AT THE SCENE',
      n > 1 ? `${fdate(v.last.created_at)} · @${v.last.handle}` : wit,
      560,
      '700 28px "Playfair Display"',
    );
    field(
      L,
      top + 2 * G,
      ks.length > 1 ? `KNOWN KILLERS (${ks.length})` : 'KNOWN KILLER',
      ks.slice(0, 4).join(', ') + (ks.length > 4 ? ` +${ks.length - 4} more` : ''),
      580,
      '700 25px "Playfair Display"',
    );
    if (n > 1) field(M, top + 2 * G, 'WITNESSES AT THE SCENES', wit, 560, '700 28px "Playfair Display"');
    // seal
    const sx = 196,
      sy = 838;
    x.save();
    x.translate(sx, sy);
    x.strokeStyle = RED;
    x.fillStyle = RED;
    x.globalAlpha = 0.85;
    x.lineWidth = 3;
    x.beginPath();
    x.arc(0, 0, 62, 0, 7);
    x.stroke();
    x.lineWidth = 1.2;
    x.beginPath();
    x.arc(0, 0, 55, 0, 7);
    x.stroke();
    x.beginPath();
    x.arc(0, 0, 33, 0, 7);
    x.stroke();
    x.font = '400 11px "Special Elite"';
    const st = '· OFFICIAL · WE JUST KILLED · NO PRODUCTS HARMED ';
    for (let i = 0; i < st.length; i++) {
      x.save();
      x.rotate((i / st.length) * Math.PI * 2);
      x.fillText(st[i], -3, -40);
      x.restore();
    }
    x.font = '400 25px Anton';
    x.textAlign = 'center';
    x.fillText('RIP', 0, 9);
    x.restore();
    // signature
    const asOf = fdate(D.meta?.generated_at ? D.meta.generated_at + 'T17:00:00Z' : Date.now()).toUpperCase();
    x.textAlign = 'center';
    x.font = '400 34px "Permanent Marker"';
    x.fillStyle = '#1f2d6b';
    x.save();
    x.translate(W - 300, 838);
    x.rotate(-0.04);
    x.fillText('the coroner', 0, 0);
    x.restore();
    x.strokeStyle = INK;
    x.lineWidth = 1.2;
    x.beginPath();
    x.moveTo(W - 510, 858);
    x.lineTo(W - 110, 858);
    x.stroke();
    x.font = '400 14px "Special Elite"';
    x.fillStyle = MUTE;
    x.fillText('ATTENDING CORONER · ' + SITE.toUpperCase() + ' · ' + asOf, W - 310, 882);
    // status stamp
    x.save();
    x.translate(W / 2 - 20, 840);
    x.rotate(-0.1);
    const label = v.brand ? 'STILL ALIVE' : 'PROBABLY FINE';
    x.font = '400 70px Anton';
    const tw = x.measureText(label).width;
    x.strokeStyle = v.brand ? '#1d8a4c' : RED;
    x.fillStyle = x.strokeStyle;
    x.lineWidth = 6;
    x.strokeRect(-tw / 2 - 24, -62, tw + 48, 84);
    x.lineWidth = 2;
    x.strokeRect(-tw / 2 - 14, -52, tw + 28, 64);
    x.textAlign = 'center';
    x.fillText(label, 0, 2);
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 700; i++) {
      x.fillStyle = `rgba(0,0,0,${0.3 + R() * 0.6})`;
      x.beginPath();
      x.arc((R() - 0.5) * (tw + 60), -64 + R() * 90, R() * 2.2, 0, 7);
      x.fill();
    }
    x.restore();
    // footer line
    x.textAlign = 'center';
    x.font = '400 15px "Special Elite"';
    x.fillStyle = MUTE;
    x.fillText(
      `CERT. Nº WJK-${v.first.case}-${String(n).padStart(2, '0')}   ·   A LOVING PARODY · EVERY CASE LINKS TO THE ORIGINAL POST · ${SITE.toUpperCase()}/#/VICTIM/${v.slug.toUpperCase()}`,
      W / 2,
      912,
    );
    return c;
  };
  const certBlob = async (v) => {
    const c = await drawCert(v);
    return new Promise((r) => c.toBlob(r, 'image/png'));
  };
  const certCache = {};
  const certURL = async (v) => (certCache[v.slug] ||= URL.createObjectURL(await certBlob(v)));
  const downloadCert = async (v) => {
    const u = await certURL(v);
    const a = document.createElement('a');
    a.href = u;
    a.download = `death-certificate-${v.slug}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    Sound.thud();
    toast('Certificate issued 📜');
  };
  const certShareText = (v) =>
    v.brand
      ? `${v.name} has been killed ${times(v.kills.length)} and is somehow still alive. Here is the death certificate 📜🔪`
      : `“${v.name}” has been killed ${times(v.kills.length)}. Death certificate attached 📜🔪`;

  /* ---------------- modal ---------------- */
  let modalOpen = false,
    lastFocus = null;
  const openModal = (html) => {
    lastFocus = document.activeElement;
    setHTML($('#modal-body'), html);
    $('#modal').hidden = false;
    modalOpen = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('.modal-x').focus({ preventScroll: true }), 30);
  };
  const hideModal = () => {
    $('#modal').hidden = true;
    modalOpen = false;
    document.body.style.overflow = '';
    lastFocus?.focus?.({ preventScroll: true });
  };
  const closeModal = () => {
    if (isModalRoute(location.hash)) {
      if (inAppNav) history.back();
      else {
        history.replaceState(null, '', underlying || '#/');
        hideModal();
        route();
      }
    } else hideModal();
  };
  const isModalRoute = (h) => /^#\/(case|cert|verdict)\//.test(h);
  $('#modal').addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOpen) closeModal();
  });

  const openCase = (id) => {
    const k = K.find((k) => k.id === id);
    if (!k) return false;
    openModal(
      `<div class="m-case">${card(k, '', true)}<div class="m-acts">${k.victims.map((v) => `<a class="btn" href="#/cert/${slug(v)}">📜 ${esc(v)}’s death certificate</a>`).join('')}<a class="btn" href="#/killer/${esc(k.handle.toLowerCase())}">All kills by @${esc(k.handle)}</a><button class="btn" data-random>🎲 Another one</button></div></div>`,
    );
    $('#modal-body .card').id = 'modal-title';
    document.title = `Case Nº ${k.case}: ${k.victims.join(', ')} — We Just Killed`;
    return true;
  };
  const openCert = async (s) => {
    const v = V[s];
    if (!v) return false;
    openModal(
      `<div class="m-cert"><h2 id="modal-title">Death certificate · ${esc(v.name)}</h2><div class="cert-slot"></div><div class="m-acts"><button class="btn btn-red" data-dl="${v.slug}">⬇ Download PNG</button><button class="btn" data-copy="#/cert/${v.slug}">🔗 Copy link</button><a class="btn" target="_blank" rel="noopener noreferrer" href="${intent(certShareText(v), pageURL('#/cert/' + v.slug))}">Post on X</a><a class="btn" href="#/victim/${v.slug}">Case files (${v.kills.length})</a></div></div>`,
    );
    document.title = `Death certificate: ${v.name} — We Just Killed`;
    const u = await certURL(v);
    const slot = $('.cert-slot');
    if (slot) {
      const img = document.createElement('img');
      img.src = u;
      img.alt = `Death certificate for ${v.name}: killed ${times(v.kills.length)}, status ${v.brand ? 'still alive' : 'probably fine'}.`;
      slot.replaceWith(img);
      Sound.thud();
    }
    return true;
  };
  const openVerdict = (q) => {
    openModal(verdictHTML(q));
    Sound.thud();
    document.title = `Is ${q} dead? — We Just Killed`;
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
    return `<div class="notes">${N.map(([n, t, b], i) => `<div class="note" data-sty="--r:${[-1.2, 0.8, -0.5, 1.1, -0.9, 0.6][i % 6]}deg"><h3>${n ? `<span class="n">${n}</span>` : ''}${t}</h3><p>${b}</p></div>`).join('')}</div>`;
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
    const n = v.kills.length,
      sh = ['', 's2', 's3'][hash32(v.slug) % 3];
    const ds =
      n > 1 ? `† ${shortD(v.first.created_at)} — † ${shortD(v.last.created_at)}` : `† ${fdate(v.first.created_at)}`;
    return `<a class="tomb ${i === 0 ? 'top1' : sh} rv" href="#/cert/${v.slug}" data-sty="transition-delay:${(i % 6) * 60}ms" aria-label="${esc(v.name)}, killed ${times(n)}. Open death certificate.">
    <span class="ghost${v.brand ? '' : ' q'}">${v.brand ? '👻 still alive' : 'still around?'}</span>
    <div class="stone"><div class="rip">R · I · P</div>${i === 0 ? '<span class="crown">the most murdered product on the internet</span>' : ''}<h3>${esc(v.name)}</h3><div class="tomb-ct">killed <b>${n}</b>${n === 1 ? ' time' : ' times'}</div><div class="tomb-d">${ds}</div><p class="ep">${esc(EPI[hash32(v.slug + 'e') % EPI.length])}</p></div><div class="dirt"></div></a>`;
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
    return `<a class="poster rv" href="#/killer/${esc(a.key)}" data-sty="--r:${r}deg;transition-delay:${(i % 4) * 70}ms"><div class="p-w">WANTED</div><div class="p-for">for <b>${a.kills.length}</b> counts of<br>launch homicide</div><div class="p-ph">${avatar(a, 'av', '200x200')}</div><div class="p-n">${esc(a.name)}</div><div class="p-h">@${esc(a.handle)}</div><p class="p-v">Known victims: ${esc(vs.slice(0, 5).join(', '))}${vs.length > 5 ? ` +${vs.length - 5} more` : ''}</p><div class="p-r"><small>BOUNTY COLLECTED</small>${fmt(a.likes)} LIKES</div><div class="p-l">Last seen ${fdate(a.kills.at(-1).created_at)}</div></a>`;
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
        `<div><p class="eyebrow">Victim #${v.rank} of ${victims.length}</p><h2>${esc(v.name)}</h2><p><span class="status${v.brand ? '' : ' q'}"><i></i>${v.brand ? 'still alive' : 'status unconfirmed'}</span></p><p>Pronounced dead <b class="big-n">${times(n)}</b> by ${plural(v.killers.size, 'suspect')}, first on ${fdate(v.first.created_at)}. ${fmt(v.likes)} likes at the scene${n > 1 ? 's' : ''}.</p>
      <div class="acts"><button class="btn btn-red" data-dl="${v.slug}">⬇ Download death certificate</button><a class="btn" target="_blank" rel="noopener noreferrer" href="${intent(certShareText(v), pageURL('#/cert/' + v.slug))}">Post on X</a><button class="btn" data-copy="#/victim/${v.slug}">🔗 Copy link</button><a class="btn" href="#/cases">✕ All cases</a></div></div>
      <a class="cert-thumb" href="#/cert/${v.slug}" aria-label="Open death certificate"></a>`,
      );
      const u = await certURL(v);
      const t = $('.cert-thumb', el);
      if (t) {
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
      <div class="acts"><a class="btn" href="https://x.com/${encodeURIComponent(a.handle)}" target="_blank" rel="noopener noreferrer">Profile on X ↗</a><button class="btn" data-copy="#/killer/${esc(a.key)}">🔗 Copy link</button><a class="btn" href="#/cases">✕ All cases</a></div></div><div></div>`,
      );
      document.title = `Suspect @${a.handle} — We Just Killed`;
    } else if (filter.type === 'month') {
      const n = K.filter((k) => k.created_at.startsWith(filter.v)).length;
      setHTML(
        el,
        `<div><p class="eyebrow">Month in review</p><h2>${esc(mlabel(filter.v))}</h2><p>${plural(n, 'kill claim')} that month.</p><div class="acts"><a class="btn" href="#/timeline">← Outbreak report</a><a class="btn" href="#/cases">✕ All cases</a></div></div><div></div>`,
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
        `<button class="x" data-unfocus aria-label="Close">✕</button><p class="eyebrow u-pmute">Victim #${v.rank}</p><h3>${esc(v.name)}</h3><p>Killed ${times(v.kills.length)} by ${plural(v.killers.size, 'suspect')}. Status: ${v.brand ? '<b class="u-alive">still alive</b>' : 'unconfirmed'}.</p><ul>${v.kills
          .slice()
          .reverse()
          .slice(0, 8)
          .map(
            (k) =>
              `<li><a href="#/case/${k.id}">@${esc(k.handle)}</a> · ${fdate(k.created_at)} · ♥ ${fmt(k.likes)}</li>`,
          )
          .join(
            '',
          )}</ul><div class="acts"><a class="btn btn-sm" href="#/cert/${v.slug}">📜 Certificate</a><a class="btn btn-sm" href="#/victim/${v.slug}">Case files</a></div>`,
      );
    } else {
      const a = n.a;
      setHTML(
        p,
        `<button class="x" data-unfocus aria-label="Close">✕</button><p class="eyebrow u-pmute">Suspect</p><h3>@${esc(a.handle)}</h3><p>${esc(a.name)} · ${plural(a.kills.length, 'kill claim')} · ${fmt(a.likes)} likes collected.</p><ul>${a.kills
          .slice()
          .reverse()
          .slice(0, 8)
          .map((k) => `<li><a href="#/case/${k.id}">${esc(k.victims.join(', '))}</a> · ${fdate(k.created_at)}</li>`)
          .join('')}</ul><div class="acts"><a class="btn btn-sm" href="#/killer/${esc(a.key)}">Suspect file</a></div>`,
      );
    }
    Sound.tick();
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
    home: 'We Just Killed — every startup that “just killed” another product',
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
      const ok = a === 'case' ? openCase(b) : a === 'cert' ? openCert(b) : openVerdict(V[b] ? V[b].name : b);
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
    $('#sort').onchange = () => {
      page = 1;
      renderWall();
    };
    $('#brands').onchange = () => {
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
        location.hash = '#/verdict/' + li.dataset.v;
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
        '#/verdict/' +
        (li ? li.dataset.v : primary && norm(primary.name) === norm(q) ? primary.slug : encodeURIComponent(q));
    });
    document.addEventListener('click', (e) => {
      const t = e.target;
      const tr = t.closest('[data-try]');
      if (tr) {
        dq.value = tr.dataset.try;
        location.hash = '#/verdict/' + (lookup(tr.dataset.try).primary?.slug || tr.dataset.try);
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
  loadData()
    .then((data) => {
      prep(data);
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
