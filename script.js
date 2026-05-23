// ===== Starfield =====
(function generateStars() {
  const container = document.getElementById('stars');
  if (!container) return;
  const count = 200;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    const size = Math.random() * 2 + 0.4;
    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      --dur: ${(Math.random() * 4 + 2).toFixed(1)}s;
      animation-delay: ${(Math.random() * 4).toFixed(1)}s;
    `;
    container.appendChild(star);
  }
})();

// ===== Navbar scroll state =====
(function () {
  const nb = document.querySelector('.navbar');
  if (!nb) return;
  const toggle = () => nb.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
})();

// ===== Hero nebula parallax =====
(function () {
  const nebula = document.querySelector('.hero-nebula');
  const stars  = document.getElementById('stars');
  if (!nebula) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nebula.style.transform = `translateY(${y * 0.28}px)`;
    if (stars) stars.style.transform = `translateY(${y * 0.12}px)`;
  }, { passive: true });
})();

// ===== Hamburger menu =====
(function () {
  const btn   = document.getElementById('navHamburger');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  function close() {
    links.classList.remove('open'); btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Open menu');
  }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    const isOpen = links.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('click', e => { if (!btn.contains(e.target) && !links.contains(e.target)) close(); });
})();

// ===== Scroll reveal =====
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); fadeObserver.unobserve(entry.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 0.07}s`; fadeObserver.observe(el); });

