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
    links.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open menu');
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    const isOpen = links.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', close);
  });

  document.addEventListener('click', function (e) {
    if (!btn.contains(e.target) && !links.contains(e.target)) close();
  });
})();

// ===== Scroll reveal =====
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.07}s`;
  fadeObserver.observe(el);
});

// ===== Visualizer =====
(function () {
  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  // ── Tab switching ──
  const tabs   = document.querySelectorAll('.viz-tab');
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

  // Init gamma when section scrolls into view
  const vizSection = document.getElementById('visualizer');
  let gammaBooted = false;
  if (vizSection) {
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !gammaBooted) {
        gammaBooted = true;
        initGamma();
      }
    }, { threshold: 0.15 }).observe(vizSection);
  }

  // ── Γ_coupling ──
  function initGamma() {
    const svg = document.getElementById('gamma-svg');
    if (!svg) return;
    svg.innerHTML = '';
    const cx = 300, cy = 168;
    const mechs = [
      { label: 'Electromigration',         sub: '',          x: 110, y: 75,  col: '#4a90e8' },
      { label: 'Thermo–Mechanical Fatigue', sub: '',          x: 490, y: 75,  col: '#e8a44a' },
      { label: 'Radiation Damage',          sub: '',          x: 300, y: 285, col: '#b04ae8' },
    ];

    const defs = svgEl('defs', {});
    mechs.forEach((m, i) => {
      const f = svgEl('filter', { id: 'gg' + i, x: '-60%', y: '-60%', width: '220%', height: '220%' });
      f.appendChild(svgEl('feGaussianBlur', { stdDeviation: '5', result: 'b' }));
      const fm = svgEl('feMerge', {});
      fm.appendChild(svgEl('feMergeNode', { in: 'b' }));
      fm.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
      f.appendChild(fm); defs.appendChild(f);
    });
    const ff = svgEl('filter', { id: 'gf', x: '-80%', y: '-80%', width: '260%', height: '260%' });
    ff.appendChild(svgEl('feGaussianBlur', { stdDeviation: '10', result: 'b' }));
    const ffm = svgEl('feMerge', {});
    ffm.appendChild(svgEl('feMergeNode', { in: 'b' }));
    ffm.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
    ff.appendChild(ffm); defs.appendChild(ff);
    svg.appendChild(defs);

    const lines = mechs.map(m => {
      const l = svgEl('line', { x1: m.x, y1: m.y, x2: cx, y2: cy, stroke: m.col, 'stroke-width': '1.5', 'stroke-dasharray': '6 4', opacity: '0' });
      svg.appendChild(l); return l;
    });

    const groups = mechs.map((m, i) => {
      const g = svgEl('g', {});
      g.appendChild(svgEl('circle', { cx: m.x, cy: m.y, r: '32', fill: m.col + '18', stroke: m.col, 'stroke-width': '1.5', filter: 'url(#gg' + i + ')' }));
      const t = svgEl('text', { x: m.x, y: m.y + 4, 'text-anchor': 'middle', fill: m.col, 'font-size': '10', 'font-family': 'Inter,sans-serif', 'font-weight': '600' });
      t.textContent = m.label.split('–')[0].split(' ')[0];
      const t2 = svgEl('text', { x: m.x, y: m.y + 16, 'text-anchor': 'middle', fill: m.col + 'bb', 'font-size': '9', 'font-family': 'Inter,sans-serif' });
      t2.textContent = m.label.split(' ').slice(1).join(' ');
      const lbl = svgEl('text', { x: m.x, y: m.y - 42, 'text-anchor': 'middle', fill: m.col + '99', 'font-size': '9.5', 'font-family': 'Inter,sans-serif', 'letter-spacing': '0.04em' });
      lbl.textContent = m.label;
      g.appendChild(t); g.appendChild(t2); g.appendChild(lbl);
      svg.appendChild(g); return { g, m };
    });

    const fail = svgEl('g', { opacity: '0' });
    fail.appendChild(svgEl('circle', { cx, cy, r: '44', fill: '#ff444422', stroke: '#ff4444', 'stroke-width': '2', filter: 'url(#gf)' }));
    const ft = svgEl('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', fill: '#ff6666', 'font-size': '11', 'font-family': 'Inter,sans-serif', 'font-weight': '700' });
    ft.textContent = 'Synergistic Failure';
    const fl = svgEl('text', { x: cx, y: cy + 64, 'text-anchor': 'middle', fill: '#ff444477', 'font-size': '10', 'font-family': 'Inter,sans-serif' });
    fl.textContent = 'Γ_coupling > threshold';
    fail.appendChild(ft); fail.appendChild(fl);
    svg.appendChild(fail);

    setTimeout(() => lines.forEach(l => { l.style.transition = 'opacity 0.7s'; l.setAttribute('opacity', '0.7'); }), 350);
    setTimeout(() => {
      groups.forEach(({ g, m }) => {
        const dx = (cx - m.x) * 0.68, dy = (cy - m.y) * 0.68;
        g.style.transition = 'transform 1.15s cubic-bezier(0.4,0,0.2,1)';
        g.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
    }, 1050);
    setTimeout(() => { fail.style.transition = 'opacity 0.7s'; fail.setAttribute('opacity', '1'); }, 2050);
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
      const atFloor = sig <= FLOOR_SIG + 0.5;
      const peak = gauss(mu, sig);
      const scaleY = (H - 55) / peak;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      for (let y = H - 20; y > 15; y -= 45) { ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(W - 20, y); ctx.stroke(); }

      // Entropy floor line
      const floorPeak = gauss(mu, FLOOR_SIG);
      const floorY = H - 20 - floorPeak * scaleY;
      ctx.setLineDash([6, 4]); ctx.strokeStyle = 'rgba(74,144,232,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(50, floorY); ctx.lineTo(W - 20, floorY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(74,144,232,0.55)'; ctx.font = '11px Inter,sans-serif';
      ctx.textAlign = 'right'; ctx.fillText('entropy floor', W - 22, floorY - 6); ctx.textAlign = 'left';

      // Fill
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, atFloor ? 'rgba(74,144,232,0.38)' : 'rgba(74,144,232,0.2)');
      grad.addColorStop(1, 'rgba(74,144,232,0)');
      ctx.beginPath(); ctx.moveTo(50, H - 20);
      for (let x = 50; x <= W - 20; x++) ctx.lineTo(x, H - 20 - gauss(x, sig) * scaleY);
      ctx.lineTo(W - 20, H - 20); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

      // Curve
      ctx.beginPath();
      for (let x = 50; x <= W - 20; x++) {
        const y = H - 20 - gauss(x, sig) * scaleY;
        x === 50 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = atFloor ? '#4a90e8' : 'rgba(74,144,232,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();

      // Floor glow
      if (atFloor) {
        ctx.strokeStyle = 'rgba(74,144,232,0.22)'; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(50, floorY); ctx.lineTo(W - 20, floorY); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(50, 10); ctx.lineTo(50, H - 20); ctx.lineTo(W - 20, H - 20); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText('P(θ | data)', 54, 22); ctx.textAlign = 'center';
      ctx.fillText('θ  (parameter)', W / 2, H - 4); ctx.textAlign = 'left';

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
    const W = 640, H = 280, midX = W / 2;

    const defs = svgEl('defs', {});
    ['hg0','hg1','hg2'].forEach((id, i) => {
      const f = svgEl('filter', { id, x: '-50%', y: '-50%', width: '200%', height: '200%' });
      f.appendChild(svgEl('feGaussianBlur', { stdDeviation: '5', result: 'b' }));
      const fm = svgEl('feMerge', {});
      fm.appendChild(svgEl('feMergeNode', { in: 'b' })); fm.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
      f.appendChild(fm); defs.appendChild(f);
    });
    svg.appendChild(defs);

    // Divider
    svg.appendChild(svgEl('line', { x1: midX, y1: 20, x2: midX, y2: H - 20, stroke: 'rgba(255,255,255,0.07)', 'stroke-width': '1', 'stroke-dasharray': '4 4' }));

    // Labels
    [['COMPUTE CLUSTER', midX / 2, '#4a90e8aa'], ['ATTITUDE CONTROL', midX + midX / 2, '#e8a44aaa']].forEach(([txt, x, fill]) => {
      const t = svgEl('text', { x, y: 22, 'text-anchor': 'middle', fill, 'font-size': '10.5', 'font-family': 'Inter,sans-serif', 'font-weight': '600', 'letter-spacing': '0.1em' });
      t.textContent = txt; svg.appendChild(t);
    });

    // Compute nodes
    const nodePts = [{ x: 85, y: 90 }, { x: 158, y: 120 }, { x: 85, y: 155 }, { x: 158, y: 185 }, { x: 100, y: 222 }];
    const nodeCircles = nodePts.map(({ x, y }) => {
      const c = svgEl('circle', { cx: x, cy: y, r: '13', fill: '#4a90e818', stroke: '#4a90e8', 'stroke-width': '1.5', filter: 'url(#hg0)', opacity: '0.4' });
      svg.appendChild(c); return c;
    });

    // Coupling arrow (hidden initially)
    const arrowG = svgEl('g', { opacity: '0' });
    const arrowLine = svgEl('line', { x1: midX - 8, y1: H / 2, x2: midX + 8, y2: H / 2, stroke: '#ff4444', 'stroke-width': '2' });
    const arrowTip = svgEl('polygon', { points: `${midX + 8},${H / 2 - 5} ${midX + 18},${H / 2} ${midX + 8},${H / 2 + 5}`, fill: '#ff4444' });
    const couplingLbl = svgEl('text', { x: midX, y: H / 2 - 14, 'text-anchor': 'middle', fill: '#ff444488', 'font-size': '10', 'font-family': 'Inter,sans-serif' });
    couplingLbl.textContent = 'structural coupling';
    arrowG.appendChild(arrowLine); arrowG.appendChild(arrowTip); arrowG.appendChild(couplingLbl);
    svg.appendChild(arrowG);

    // HERALD badge
    const badgeG = svgEl('g', { opacity: '0' });
    badgeG.appendChild(svgEl('rect', { x: midX - 40, y: H / 2 + 28, width: '80', height: '24', rx: '4', fill: '#17b97818', stroke: '#17b978', 'stroke-width': '1.5', filter: 'url(#hg2)' }));
    const bt = svgEl('text', { x: midX, y: H / 2 + 44, 'text-anchor': 'middle', fill: '#17b978', 'font-size': '12', 'font-family': 'Space Grotesk,sans-serif', 'font-weight': '700' });
    bt.textContent = 'HERALD'; badgeG.appendChild(bt); svg.appendChild(badgeG);

    // Attitude waveform path
    const wavePath = svgEl('path', { stroke: '#e8a44a', 'stroke-width': '2.5', fill: 'none', 'stroke-linecap': 'round' });
    svg.appendChild(wavePath);

    // Animate
    let phase = 0, amp = 42, pulse = 0, t0 = null, heraldOn = false, raf;
    if (raf) cancelAnimationFrame(raf);

    function frame(ts) {
      if (!t0) t0 = ts;
      const ms = ts - t0;
      phase += 0.055; pulse += 0.09;

      nodeCircles.forEach((c, i) => {
        const v = 0.35 + 0.65 * Math.max(0, Math.sin(pulse + i * 0.75));
        c.setAttribute('opacity', v);
      });

      if (ms > 700)  { arrowG.style.transition = 'opacity 0.5s'; arrowG.setAttribute('opacity', '1'); }
      if (ms > 2300 && !heraldOn) {
        heraldOn = true;
        badgeG.style.transition = 'opacity 0.6s'; badgeG.setAttribute('opacity', '1');
        arrowLine.setAttribute('stroke', '#17b97855'); arrowTip.setAttribute('fill', '#17b97855');
        couplingLbl.setAttribute('fill', '#ffffff22');
      }
      if (heraldOn && amp > 3) amp *= 0.975;

      // Draw waveform
      const x0 = midX + 20, x1 = W - 18, wy = H / 2;
      let d = 'M ' + x0 + ' ' + wy;
      for (let x = x0; x <= x1; x += 2) {
        const t = (x - x0) / (x1 - x0);
        d += ' L ' + x + ' ' + (wy + amp * Math.sin(phase + t * 5 * Math.PI));
      }
      wavePath.setAttribute('d', d);
      wavePath.setAttribute('stroke', heraldOn ? '#17b978' : '#e8a44a');

      if (amp > 1.5) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }
})();
