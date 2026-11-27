/* Ambient canvas, the Embers switch and the hash-route tabs. No library, no request; all content is already in the HTML. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motionOn = true;
  try { motionOn = localStorage.getItem('embers') !== 'off'; } catch (_) { /* storage blocked: motion starts on */ }

  /* ---- ambient canvas: fireflies, embers, fog, candle flicker (ported from motion-deck themes/fantasy/theme.js) ---- */
  const canvas = document.getElementById('ambient');
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, ratio = 0; // the viewport the canvas was last sized for
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const gold = [216, 169, 62], ember = [240, 136, 58], bg2 = [43, 15, 28], bgc = [18, 11, 13], text = [240, 228, 200], W = [255, 255, 255];
  const S = { gold: cv(64, 64), ember: cv(32, 32), star: cv(64, 64), fog: cv(256, 128), vig: cv(2, 2), glow: cv(2, 2) };
  let flies = [], embers = [], fogs = [], sparks = [];

  const glowSprite = (c, col, core) => {
    const g = c.getContext('2d'), s = c.width / 2;
    const gr = g.createRadialGradient(s, s, 0, s, s, s);
    gr.addColorStop(0, `rgba(${core},1)`); gr.addColorStop(0.14, `rgba(${col},.9)`); gr.addColorStop(0.42, `rgba(${col},.22)`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  };
  glowSprite(S.gold, mix(gold, W, 0.1).join(','), mix(gold, W, 0.8).join(','));
  glowSprite(S.ember, ember.join(','), mix(ember, W, 0.7).join(','));
  (() => {
    let g = S.star.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    gr.addColorStop(0, `rgba(${mix(gold, W, 0.6).join(',')},.55)`); gr.addColorStop(1, `rgba(${gold.join(',')},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(34, 30, 62, 32); g.quadraticCurveTo(34, 34, 32, 62); g.quadraticCurveTo(30, 34, 2, 32); g.quadraticCurveTo(30, 30, 32, 2);
    g.fillStyle = `rgb(${mix(gold, W, 0.5).join(',')})`; g.fill();
    g = S.fog.getContext('2d');
    const fc = mix(bg2, text, 0.3).join(',');
    const fg = g.createRadialGradient(128, 64, 0, 128, 64, 128);
    fg.addColorStop(0, `rgba(${fc},.7)`); fg.addColorStop(0.55, `rgba(${fc},.3)`); fg.addColorStop(1, `rgba(${fc},0)`);
    g.setTransform(1, 0, 0, 0.5, 0, 32); g.fillStyle = fg; g.fillRect(0, -64, 256, 256); g.setTransform(1, 0, 0, 1, 0, 0);
  })();

  const buildLayers = () => {
    const w2 = Math.max(2, Math.ceil(width / 2)), h2 = Math.max(2, Math.ceil(height / 2));
    S.vig.width = w2; S.vig.height = h2; S.glow.width = w2; S.glow.height = h2;
    let g = S.vig.getContext('2d');
    const dark = mix(bgc, [0, 0, 0], 0.55).join(',');
    let gr = g.createRadialGradient(w2 / 2, h2 * 0.46, Math.min(w2, h2) * 0.3, w2 / 2, h2 * 0.46, Math.hypot(w2, h2) * 0.6);
    gr.addColorStop(0, `rgba(${dark},0)`); gr.addColorStop(0.62, `rgba(${dark},.34)`); gr.addColorStop(1, `rgba(${dark},.9)`);
    g.fillStyle = gr; g.fillRect(0, 0, w2, h2);
    g = S.glow.getContext('2d');
    const warm = mix(ember, gold, 0.4).join(',');
    gr = g.createRadialGradient(w2 / 2, h2 * 1.05, 0, w2 / 2, h2 * 1.05, h2 * 1.1);
    gr.addColorStop(0, `rgba(${warm},.2)`); gr.addColorStop(1, `rgba(${warm},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, w2, h2);
  };

  const populate = () => {
    const R = Math.random, w = width, h = height, area = w * h;
    const nf = Math.max(12, Math.min(40, Math.round(area / 56000)));
    const ne = Math.max(18, Math.min(90, Math.round(area / 22000)));
    flies = Array.from({ length: nf }, () => ({ x: R() * w, y: h * (0.12 + R() * 0.84), ang: R() * 6.283, sp: 0.01 + R() * 0.018, ph: R() * 6.283, rate: 0.0005 + R() * 0.0012, sz: 12 + R() * 14 }));
    embers = Array.from({ length: ne }, () => ({ x: R() * w, y: R() * h, vy: 0.02 + R() * 0.05, sw: 10 + R() * 26, ph: R() * 6.283, rate: 0.0006 + R() * 0.001, sz: 5 + R() * 9 }));
    fogs = Array.from({ length: 6 }, (_, i) => ({ x: R() * w, y: h * (0.46 + 0.13 * i + R() * 0.05), w: w * (0.7 + R() * 0.5), h: h * (0.34 + R() * 0.2), v: (0.004 + R() * 0.007) * (i % 2 ? 1 : -1), a: 0.55 + R() * 0.4 }));
    if (!sparks.length) sparks = Array.from({ length: 64 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, sz: 0, ph: 0 }));
  };

  const draw = (t, dt, still) => {
    const w = width, h = height;
    ctx.clearRect(0, 0, w, h);
    const fl = still ? 0 : Math.sin(t * 0.0023) * 0.5 + Math.sin(t * 0.0057 + 1.3) * 0.3 + Math.sin(t * 0.0131 + 0.4) * 0.2;
    ctx.globalAlpha = 0.85 + fl * 0.15;
    ctx.drawImage(S.glow, 0, 0, w, h);
    for (const f of fogs) {
      if (!still) { f.x += f.v * dt; if (f.x > w + f.w * 0.5) f.x = -f.w * 0.5; else if (f.x < -f.w * 0.5) f.x = w + f.w * 0.5; }
      ctx.globalAlpha = f.a * (still ? 1 : 0.85 + 0.15 * Math.sin(t * 0.0003 + f.y));
      ctx.drawImage(S.fog, f.x - f.w * 0.5, f.y - f.h * 0.5, f.w, f.h);
    }
    for (const e of embers) {
      if (!still) { e.y -= e.vy * dt; if (e.y < -20) { e.y = h + 20; e.x = Math.random() * w; } }
      const k = Math.max(0, Math.min(1, e.y / h));
      const tw = still ? 0.8 : 0.55 + 0.45 * Math.sin(t * e.rate * 3 + e.ph);
      ctx.globalAlpha = Math.min(1, 1 - k * 0.7) * tw * (still ? 0.7 : 1);
      const x = e.x + (still ? 0 : Math.sin(t * e.rate + e.ph) * e.sw), s = e.sz * (0.7 + 0.5 * (1 - k));
      ctx.drawImage(S.ember, x - s, e.y - s, s * 2, s * 2);
    }
    for (const f of flies) {
      if (!still) {
        f.ang += Math.sin(t * f.rate + f.ph) * dt * 0.0014;
        f.x += Math.cos(f.ang) * f.sp * dt; f.y += Math.sin(f.ang) * f.sp * dt;
        if (f.x < -30) f.x = w + 30; else if (f.x > w + 30) f.x = -30;
        if (f.y < h * 0.05) { f.y = h * 0.05; f.ang = -f.ang; } else if (f.y > h + 10) f.y = h * 0.4;
      }
      const p = still ? 0.75 : Math.max(0, Math.sin(t * f.rate * 2.2 + f.ph));
      ctx.globalAlpha = 0.12 + 0.88 * p * p;
      const s = f.sz * (0.8 + 0.3 * p);
      ctx.drawImage(S.gold, f.x - s, f.y - s, s * 2, s * 2);
    }
    if (!still) for (const s of sparks) {
      if (s.life <= 0) continue;
      s.life -= dt / 1250; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.992; s.vy *= 0.992;
      ctx.globalAlpha = Math.max(0, Math.min(1, s.life * 1.6)) * (0.6 + 0.4 * Math.sin(t * 0.02 + s.ph));
      const z = s.sz * (0.5 + 0.7 * Math.max(0, s.life));
      ctx.drawImage(S.star, s.x - z, s.y - z, z * 2, z * 2);
    }
    ctx.globalAlpha = 0.94 + fl * 0.06;
    ctx.drawImage(S.vig, 0, 0, w, h);
    ctx.globalAlpha = 1;
  };

  const burst = () => {
    let n = 0;
    for (const s of sparks) {
      if (s.life > 0) continue;
      s.x = width * (0.2 + Math.random() * 0.6); s.y = height * (0.2 + Math.random() * 0.6);
      const a = Math.random() * 6.283, v = 0.03 + Math.random() * 0.16;
      s.vx = Math.cos(a) * v; s.vy = Math.sin(a) * v - 0.04;
      s.life = 0.7 + Math.random() * 0.3; s.sz = 5 + Math.random() * 10; s.ph = Math.random() * 6.283;
      if (++n >= 44) break;
    }
  };

  let raf = 0, last = 0;
  const frame = (t) => { const dt = last ? Math.min(50, t - last) : 16; last = t; draw(t, dt, false); raf = requestAnimationFrame(frame); };
  const sync = () => {
    const run = motionOn && !document.hidden && !reduced.matches;
    if (run && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    else if (!run) { cancelAnimationFrame(raf); raf = 0; draw(0, 0, true); }
  };
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (innerWidth === width && innerHeight === height && dpr === ratio) return;
    // a phone resizes the height on every scroll (the URL bar): only a new width scatters the lights again
    const widthChanged = width !== innerWidth;
    width = innerWidth; height = innerHeight; ratio = dpr;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildLayers(); if (widthChanged) populate();
    if (!raf) draw(0, 0, true);
  };

  /* ---- the Embers switch: the button names its own state; under reduced motion there is nothing to switch ---- */
  const toggle = document.getElementById('motion-toggle');
  const paint = () => {
    toggle.textContent = motionOn ? 'Embers on' : 'Embers off';
    toggle.hidden = reduced.matches;
    document.documentElement.classList.toggle('still', !motionOn);
  };
  toggle.addEventListener('click', () => {
    motionOn = !motionOn;
    try { localStorage.setItem('embers', motionOn ? 'on' : 'off'); } catch (_) { /* the choice lasts for this page only */ }
    paint(); sync();
  });

  resize();
  let resizeTimer = 0;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { paint(); sync(); });
  paint();
  sync();

  /* ---- career timeline: filter chips, and cards that arrive as they scroll into view (brand.css hides them only while motion is on) ---- */
  const timeline = document.querySelector('.timeline');
  if (timeline) {
    const items = [...timeline.querySelectorAll('.tl > li')];
    const filters = timeline.querySelector('.filters');
    const buttons = [...filters.querySelectorAll('button')];
    filters.hidden = false;
    buttons.forEach((b) => b.addEventListener('click', () => {
      buttons.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      items.forEach((li) => { li.hidden = !!b.dataset.kind && li.dataset.kind !== b.dataset.kind; });
    }));
    if ('IntersectionObserver' in window) {
      const watcher = new IntersectionObserver((seen) => seen.forEach((s) => {
        if (!s.isIntersecting) return;
        s.target.classList.add('seen'); watcher.unobserve(s.target);
      }), { threshold: 0.1 });
      items.forEach((li) => watcher.observe(li));
      timeline.querySelector('.tl').classList.add('reveal');
    }
  }

  /* ---- views: hash routes, a dissolve between them. An article page has no views and stops here. ---- */
  const views = [...document.querySelectorAll('.view')];
  if (!views.length) return;
  const tabs = [...document.querySelectorAll('.tabs a')];
  const find = (hash) => views.find((v) => '#' + v.id === (hash === '#posts' ? '#journal' : hash)); // Journal was called Posts
  const viewFor = (hash) => find(hash) || views[0];
  const dissolveMs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tr-out'));
  let current = viewFor(location.hash), token = 0;
  const mark = (v) => tabs.forEach((a) => (a.dataset.view === v.id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const only = (view) => views.forEach((v) => { v.hidden = v !== view; v.classList.remove('leaving', 'entering'); });
  only(current);
  mark(current);
  const show = (next) => {
    if (next === current) return;
    current = next; mark(next);
    const my = ++token;
    // the view on screen, which is not the last one asked for when clicks come faster than the dissolve
    const from = views.find((v) => !v.hidden);
    const enter = () => {
      if (my !== token) return;
      only(next);
      const h = next.querySelector('[tabindex="-1"]');
      if (h) h.focus({ preventScroll: true });
      scrollTo(0, 0);
      if (reduced.matches) return;
      next.classList.add('entering');
      next.addEventListener('animationend', () => next.classList.remove('entering'), { once: true });
    };
    if (reduced.matches || from === next) { enter(); return; }
    from.classList.remove('entering'); from.classList.add('leaving'); if (raf) burst();
    setTimeout(enter, dissolveMs);
  };
  // a plain hash link jumps its target to the top and scrolls the tab bar away, so links route here instead
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  addEventListener('load', () => scrollTo(0, 0));
  document.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // open in a new tab stays the browser's
    const a = e.target.closest('a[href^="#"]');
    const next = a && find(a.hash);
    if (!next) return;
    e.preventDefault();
    if (location.hash !== a.hash) { try { history.pushState(null, '', a.hash); } catch (_) { /* sandboxed frame: route without history */ } }
    show(next);
  });
  addEventListener('popstate', () => show(viewFor(location.hash)));
  addEventListener('hashchange', () => { scrollTo(0, 0); show(viewFor(location.hash)); });
})();