// ===== Visualizer =====
(function () {
  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  // Tab switching
  const tabs = document.querySelectorAll('.viz-tab');
  const panels = document.querySelectorAll('.viz-panel');
  let axiomReady = false;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById('viz-' + tab.dataset.tab);
      if (panel) panel.classList.add('active');
      if (tab.dataset.tab === 'gamma')  initGamma();
      if (tab.dataset.tab === 'herald') initHerald();
      if (tab.dataset.tab === 'axiom' && !axiomReady) { initAxiom(); axiomReady = true; }
    });
  });

  document.querySelectorAll('.viz-replay').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.target === 'gamma')  initGamma();
      if (btn.dataset.target === 'herald') initHerald();
    });
  });

  let gammaBooted = false;
  const vizSection = document.getElementById('visualizer');
  if (vizSection) {
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !gammaBooted) { gammaBooted = true; initGamma(); }
    }, { threshold: 0.12 }).observe(vizSection);
  }

  // ── Γ_coupling ──
  function initGamma() {
    const svg = document.getElementById('gamma-svg');
    if (!svg) return;
    svg.innerHTML = '';
    const W = 700, H = 420, cx = W / 2, cy = 215;
    const mechs = [
      { label: 'Electromigration',        sub: 'electrons slowly push metal atoms',    x: 118, y: 90,  col: '#4a90e8' },
      { label: 'Thermo-Mech. Fatigue',    sub: 'extreme heat/cold cracks connections', x: 582, y: 90,  col: '#e8a44a' },
      { label: 'Radiation Damage',         sub: 'cosmic rays knock atoms out of place', x: 350, y: 385, col: '#b04ae8' },
    ];

    const defs = svgEl('defs', {});
    mechs.forEach((m, i) => {
      const f = svgEl('filter', { id: 'gg' + i, x: '-80%', y: '-80%', width: '260%', height: '260%' });
      f.appendChild(svgEl('feGaussianBlur', { stdDeviation: '7', result: 'b' }));
      const fm = svgEl('feMerge', {});
      fm.appendChild(svgEl('feMergeNode', { in: 'b' })); fm.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
      f.appendChild(fm); defs.appendChild(f);
    });
    const gf = svgEl('filter', { id: 'gf', x: '-120%', y: '-120%', width: '340%', height: '340%' });
    gf.appendChild(svgEl('feGaussianBlur', { stdDeviation: '16', result: 'b' }));
    const gfm = svgEl('feMerge', {});
    gfm.appendChild(svgEl('feMergeNode', { in: 'b' })); gfm.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
    gf.appendChild(gfm); defs.appendChild(gf);
    svg.appendChild(defs);

    const lines = mechs.map(m => {
      const l = svgEl('line', { x1: m.x, y1: m.y, x2: cx, y2: cy, stroke: m.col, 'stroke-width': '1.8', 'stroke-dasharray': '8 5', opacity: '0' });
      svg.appendChild(l); return l;
    });

    const groups = mechs.map((m, i) => {
      const g = svgEl('g', {});
      g.appendChild(svgEl('circle', { cx: m.x, cy: m.y, r: '50', fill: 'none', stroke: m.col, 'stroke-width': '1', opacity: '0.15' }));
      g.appendChild(svgEl('circle', { cx: m.x, cy: m.y, r: '38', fill: m.col + '20', stroke: m.col, 'stroke-width': '2', filter: 'url(#gg' + i + ')' }));
      const t1 = svgEl('text', { x: m.x, y: m.y - 3, 'text-anchor': 'middle', fill: m.col, 'font-size': '11.5', 'font-family': 'Space Grotesk,sans-serif', 'font-weight': '700' });
      t1.textContent = m.label.split(' ')[0];
      const t2 = svgEl('text', { x: m.x, y: m.y + 12, 'text-anchor': 'middle', fill: m.col + 'bb', 'font-size': '9.5', 'font-family': 'Inter,sans-serif' });
      t2.textContent = m.label.split(' ').slice(1).join(' ');
      const subY = m.y < H / 2 ? m.y + 62 : m.y - 58;
      const sub = svgEl('text', { x: m.x, y: subY, 'text-anchor': 'middle', fill: 'rgba(200,215,235,0.5)', 'font-size': '9.5', 'font-family': 'Inter,sans-serif', 'font-style': 'italic' });
      sub.textContent = '"' + m.sub + '"';
      g.appendChild(t1); g.appendChild(t2); g.appendChild(sub);
      svg.appendChild(g);
      return { g, m };
    });

    const failG = svgEl('g', { opacity: '0' });
    failG.appendChild(svgEl('circle', { cx, cy, r: '54', fill: '#ff444428', stroke: '#ff4444', 'stroke-width': '2.5', filter: 'url(#gf)' }));
    const ft = svgEl('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', fill: '#ff7777', 'font-size': '12.5', 'font-family': 'Space Grotesk,sans-serif', 'font-weight': '700' });
    ft.textContent = 'Synergistic Failure';
    const fl = svgEl('text', { x: cx, y: cy + 72, 'text-anchor': 'middle', fill: '#ff444466', 'font-size': '10.5', 'font-family': 'Inter,sans-serif' });
    fl.textContent = '\u0393_coupling > threshold';
    failG.appendChild(ft); failG.appendChild(fl);
    svg.appendChild(failG);

    function shockwave() {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const ring = svgEl('circle', { cx, cy, r: '54', fill: 'none', stroke: '#ff4444', 'stroke-width': '3', opacity: '0.85' });
          svg.appendChild(ring);
          let r = 54, op = 0.85;
          const tick = setInterval(() => {
            r += 5.5; op -= 0.042;
            ring.setAttribute('r', r); ring.setAttribute('opacity', Math.max(0, op));
            if (op <= 0) { clearInterval(tick); if (ring.parentNode) ring.parentNode.removeChild(ring); }
          }, 24);
        }, i * 220);
      }
    }

    setTimeout(() => lines.forEach(l => { l.style.transition = 'opacity 1s'; l.setAttribute('opacity', '0.8'); }), 450);
    setTimeout(() => {
      groups.forEach(({ g, m }) => {
        const dx = (cx - m.x) * 0.7, dy = (cy - m.y) * 0.7;
        g.style.transition = 'transform 1.7s cubic-bezier(0.4,0,0.2,1)';
        g.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
    }, 1500);
    setTimeout(() => {
      failG.style.transition = 'opacity 0.9s'; failG.setAttribute('opacity', '1'); shockwave();
    }, 3200);
  }

  // ── AXIOM Entropy Floor ──
  function initAxiom() {
    const canvas = document.getElementById('axiom-canvas');
    const slider = document.getElementById('axiom-slider');
    const countEl = document.getElementById('axiom-count');
    const floorLbl = document.getElementById('axiom-floor-label');
    if (!canvas || !slider) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const mu = W / 2, BASE_SIG = 145, FLOOR_SIG = 26;

    function getSigma(n) { return Math.max(BASE_SIG / Math.sqrt(n), FLOOR_SIG); }
    function gauss(x, sig) { return Math.exp(-0.5 * ((x - mu) / sig) ** 2) / (sig * Math.sqrt(2 * Math.PI)); }

    function draw(n) {
      ctx.clearRect(0, 0, W, H);
      const sig = getSigma(n);
      const sigNF = BASE_SIG / Math.sqrt(n);
      const atFloor = sig <= FLOOR_SIG + 0.5;
      const peak = gauss(mu, sig);
      const scaleY = (H - 72) / peak;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let y = H - 26; y > 20; y -= 50) { ctx.beginPath(); ctx.moveTo(55, y); ctx.lineTo(W - 20, y); ctx.stroke(); }

      // No-floor ghost curve (dashed red-orange) when diverging
      if (sigNF < FLOOR_SIG * 2.5) {
        ctx.save(); ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(232,100,50,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 55; x <= W - 20; x++) {
          const y = H - 26 - gauss(x, sigNF) * scaleY;
          x === 55 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.restore();
        const nfPeakY = H - 26 - gauss(mu, sigNF) * scaleY;
        ctx.fillStyle = 'rgba(240,110,60,0.75)'; ctx.font = '10.5px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Without AXIOM \u2014 dangerous certainty', mu + 100, Math.max(nfPeakY - 12, 14));
        ctx.textAlign = 'left';
      }

      // Entropy floor line
      const floorPeak = gauss(mu, FLOOR_SIG);
      const floorY = H - 26 - floorPeak * scaleY;
      if (atFloor) { ctx.strokeStyle = 'rgba(74,144,232,0.15)'; ctx.lineWidth = 10; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(55, floorY); ctx.lineTo(W - 20, floorY); ctx.stroke(); }
      ctx.setLineDash([6, 4]); ctx.strokeStyle = atFloor ? 'rgba(90,168,255,0.9)' : 'rgba(74,144,232,0.38)'; ctx.lineWidth = atFloor ? 2.2 : 1.5;
      ctx.beginPath(); ctx.moveTo(55, floorY); ctx.lineTo(W - 20, floorY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = atFloor ? 'rgba(90,168,255,0.9)' : 'rgba(74,144,232,0.55)'; ctx.font = '10.5px Inter,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('entropy floor', W - 22, floorY - 8);
      if (atFloor) { ctx.fillStyle = 'rgba(74,210,200,0.75)'; ctx.font = '10px Inter,sans-serif'; ctx.fillText('With AXIOM \u2014 enforced humility', W - 22, floorY + 17); }
      ctx.textAlign = 'left';

      // Curve fill
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, atFloor ? 'rgba(74,144,232,0.48)' : 'rgba(74,144,232,0.2)');
      grad.addColorStop(1, 'rgba(74,144,232,0)');
      ctx.beginPath(); ctx.moveTo(55, H - 26);
      for (let x = 55; x <= W - 20; x++) ctx.lineTo(x, H - 26 - gauss(x, sig) * scaleY);
      ctx.lineTo(W - 20, H - 26); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

      // Curve stroke (+ glow when at floor)
      if (atFloor) {
        ctx.beginPath();
        for (let x = 55; x <= W - 20; x++) { const y = H - 26 - gauss(x, sig) * scaleY; x === 55 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.strokeStyle = 'rgba(74,144,232,0.22)'; ctx.lineWidth = 11; ctx.stroke();
      }
      ctx.beginPath();
      for (let x = 55; x <= W - 20; x++) { const y = H - 26 - gauss(x, sig) * scaleY; x === 55 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.strokeStyle = atFloor ? '#5aadff' : 'rgba(74,144,232,0.9)'; ctx.lineWidth = atFloor ? 3 : 2.5; ctx.stroke();

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(55, 12); ctx.lineTo(55, H - 26); ctx.lineTo(W - 20, H - 26); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText('P(\u03b8 | data)', 58, 24); ctx.textAlign = 'center';
      ctx.fillText('\u03b8  (parameter value)', W / 2, H - 7); ctx.textAlign = 'left';

      floorLbl.style.opacity = atFloor ? '1' : '0';
    }

    slider.addEventListener('input', () => { const n = +slider.value; countEl.textContent = n; draw(n); });
    draw(1);
  }

  // ── HERALD ──
  function initHerald() {
    const svg = document.getElementById('herald-svg');
    if (!svg) return;
    svg.innerHTML = '';
    const W = 700, H = 340, midX = W / 2;

    const defs = svgEl('defs', {});
    ['hg0','hg1','hg2'].forEach(id => {
      const f = svgEl('filter', { id, x: '-70%', y: '-70%', width: '240%', height: '240%' });
      f.appendChild(svgEl('feGaussianBlur', { stdDeviation: '8', result: 'b' }));
      const fm = svgEl('feMerge', {}); fm.appendChild(svgEl('feMergeNode', { in: 'b' })); fm.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
      f.appendChild(fm); defs.appendChild(f);
    });
    svg.appendChild(defs);

    svg.appendChild(svgEl('line', { x1: midX, y1: 20, x2: midX, y2: H - 20, stroke: 'rgba(255,255,255,0.07)', 'stroke-width': '1', 'stroke-dasharray': '4 4' }));

    [['COMPUTE CLUSTER', midX / 2, '#4a90e8aa'], ['ATTITUDE CONTROL', midX + midX / 2, '#e8a44aaa']].forEach(([txt, x, fill]) => {
      const t = svgEl('text', { x, y: 22, 'text-anchor': 'middle', fill, 'font-size': '10.5', 'font-family': 'Inter,sans-serif', 'font-weight': '600', 'letter-spacing': '0.1em' });
      t.textContent = txt; svg.appendChild(t);
    });

    const nodePts = [{ x: 78, y: 88 }, { x: 155, y: 115 }, { x: 78, y: 150 }, { x: 158, y: 182 }, { x: 90, y: 220 }, { x: 162, y: 252 }];
    const nodeItems = nodePts.map(({ x, y }) => {
      const ring = svgEl('circle', { cx: x, cy: y, r: '22', fill: 'none', stroke: '#4a90e8', 'stroke-width': '1', opacity: '0' });
      const circle = svgEl('circle', { cx: x, cy: y, r: '14', fill: '#4a90e818', stroke: '#4a90e8', 'stroke-width': '2', filter: 'url(#hg0)', opacity: '0.4' });
      svg.appendChild(ring); svg.appendChild(circle);
      return { circle, ring };
    });

    const arrowG = svgEl('g', { opacity: '0' });
    arrowG.appendChild(svgEl('line', { x1: midX - 12, y1: H / 2, x2: midX + 14, y2: H / 2, stroke: '#ff4444', 'stroke-width': '2.5' }));
    arrowG.appendChild(svgEl('polygon', { points: `${midX + 14},${H / 2 - 7} ${midX + 28},${H / 2} ${midX + 14},${H / 2 + 7}`, fill: '#ff4444' }));
    const cLbl = svgEl('text', { x: midX, y: H / 2 - 18, 'text-anchor': 'middle', fill: '#ff444499', 'font-size': '10', 'font-family': 'Inter,sans-serif' });
    cLbl.textContent = 'structural coupling'; arrowG.appendChild(cLbl); svg.appendChild(arrowG);

    const badgeG = svgEl('g', { opacity: '0' });
    badgeG.appendChild(svgEl('rect', { x: midX - 46, y: H / 2 + 34, width: '92', height: '28', rx: '5', fill: '#17b97820', stroke: '#17b978', 'stroke-width': '2', filter: 'url(#hg2)' }));
    const bt = svgEl('text', { x: midX, y: H / 2 + 52, 'text-anchor': 'middle', fill: '#17b978', 'font-size': '14', 'font-family': 'Space Grotesk,sans-serif', 'font-weight': '700' });
    bt.textContent = 'HERALD'; badgeG.appendChild(bt); svg.appendChild(badgeG);

    const nominalG = svgEl('g', { opacity: '0' });
    const nomT = svgEl('text', { x: midX + midX / 2, y: H - 26, 'text-anchor': 'middle', fill: '#17b978', 'font-size': '12', 'font-family': 'Space Grotesk,sans-serif', 'font-weight': '700', 'letter-spacing': '0.14em' });
    nomT.textContent = '\u2713 NOMINAL'; nominalG.appendChild(nomT); svg.appendChild(nominalG);

    const wavePath = svgEl('path', { stroke: '#e8a44a', 'stroke-width': '2.5', fill: 'none', 'stroke-linecap': 'round' });
    svg.appendChild(wavePath);

    function greenShockwave() {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const ring = svgEl('circle', { cx: midX, cy: H / 2, r: '22', fill: 'none', stroke: '#17b978', 'stroke-width': '3', opacity: '0.9' });
          svg.appendChild(ring);
          let r = 22, op = 0.9;
          const tick = setInterval(() => {
            r += 5.5; op -= 0.042;
            ring.setAttribute('r', r); ring.setAttribute('opacity', Math.max(0, op));
            if (op <= 0) { clearInterval(tick); if (ring.parentNode) ring.parentNode.removeChild(ring); }
          }, 26);
        }, i * 210);
      }
    }

    let phase = 0, amp = 70, pulse = 0, t0 = null, heraldOn = false, raf;
    function frame(ts) {
      if (!t0) t0 = ts;
      const ms = ts - t0;
      phase += 0.048; pulse += 0.1;

      nodeItems.forEach(({ circle, ring }, i) => {
        const v = 0.28 + 0.72 * Math.max(0, Math.sin(pulse + i * 0.62));
        circle.setAttribute('opacity', v);
        const rv = Math.max(0, Math.sin(pulse * 0.65 + i * 0.5));
        ring.setAttribute('opacity', rv * 0.4); ring.setAttribute('r', 20 + rv * 14);
      });

      if (ms > 650)  { arrowG.style.transition = 'opacity 0.6s'; arrowG.setAttribute('opacity', '1'); }
      if (ms > 2600 && !heraldOn) {
        heraldOn = true;
        badgeG.style.transition = 'opacity 0.7s'; badgeG.setAttribute('opacity', '1');
        arrowG.querySelector('line').setAttribute('stroke', '#17b97850');
        arrowG.querySelector('polygon').setAttribute('fill', '#17b97850');
        cLbl.setAttribute('fill', '#ffffff18');
        greenShockwave();
      }
      if (heraldOn && amp > 1.2) amp *= 0.962;
      if (heraldOn && amp <= 2) { nominalG.style.transition = 'opacity 0.9s'; nominalG.setAttribute('opacity', '1'); }

      const x0 = midX + 26, x1 = W - 18, wy = H / 2;
      let d = 'M ' + x0 + ' ' + wy;
      for (let x = x0; x <= x1; x += 2) {
        const t = (x - x0) / (x1 - x0);
        d += ' L ' + x + ' ' + (wy + amp * Math.sin(phase + t * 5.5 * Math.PI));
      }
      wavePath.setAttribute('d', d);
      wavePath.setAttribute('stroke', heraldOn ? '#17b978' : (amp > 35 ? '#ff5533' : '#e8a44a'));
      wavePath.setAttribute('stroke-width', amp > 45 ? '3.5' : '2.5');

      if (amp > 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }
})();
