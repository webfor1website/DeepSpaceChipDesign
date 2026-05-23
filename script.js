// ===== Starfield =====
(function () {
  const container = document.getElementById('stars');
  if (!container) return;
  for (let i = 0; i < 200; i++) {
    const s = document.createElement('div'); s.classList.add('star');
    const sz = Math.random() * 2 + 0.4;
    s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--dur:${(Math.random()*4+2).toFixed(1)}s;animation-delay:${(Math.random()*4).toFixed(1)}s`;
    container.appendChild(s);
  }
})();

// ===== Navbar =====
(function () {
  const nb = document.querySelector('.navbar');
  if (!nb) return;
  const fn = () => nb.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', fn, { passive: true }); fn();
})();

// ===== Nebula parallax =====
(function () {
  const neb = document.querySelector('.hero-nebula'), stars = document.getElementById('stars');
  if (!neb) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    neb.style.transform = `translateY(${y * 0.28}px)`;
    if (stars) stars.style.transform = `translateY(${y * 0.12}px)`;
  }, { passive: true });
})();

// ===== Hamburger =====
(function () {
  const btn = document.getElementById('navHamburger'), links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  const close = () => { links.classList.remove('open'); btn.classList.remove('open'); btn.setAttribute('aria-expanded','false'); btn.setAttribute('aria-label','Open menu'); };
  btn.addEventListener('click', e => { e.stopPropagation(); const o = links.classList.toggle('open'); btn.classList.toggle('open',o); btn.setAttribute('aria-expanded',String(o)); btn.setAttribute('aria-label',o?'Close menu':'Open menu'); });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('click', e => { if (!btn.contains(e.target) && !links.contains(e.target)) close(); });
})();

// ===== Scroll reveal =====
const fadeObs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); fadeObs.unobserve(e.target); } }), { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach((el, i) => { el.style.transitionDelay = `${(i%4)*0.07}s`; fadeObs.observe(el); });

// ===== Visualizer — Mission Control Rebuild =====
(function () {

  // ── Color palette ──
  const C = {
    bg:     '#010409',
    border: 'rgba(255,255,255,0.08)',
    grid:   'rgba(255,255,255,0.05)',
    muted:  'rgba(255,255,255,0.22)',
    text:   'rgba(255,255,255,0.65)',
    green:  '#17b978',
    red:    '#ff4444',
    blue:   '#4a90e8',
    orange: '#e8a44a',
    purple: '#b04ae8',
  };

  // ── Module state ──
  let heraldOn    = true;
  let heraldAmp   = 0;
  let heraldPulse = 0;
  let heraldPhase = 0;

  let gammaDrawPct   = 0;   // 0–100, how far curves are animated
  let gammaScrubYear = 0;   // 0–100, scrubber position
  let gammaPlaying   = true;
  let gammaT0        = null;

  let axiomN       = 1;
  let axiomLastTs  = null;
  let axiomResetAt = null;

  let rafId = null;

  // ── Canvas sizing ──
  function resizeAll() {
    // Use the active panel width as reference for hidden panels
    const ref = document.querySelector('.viz-panel.active') || document.querySelector('.viz-panel');
    const refW = ref ? (ref.clientWidth - 2) : 700;
    const halfW = Math.max(Math.floor((refW - 18) / 2), 120);

    [['gamma-canvas', 280], ['herald-canvas', 280]].forEach(([id, h]) => {
      const c = document.getElementById(id); if (!c) return;
      c.width  = c.offsetWidth > 10 ? c.offsetWidth : refW;
      c.height = h;
    });
    [['axiom-without', 220], ['axiom-with', 220]].forEach(([id, h]) => {
      const c = document.getElementById(id); if (!c) return;
      c.width  = c.offsetWidth > 10 ? c.offsetWidth : halfW;
      c.height = h;
    });
  }
  window.addEventListener('resize', resizeAll);

  // ── Tab switching ──
  document.querySelectorAll('.viz-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.viz-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const p = document.getElementById('viz-' + tab.dataset.tab);
    if (p) p.classList.add('active');
    setTimeout(resizeAll, 30);
  }));

  // ════════════════════════════════
  //  Γ_coupling — Mission Timeline
  // ════════════════════════════════
  const COUPLING_YEAR = 28;
  const FAIL_THRESH   = 0.35;

  function relEM(t)  { return t<=COUPLING_YEAR ? 1-(t/COUPLING_YEAR)*0.13    : 0.87*Math.exp(-(t-COUPLING_YEAR)*0.036); }
  function relTMF(t) { return t<=COUPLING_YEAR ? 1-(t/COUPLING_YEAR)*0.10    : 0.90*Math.exp(-(t-COUPLING_YEAR)*0.029); }
  function relRAD(t) { return t<=COUPLING_YEAR ? 1-(t/COUPLING_YEAR)*0.115   : 0.885*Math.exp(-(t-COUPLING_YEAR)*0.042); }

  function updateGammaBadge(yr) {
    const m = Math.min(relEM(yr), relTMF(yr), relRAD(yr));
    const el = document.getElementById('gamma-status'); if (!el) return;
    if      (m <= FAIL_THRESH)        { el.textContent='● FAILURE';  el.className='mc-badge mc-failure';  }
    else if (m <= FAIL_THRESH + 0.22) { el.textContent='● WARNING';  el.className='mc-badge mc-warning';  }
    else                              { el.textContent='● NOMINAL';  el.className='mc-badge mc-nominal';  }
  }

  function setupGamma() {
    const sl  = document.getElementById('gamma-year');
    const val = document.getElementById('gamma-year-val');
    const rpl = document.getElementById('gamma-replay');
    if (sl && !sl.dataset.wired) {
      sl.dataset.wired = '1';
      sl.addEventListener('input', () => {
        gammaScrubYear = +sl.value;
        gammaDrawPct   = Math.max(gammaDrawPct, gammaScrubYear);
        gammaPlaying   = false;
        if (val) val.textContent = gammaScrubYear + ' yr';
        updateGammaBadge(gammaScrubYear);
      });
    }
    if (rpl && !rpl.dataset.wired) {
      rpl.dataset.wired = '1';
      rpl.addEventListener('click', () => {
        gammaDrawPct = 0; gammaScrubYear = 0; gammaPlaying = true; gammaT0 = null;
        if (sl)  sl.value = 0;
        if (val) val.textContent = '0 yr';
        updateGammaBadge(0);
      });
    }
  }

  function drawGamma(ts) {
    const canvas = document.getElementById('gamma-canvas');
    if (!canvas || canvas.width < 10) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const PL=56, PR=22, PT=32, PB=40;
    const pw = W-PL-PR, ph = H-PT-PB;

    if (gammaPlaying) {
      if (!gammaT0) gammaT0 = ts;
      gammaDrawPct   = Math.min(100, ((ts - gammaT0) / 3000) * 100);
      gammaScrubYear = Math.round(gammaDrawPct);
      const sl  = document.getElementById('gamma-year');
      const val = document.getElementById('gamma-year-val');
      if (sl)  sl.value = gammaScrubYear;
      if (val) val.textContent = gammaScrubYear + ' yr';
      updateGammaBadge(gammaScrubYear);
      if (gammaDrawPct >= 100) gammaPlaying = false;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

    // Horizontal grid & Y labels
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = PT + (i/5)*ph;
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(PL+pw, y); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText((1-i/5).toFixed(1), PL-8, y+3.5);
    }
    // X labels
    for (let yr = 0; yr <= 100; yr += 20) {
      const x = PL + (yr/100)*pw;
      ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT+ph); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(yr === 0 ? 'Launch' : yr+'yr', x, PT+ph+16);
    }
    // Axis labels
    ctx.save(); ctx.translate(14, PT+ph/2); ctx.rotate(-Math.PI/2);
    ctx.fillStyle = C.muted; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('RELIABILITY', 0, 0); ctx.restore();
    ctx.fillStyle = C.muted; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('MISSION YEAR', PL+pw/2, PT+ph+30);

    // Γ coupling zone
    const coupX = PL + (COUPLING_YEAR/100)*pw;
    const coupGrad = ctx.createLinearGradient(coupX,0,coupX+pw*0.055,0);
    coupGrad.addColorStop(0,'rgba(255,68,68,0.08)'); coupGrad.addColorStop(1,'rgba(255,68,68,0)');
    ctx.fillStyle = coupGrad; ctx.fillRect(coupX, PT, pw*0.055, ph);
    ctx.fillStyle='rgba(255,100,100,0.45)'; ctx.font='8px Inter,sans-serif'; ctx.textAlign='center';
    ctx.fillText('\u0393 coupling', coupX+pw*0.027, PT+11);

    // Failure threshold
    const threshY = PT + ph*(1-FAIL_THRESH);
    const minAtScrub = Math.min(relEM(gammaScrubYear), relTMF(gammaScrubYear), relRAD(gammaScrubYear));
    const crossed = minAtScrub <= FAIL_THRESH;
    if (crossed) {
      ctx.strokeStyle='rgba(255,68,68,0.2)'; ctx.lineWidth=10;
      ctx.beginPath(); ctx.moveTo(PL,threshY); ctx.lineTo(PL+pw,threshY); ctx.stroke();
    }
    ctx.setLineDash([5,4]);
    ctx.strokeStyle = crossed ? C.red : 'rgba(255,68,68,0.4)';
    ctx.lineWidth   = crossed ? 2 : 1.2;
    ctx.beginPath(); ctx.moveTo(PL,threshY); ctx.lineTo(PL+pw,threshY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = crossed ? C.red : 'rgba(255,68,68,0.45)';
    ctx.font='8.5px Inter,sans-serif'; ctx.textAlign='left';
    ctx.fillText('failure threshold', PL+6, threshY-5);

    // Curves
    const curves = [
      {fn:relEM,  col:C.blue,   name:'Electromigration'},
      {fn:relTMF, col:C.orange, name:'Thermo-Mech Fatigue'},
      {fn:relRAD, col:C.purple, name:'Radiation Damage'},
    ];
    curves.forEach(({fn, col}) => {
      const endRel  = fn(gammaDrawPct);
      const belowEnd = endRel <= FAIL_THRESH;
      // Fill
      const grad = ctx.createLinearGradient(0,PT,0,PT+ph);
      grad.addColorStop(0, col+'22'); grad.addColorStop(1, col+'00');
      ctx.beginPath(); ctx.moveTo(PL, PT+ph*(1-fn(0)));
      for (let t=0.5; t<=gammaDrawPct; t+=0.5) ctx.lineTo(PL+(t/100)*pw, PT+ph*(1-fn(t)));
      const ex = PL+(gammaDrawPct/100)*pw;
      ctx.lineTo(ex, PT+ph); ctx.lineTo(PL, PT+ph); ctx.closePath();
      ctx.fillStyle=grad; ctx.fill();
      // Line
      const atScrubRel = fn(gammaScrubYear);
      ctx.beginPath(); ctx.moveTo(PL, PT+ph*(1-fn(0)));
      for (let t=0.5; t<=gammaDrawPct; t+=0.5)
        ctx.lineTo(PL+(t/100)*pw, PT+ph*(1-fn(t)));
      ctx.strokeStyle = atScrubRel<=FAIL_THRESH ? C.red : col;
      ctx.lineWidth=2.2; ctx.stroke();
      // Tip dot
      if (gammaDrawPct > 0) {
        ctx.beginPath(); ctx.arc(ex, PT+ph*(1-endRel), 3.5, 0, Math.PI*2);
        ctx.fillStyle = belowEnd ? C.red : col; ctx.fill();
      }
    });

    // Scrubber line
    const sx = PL+(gammaScrubYear/100)*pw;
    ctx.strokeStyle='rgba(255,255,255,0.32)'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(sx,PT); ctx.lineTo(sx,PT+ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='9px Space Grotesk,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Yr '+gammaScrubYear, sx, PT-11);

    // Legend
    curves.forEach(({col,name},i) => {
      const lx=PL+pw-148, ly=PT+16+i*17;
      ctx.fillStyle=col; ctx.fillRect(lx,ly-3,16,2.5);
      ctx.fillStyle=C.text; ctx.font='8.5px Inter,sans-serif'; ctx.textAlign='left';
      ctx.fillText(name, lx+20, ly);
    });
  }

  // ════════════════════════════════
  //  AXIOM — Live Posterior
  // ════════════════════════════════
  const A_BASE  = 145;
  const A_FLOOR = 26;

  function hBits(sigma) { return (0.5*Math.log(2*Math.PI*Math.E*sigma*sigma))/Math.LN2; }
  function gauss(x, mu, sig) { return Math.exp(-0.5*((x-mu)/sig)**2)/(sig*Math.sqrt(2*Math.PI)); }

  function setupAxiom() {
    const rpl = document.getElementById('axiom-reset');
    if (rpl && !rpl.dataset.wired) {
      rpl.dataset.wired = '1';
      rpl.addEventListener('click', ()=>{ axiomN=1; axiomLastTs=null; axiomResetAt=null; });
    }
  }

  function drawAxiomPane(id, withAxiom, n) {
    const canvas = document.getElementById(id);
    if (!canvas || canvas.width < 10) return;
    const ctx = canvas.getContext('2d');
    const W=canvas.width, H=canvas.height, mu=W/2;
    const PL=14, PR=14, PT=18, PB=26;
    const pw=W-PL-PR, ph=H-PT-PB;

    const sigRaw  = A_BASE / Math.sqrt(n);
    const sigma   = withAxiom ? Math.max(sigRaw, A_FLOOR) : sigRaw;
    const atFloor = withAxiom && sigma <= A_FLOOR+0.5;
    const danger  = !withAxiom && sigRaw < A_FLOOR*1.5;

    // DOM updates
    const eEl = document.getElementById(withAxiom?'entropy-yes':'entropy-no');
    const sEl = document.getElementById(withAxiom?'axiom-status-yes':'axiom-status-no');
    if (eEl) eEl.textContent = hBits(sigma).toFixed(2);
    if (sEl) {
      if      (danger)    { sEl.textContent='\u26a0 OVERCONFIDENT'; sEl.className='mc-badge mc-failure'; }
      else if (atFloor)   { sEl.textContent='\u2713 FLOOR ACTIVE';  sEl.className='mc-badge mc-nominal'; }
      else                { sEl.textContent='\u25cf NOMINAL';        sEl.className='mc-badge mc-nominal'; }
    }

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H);

    // Grid
    ctx.strokeStyle=C.grid; ctx.lineWidth=1;
    for (let i=0;i<=3;i++) { const y=PT+i*(ph/3); ctx.beginPath();ctx.moveTo(PL,y);ctx.lineTo(W-PR,y);ctx.stroke(); }

    // Danger shade
    if (danger) { ctx.fillStyle='rgba(255,68,68,0.04)'; ctx.fillRect(PL,PT,pw,ph); }

    // Compute peak for Y scale
    const peakSig = Math.max(sigma, 3.5);
    const peak    = gauss(mu, mu, peakSig);
    const scaleY  = ph / (peak * 1.25);

    // Ghost no-floor curve (WITH AXIOM only, when floor is active)
    if (withAxiom && sigRaw < A_FLOOR*2.8) {
      const gp = gauss(mu, mu, sigRaw);
      const gs = ph / (gp * 1.25);
      ctx.save(); ctx.setLineDash([4,4]);
      ctx.strokeStyle='rgba(255,100,50,0.35)'; ctx.lineWidth=1.4;
      ctx.beginPath();
      for (let x=PL;x<=W-PR;x++) { const y=H-PB-gauss(x,mu,sigRaw)*gs; x===PL?ctx.moveTo(x,y):ctx.lineTo(x,y); }
      ctx.stroke(); ctx.restore();
    }

    // Entropy floor line
    if (withAxiom) {
      const fy = H-PB-gauss(mu,mu,A_FLOOR)*scaleY;
      if (atFloor) {
        ctx.strokeStyle='rgba(74,144,232,0.12)'; ctx.lineWidth=10;
        ctx.beginPath();ctx.moveTo(PL,fy);ctx.lineTo(W-PR,fy);ctx.stroke();
      }
      ctx.setLineDash([5,4]);
      ctx.strokeStyle = atFloor?'rgba(90,168,255,0.85)':'rgba(74,144,232,0.28)';
      ctx.lineWidth=1.4; ctx.beginPath();ctx.moveTo(PL,fy);ctx.lineTo(W-PR,fy);ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=atFloor?'rgba(90,168,255,0.8)':'rgba(74,144,232,0.38)';
      ctx.font='8px Inter,sans-serif'; ctx.textAlign='right';
      ctx.fillText('entropy floor',W-PR-2,fy-4); ctx.textAlign='left';
    }

    // Fill
    const grad = ctx.createLinearGradient(0,PT,0,H-PB);
    grad.addColorStop(0, danger?'rgba(255,68,68,0.3)':(atFloor?'rgba(74,144,232,0.38)':'rgba(74,144,232,0.15)'));
    grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.moveTo(PL,H-PB);
    for (let x=PL;x<=W-PR;x++) ctx.lineTo(x, H-PB-gauss(x,mu,sigma)*scaleY);
    ctx.lineTo(W-PR,H-PB); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();

    // Glow when at floor
    if (atFloor) {
      ctx.beginPath();
      for (let x=PL;x<=W-PR;x++){const y=H-PB-gauss(x,mu,sigma)*scaleY;x===PL?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.strokeStyle='rgba(74,144,232,0.16)'; ctx.lineWidth=10; ctx.stroke();
    }

    // Main curve
    ctx.beginPath();
    for (let x=PL;x<=W-PR;x++){const y=H-PB-gauss(x,mu,sigma)*scaleY;x===PL?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.strokeStyle = danger?C.red:(atFloor?'#5aadff':C.blue);
    ctx.lineWidth = danger?3:(atFloor?2.8:2.2); ctx.stroke();

    // Stats overlay
    ctx.fillStyle=C.muted; ctx.font='8.5px Space Grotesk,sans-serif'; ctx.textAlign='left';
    ctx.fillText('n='+n, PL+4, PT+14);
    ctx.textAlign='right'; ctx.fillText('\u03c3='+sigma.toFixed(1), W-PR-3, PT+14); ctx.textAlign='left';

    // X axis
    ctx.strokeStyle=C.grid; ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(PL,H-PB);ctx.lineTo(W-PR,H-PB);ctx.stroke();
    ctx.fillStyle=C.muted; ctx.font='8px Inter,sans-serif'; ctx.textAlign='center';
    ctx.fillText('\u03b8 (parameter)', W/2, H-7);
  }

  // ════════════════════════════════
  //  HERALD — Power vs Stability
  // ════════════════════════════════
  function setupHerald() {
    const tog = document.getElementById('herald-toggle');
    const psl = document.getElementById('herald-power');
    const pvl = document.getElementById('herald-power-val');
    if (tog && !tog.dataset.wired) {
      tog.dataset.wired='1';
      tog.addEventListener('click',()=>{
        heraldOn = !heraldOn;
        tog.textContent = heraldOn ? 'HERALD ON' : 'HERALD OFF';
        tog.className   = heraldOn ? 'mc-btn mc-btn-green' : 'mc-btn mc-btn-red';
      });
    }
    if (psl && !psl.dataset.wired) {
      psl.dataset.wired='1';
      psl.addEventListener('input',()=>{ if(pvl) pvl.textContent=psl.value+' MW'; });
    }
  }

  function drawHerald() {
    const canvas = document.getElementById('herald-canvas');
    if (!canvas || canvas.width < 10) return;
    const ctx = canvas.getContext('2d');
    const W=canvas.width, H=canvas.height, midX=W/2;
    const psl   = document.getElementById('herald-power');
    const power = psl ? +psl.value : 15;

    heraldPulse += 0.08; heraldPhase += 0.05;
    const tgtAmp = heraldOn ? 0 : power * 0.65;
    heraldAmp += (tgtAmp - heraldAmp) * 0.04;

    // Status badge
    const sEl = document.getElementById('herald-status');
    if (sEl) {
      if      (!heraldOn && power>55) { sEl.textContent='\u26a0 FAILURE IMMINENT'; sEl.className='mc-badge mc-failure'; }
      else if (!heraldOn && power>25) { sEl.textContent='\u25cf WARNING';          sEl.className='mc-badge mc-warning'; }
      else                            { sEl.textContent='\u25cf NOMINAL';          sEl.className='mc-badge mc-nominal'; }
    }

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H);

    // Center divider
    ctx.strokeStyle=C.border; ctx.lineWidth=1; ctx.setLineDash([3,4]);
    ctx.beginPath();ctx.moveTo(midX,12);ctx.lineTo(midX,H-12);ctx.stroke(); ctx.setLineDash([]);

    // Section labels
    ctx.font='8.5px Inter,sans-serif'; ctx.textAlign='center';
    ctx.fillStyle='rgba(74,144,232,0.6)';  ctx.fillText('COMPUTE CLUSTER',   midX/2,         17);
    ctx.fillStyle='rgba(232,164,74,0.6)';  ctx.fillText('ATTITUDE CONTROL',  midX+midX/2,    17);

    // ── Left: Compute cluster ──
    const npts = [
      {x:midX*0.18,y:H*0.25},{x:midX*0.5,y:H*0.18},{x:midX*0.82,y:H*0.25},
      {x:midX*0.18,y:H*0.65},{x:midX*0.5,y:H*0.75},{x:midX*0.82,y:H*0.65},
    ];

    const fOp = Math.min(power/65,1) * (heraldOn ? 0.24 : 0.62);
    npts.forEach((np,ni) => {
      const pv = 0.3 + 0.7*Math.abs(Math.sin(heraldPulse+ni*0.8));

      // Magnetic field line to divider
      const lineOp = (fOp*pv).toFixed(2);
      if (+lineOp > 0.02) {
        const cpx = np.x+(midX-np.x)*0.45+Math.sin(heraldPhase+ni)*11;
        const cpy = np.y+(H/2-np.y)*0.22;
        const ey  = H/2+(ni-2.5)*H*0.11;
        ctx.beginPath(); ctx.moveTo(np.x,np.y); ctx.quadraticCurveTo(cpx,cpy,midX-10,ey);
        ctx.strokeStyle = heraldOn ? 'rgba(23,185,120,'+lineOp+')' : 'rgba(74,144,232,'+lineOp+')';
        ctx.lineWidth=1; ctx.stroke();
      }
      // Glow halo
      const rv = Math.max(0,Math.sin(heraldPulse*0.7+ni*0.65));
      ctx.beginPath(); ctx.arc(np.x,np.y,13+rv*power*0.10,0,Math.PI*2);
      ctx.fillStyle='rgba(74,144,232,'+(0.04+0.06*(power/100)).toFixed(2)+')'; ctx.fill();
      // Core node
      ctx.globalAlpha = pv;
      ctx.beginPath(); ctx.arc(np.x,np.y,5+(power/100)*3.5,0,Math.PI*2);
      ctx.fillStyle=C.blue; ctx.fill(); ctx.globalAlpha=1;
    });

    // Power readout
    ctx.fillStyle='rgba(74,144,232,0.4)'; ctx.font='8px Space Grotesk,sans-serif'; ctx.textAlign='center';
    ctx.fillText(power+' MW', midX*0.5, H-10);

    // ── Right: Attitude waveform ──
    const x0=midX+14, x1=W-14, wy=H/2;
    const wCol = heraldOn ? C.green : (power>55 ? C.red : C.orange);
    const harmonics = heraldOn ? 1 : Math.min(1+power/32,3.5);

    // Waveform glow (chaos)
    if (heraldAmp > 18) {
      ctx.beginPath();
      for (let x=x0;x<=x1;x+=2) {
        const t=(x-x0)/(x1-x0);
        const y=wy+heraldAmp*Math.sin(heraldPhase*2+t*5.5*Math.PI)
               +(harmonics>1?heraldAmp*0.3*Math.sin(heraldPhase*5+t*11*Math.PI):0);
        x===x0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      const glowCol = heraldOn?'rgba(23,185,120,0.12)':(power>55?'rgba(255,68,68,0.14)':'rgba(232,164,74,0.12)');
      ctx.strokeStyle=glowCol; ctx.lineWidth=12; ctx.stroke();
    }

    // Main waveform
    ctx.beginPath();
    for (let x=x0;x<=x1;x++) {
      const t=(x-x0)/(x1-x0);
      const y = heraldAmp < 1.5 ? wy
        : wy + heraldAmp*Math.sin(heraldPhase*2+t*5.5*Math.PI)
             + (harmonics>1 ? heraldAmp*0.28*Math.sin(heraldPhase*5+t*11*Math.PI) : 0)
             + (harmonics>2.5 ? heraldAmp*0.14*Math.sin(heraldPhase*9+t*17*Math.PI) : 0);
      x===x0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle=wCol; ctx.lineWidth=heraldAmp>35?3:2; ctx.stroke();

    // Status labels
    if (heraldAmp < 3 && heraldOn) {
      ctx.fillStyle=C.green; ctx.font='9px Space Grotesk,sans-serif'; ctx.textAlign='center';
      ctx.fillText('STABLE \u2014 HERALD ACTIVE', x0+(x1-x0)/2, wy-20);
    }
    if (!heraldOn && power>55) {
      ctx.fillStyle=C.red; ctx.font='9px Space Grotesk,sans-serif'; ctx.textAlign='center';
      ctx.fillText('\u26a0  ATTITUDE FAILURE IMMINENT', x0+(x1-x0)/2, wy-22);
    }

    // Power bar (right edge)
    const PH=H-40, barH=(power/100)*PH*0.55;
    ctx.fillStyle=heraldOn?'rgba(23,185,120,0.18)':(power>55?'rgba(255,68,68,0.18)':'rgba(232,164,74,0.14)');
    ctx.fillRect(W-9, wy-barH/2, 4, barH);
  }

  // ════════════════════════════════
  //  Main animation loop
  // ════════════════════════════════
  function loop(ts) {
    // Advance AXIOM N
    const spd = +(document.getElementById('axiom-speed')?.value || 3);
    if (!axiomLastTs) axiomLastTs = ts;
    const dt = Math.min(ts-axiomLastTs, 100); axiomLastTs = ts;
    axiomN += spd * dt * 0.003;
    if (axiomN >= 120) {
      axiomN = 120;
      if (!axiomResetAt) axiomResetAt = ts;
      if (ts - axiomResetAt > 1500) { axiomN=1; axiomResetAt=null; }
    } else { axiomResetAt=null; }

    drawGamma(ts);
    drawAxiomPane('axiom-without', false, Math.round(axiomN));
    drawAxiomPane('axiom-with',    true,  Math.round(axiomN));
    drawHerald();

    rafId = requestAnimationFrame(loop);
  }

  // ── Boot ──
  function boot() {
    resizeAll();
    setupGamma();
    setupAxiom();
    setupHerald();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  let booted = false;
  const vizSec = document.getElementById('visualizer');
  if (vizSec) {
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !booted) { booted=true; setTimeout(boot, 80); }
    }, {threshold:0.08}).observe(vizSec);
  } else { setTimeout(boot, 100); }

})();

// ===== Papers expand =====
(function () {
  const expanded = document.getElementById('paper-expanded');
  const content  = document.getElementById('paper-expanded-content');
  const closeBtn = document.getElementById('paper-close');
  if (!expanded || !content) return;

  const DATA = {
    p1: {
      num:'P1', badgeClass:'pb-axiom', badge:'AXIOM',
      title:'Mandatory Epistemic Humility',
      summary:'How to stop AI from becoming dangerously overconfident on century-scale missions.',
      body:'<p>Autonomous systems operating on century-scale missions accumulate observations far beyond any training distribution. Without enforced limits, Bayesian posterior distributions collapse to near-zero entropy \u2014 the system believes it knows everything.</p><p>This paper introduces the AXIOM entropy floor: a hardware-enforced minimum uncertainty threshold that prevents catastrophic overconfidence. The floor is not a software parameter \u2014 it is a physical constant of the compute substrate.</p><h4>Key Findings</h4><ul><li>Posterior collapse occurs in standard Bayesian systems after ~40 years of uninterrupted observation</li><li>Software-based uncertainty floors are bypassable via self-modification</li><li>AXIOM floor reduces mission-critical decision errors by 3.4\u00d7 on 100-year simulations</li></ul>',
    },
    p2: {
      num:'P2', badgeClass:'pb-gamma', badge:'\u0393_coupling',
      title:'Synergistic Failure in Interconnects',
      summary:'Why standard chip reliability models are wrong by 100\u00d7 for 50+ year deep space missions.',
      body:'<p>Standard reliability models (MIL-HDBK-217, Telcordia) treat failure mechanisms as independent. In deep space environments, this is catastrophically wrong. Electromigration, thermo-mechanical fatigue, and radiation damage interact non-linearly \u2014 each accelerates the others.</p><p>The \u0393_coupling coefficient quantifies this synergistic amplification. Above the coupling threshold, mission lifetime drops from centuries to decades.</p><h4>Key Findings</h4><ul><li>Independent models overestimate MTTF by 100\u2013300\u00d7 for 50-year missions</li><li>\u0393_coupling threshold occurs around year 28 under standard deep space conditions</li><li>Redesigning interconnect geometry to minimize \u0393 extends mission life by 2.4\u00d7</li></ul>',
    },
    p3: {
      num:'P3', badgeClass:'pb-herald', badge:'HERALD',
      title:'ML Schedulers &amp; Attitude Control',
      summary:'How a 40MW compute cluster can knock a spacecraft off course \u2014 and how to stop it.',
      body:'<p>A 40MW neural network training run produces transient electromagnetic fields measurable at the spacecraft\u2019s attitude control sensors. Burst inference workloads create periodic torque perturbations that accumulate over time, degrading navigation accuracy.</p><p>HERALD creates a feedback channel between the ML scheduler and attitude control, allowing workloads to be shaped to cancel rather than amplify structural resonances.</p><h4>Key Findings</h4><ul><li>Unmanaged 40MW inference causes 0.003\u00b0 attitude drift per operational hour</li><li>Over 100 years, accumulated drift exceeds mission-critical thresholds by 8\u00d7</li><li>HERALD reduces attitude perturbation to below sensor noise floor at all tested power levels</li></ul>',
    },
    p4: {
      num:'P4', badgeClass:'pb-fab', badge:'FABRICATION',
      title:'Self-Replicating Architecture',
      summary:'A complete blueprint for a spacecraft that builds its own replacement parts.',
      body:'<p>Any system operating for 100+ years will exhaust its spare parts. Self-replication is not a luxury \u2014 it is a mission-critical requirement. This paper presents a complete fabrication architecture based on in-situ resource utilization and autonomous chip manufacturing.</p><p>The system can produce replacement compute substrates from asteroid-derived silicon with a replication fidelity of &gt;99.97% per generation.</p><h4>Key Findings</h4><ul><li>Complete chip fabrication cycle achievable with 280 kg of dedicated hardware mass</li><li>First replication event possible within 8 years using belt asteroid resources</li><li>Replication fidelity degrades gracefully \u2014 12 generations before performance drops below threshold</li></ul>',
    },
    p5: {
      num:'P5', badgeClass:'pb-pioneer', badge:'PIONEER',
      title:'Civilization Seed Architecture',
      summary:'The full long-range extrapolation \u2014 from compute platform to interstellar civilization.',
      body:'<p>If a self-replicating, self-governing compute platform can survive 100 years and begin replication, what does the trajectory look like at 500 years? At 1,000? This paper performs the full extrapolation.</p><p>A single Pioneer-class seed launched in 2050 reaches a civilization-seed threshold \u2014 autonomous resource extraction, manufacturing, governance, and expansion capability \u2014 within 150 years of deployment.</p><h4>Key Findings</h4><ul><li>Replication doubling time stabilizes at ~11 years under optimal resource conditions</li><li>Constitutional governance frameworks remain coherent for 8+ replication generations without human intervention</li><li>Civilization-seed threshold reachable by 2200 from a 2050 launch</li></ul>',
    },
  };

  document.querySelectorAll('.paper-read-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = DATA[btn.dataset.target]; if (!p) return;
      content.innerHTML =
        '<div class="pex-header"><span class="paper-num" style="position:static;font-size:1.1rem;color:var(--accent);opacity:0.85">' + p.num + '</span><span class="paper-badge ' + p.badgeClass + '">' + p.badge + '</span></div>' +
        '<h2 class="pex-title">' + p.title + '</h2>' +
        '<p class="pex-summary">' + p.summary + '</p>' +
        '<div class="pex-body">' + p.body + '</div>';
      expanded.classList.add('open');
      setTimeout(()=>expanded.scrollIntoView({behavior:'smooth',block:'start'}),60);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click',()=>{
    expanded.classList.remove('open');
    const sec=document.getElementById('papers'); if(sec) sec.scrollIntoView({behavior:'smooth',block:'start'});
  });
})();
