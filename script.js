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

// ===== Visualizer =====
(function () {

  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v)); return el;
  }

  // Module-level state
  let gammaTimers = [], gammaYearInterval = null;
  let heraldRaf = null, heraldOn = true;
  let axiomAutoTimer = null, axiomWithMode = true, axiomReady = false;

  // ─────────────────────────────────────────
  // Γ_coupling
  // ─────────────────────────────────────────
  function initGamma() {
    gammaTimers.forEach(clearTimeout); gammaTimers = [];
    if (gammaYearInterval) { clearInterval(gammaYearInterval); gammaYearInterval = null; }

    const svg       = document.getElementById('gamma-svg');
    const speedEl   = document.getElementById('gamma-speed');
    const yearsEl   = document.getElementById('gamma-years');
    const statusEl  = document.getElementById('gamma-status');
    const tipEl     = document.getElementById('gamma-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    const SPEEDS = [0.5, 1, 1.5, 2.5, 4];
    const spd = speedEl ? SPEEDS[+speedEl.value - 1] : 1;

    if (yearsEl)  yearsEl.textContent = '0';
    if (statusEl) { statusEl.textContent = '\u25cf NOMINAL'; statusEl.className = 'mission-badge badge-nominal'; }

    const W = 700, H = 420, cx = W/2, cy = 215;
    const mechs = [
      { lbl:'Electromigration',     sub:'electrons slowly push metal atoms',    x:118, y:90,  col:'#4a90e8',
        tip:'Metal ions drift along current flow paths, gradually widening grain boundaries. Over decades, this creates voids that sever electrical connections.' },
      { lbl:'Thermo-Mech. Fatigue', sub:'extreme heat/cold cracks connections', x:582, y:90,  col:'#e8a44a',
        tip:'Thermal cycling between deep-space cold and operational heat stresses solder joints cyclically. Micro-cracks propagate until the joint fractures completely.' },
      { lbl:'Radiation Damage',     sub:'cosmic rays knock atoms out of place', x:350, y:385, col:'#b04ae8',
        tip:'High-energy particles displace lattice atoms, creating defect clusters that act as charge traps. These degrade transistor performance incrementally over decades.' },
    ];

    const defs = svgEl('defs',{});
    mechs.forEach((m,i) => {
      const f = svgEl('filter',{id:'gg'+i,x:'-80%',y:'-80%',width:'260%',height:'260%'});
      f.appendChild(svgEl('feGaussianBlur',{stdDeviation:'7',result:'b'}));
      const fm = svgEl('feMerge',{}); fm.appendChild(svgEl('feMergeNode',{in:'b'})); fm.appendChild(svgEl('feMergeNode',{in:'SourceGraphic'}));
      f.appendChild(fm); defs.appendChild(f);
    });
    const gf = svgEl('filter',{id:'gf',x:'-120%',y:'-120%',width:'340%',height:'340%'});
    gf.appendChild(svgEl('feGaussianBlur',{stdDeviation:'16',result:'b'}));
    const gfm = svgEl('feMerge',{}); gfm.appendChild(svgEl('feMergeNode',{in:'b'})); gfm.appendChild(svgEl('feMergeNode',{in:'SourceGraphic'}));
    gf.appendChild(gfm); defs.appendChild(gf);
    svg.appendChild(defs);

    const lines = mechs.map(m => {
      const l = svgEl('line',{x1:m.x,y1:m.y,x2:cx,y2:cy,stroke:m.col,'stroke-width':'1.8','stroke-dasharray':'8 5',opacity:'0'});
      svg.appendChild(l); return l;
    });

    mechs.forEach((m,i) => {
      const g = svgEl('g',{style:'cursor:pointer'});
      g.appendChild(svgEl('circle',{cx:m.x,cy:m.y,r:'50',fill:'none',stroke:m.col,'stroke-width':'1',opacity:'0.15'}));
      g.appendChild(svgEl('circle',{cx:m.x,cy:m.y,r:'38',fill:m.col+'20',stroke:m.col,'stroke-width':'2',filter:'url(#gg'+i+')'}));
      const t1 = svgEl('text',{x:m.x,y:m.y-3,'text-anchor':'middle',fill:m.col,'font-size':'11.5','font-family':'Space Grotesk,sans-serif','font-weight':'700','pointer-events':'none'});
      t1.textContent = m.lbl.split(' ')[0];
      const t2 = svgEl('text',{x:m.x,y:m.y+12,'text-anchor':'middle',fill:m.col+'bb','font-size':'9.5','font-family':'Inter,sans-serif','pointer-events':'none'});
      t2.textContent = m.lbl.split(' ').slice(1).join(' ');
      const subY = m.y < H/2 ? m.y+62 : m.y-58;
      const sub = svgEl('text',{x:m.x,y:subY,'text-anchor':'middle',fill:'rgba(200,215,235,0.5)','font-size':'9.5','font-family':'Inter,sans-serif','font-style':'italic','pointer-events':'none'});
      sub.textContent = '"'+m.sub+'"';
      g.appendChild(t1); g.appendChild(t2); g.appendChild(sub);
      if (tipEl) {
        g.addEventListener('mousemove', e => {
          const r = svg.closest('.viz-panel').getBoundingClientRect();
          tipEl.style.left = (e.clientX - r.left + 12)+'px';
          tipEl.style.top  = (e.clientY - r.top  + 12)+'px';
          tipEl.textContent = m.tip; tipEl.style.opacity = '1';
        });
        g.addEventListener('mouseleave', () => { tipEl.style.opacity = '0'; });
      }
      svg.appendChild(g);
    });

    const failG = svgEl('g',{opacity:'0'});
    failG.appendChild(svgEl('circle',{cx,cy,r:'54',fill:'#ff444428',stroke:'#ff4444','stroke-width':'2.5',filter:'url(#gf)'}));
    const ft = svgEl('text',{x:cx,y:cy+5,'text-anchor':'middle',fill:'#ff7777','font-size':'12.5','font-family':'Space Grotesk,sans-serif','font-weight':'700'});
    ft.textContent = 'Synergistic Failure';
    const fl = svgEl('text',{x:cx,y:cy+72,'text-anchor':'middle',fill:'#ff444466','font-size':'10.5','font-family':'Inter,sans-serif'});
    fl.textContent = '\u0393_coupling > threshold';
    failG.appendChild(ft); failG.appendChild(fl); svg.appendChild(failG);

    function shockwave() {
      for (let i=0;i<4;i++) setTimeout(() => {
        const ring = svgEl('circle',{cx,cy,r:'54',fill:'none',stroke:'#ff4444','stroke-width':'3',opacity:'0.85'});
        svg.appendChild(ring); let r=54,op=0.85;
        const tick = setInterval(() => { r+=5.5; op-=0.042; ring.setAttribute('r',r); ring.setAttribute('opacity',Math.max(0,op)); if(op<=0){clearInterval(tick);if(ring.parentNode)ring.parentNode.removeChild(ring);} }, 24);
      }, i*220);
    }

    const dur = 3400/spd;
    let yr=0;
    gammaYearInterval = setInterval(() => {
      yr = Math.min(yr+1, 50);
      if (yearsEl) yearsEl.textContent = yr;
      if (statusEl) {
        if      (yr >= 50) { statusEl.textContent='\u25cf FAILURE';   statusEl.className='mission-badge badge-failure';   clearInterval(gammaYearInterval); gammaYearInterval=null; }
        else if (yr >= 25) { statusEl.textContent='\u25cf DEGRADING'; statusEl.className='mission-badge badge-degrading'; }
      }
    }, dur/50);

    gammaTimers.push(
      setTimeout(()=>lines.forEach(l=>{ l.style.transition='opacity 1s'; l.setAttribute('opacity','0.8'); }), 450/spd),
      setTimeout(()=>{
        svg.querySelectorAll('g[style="cursor:pointer"]').forEach((g,i) => {
          const m=mechs[i]; const dx=(cx-m.x)*0.7, dy=(cy-m.y)*0.7;
          g.style.transition='transform '+(1700/spd)+'ms cubic-bezier(0.4,0,0.2,1)';
          g.style.transform='translate('+dx+'px,'+dy+'px)';
        });
      }, 1500/spd),
      setTimeout(()=>{ failG.style.transition='opacity 0.9s'; failG.setAttribute('opacity','1'); shockwave(); }, 3200/spd)
    );
  }

  // Speed label sync
  const speedEl = document.getElementById('gamma-speed');
  const speedLbls = ['0.5\u00d7','1\u00d7','1.5\u00d7','2.5\u00d7','4\u00d7'];
  if (speedEl) {
    const lblEl = document.getElementById('gamma-speed-label');
    speedEl.addEventListener('input', () => { if(lblEl) lblEl.textContent=speedLbls[+speedEl.value-1]; initGamma(); });
  }

  // ─────────────────────────────────────────
  // AXIOM Entropy Floor
  // ─────────────────────────────────────────
  function initAxiom() {
    const canvas  = document.getElementById('axiom-canvas');
    const slider  = document.getElementById('axiom-slider');
    const countEl = document.getElementById('axiom-count');
    const flLbl   = document.getElementById('axiom-floor-label');
    const badge   = document.getElementById('axiom-badge');
    const btnWith = document.getElementById('axiom-btn-with');
    const btnNo   = document.getElementById('axiom-btn-without');
    if (!canvas||!slider) return;

    const ctx = canvas.getContext('2d');
    const W=canvas.width, H=canvas.height, mu=W/2, BASE=145, FLOOR=26;

    function sigma(n,withAxiom){ return withAxiom ? Math.max(BASE/Math.sqrt(n),FLOOR) : BASE/Math.sqrt(n); }
    function g(x,s){ return Math.exp(-0.5*((x-mu)/s)**2)/(s*Math.sqrt(2*Math.PI)); }

    function draw(n) {
      ctx.clearRect(0,0,W,H);
      const withA = axiomWithMode;
      const s  = sigma(n,withA);
      const sNF= BASE/Math.sqrt(n);
      const atFloor = withA && s <= FLOOR+0.5;
      const peak = g(mu, Math.max(s,5));
      const sy   = (H-72)/peak;

      // Grid
      ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
      for (let y=H-26;y>20;y-=50){ctx.beginPath();ctx.moveTo(55,y);ctx.lineTo(W-20,y);ctx.stroke();}

      // Ghost no-floor curve
      if (withA && sNF < FLOOR*2.8) {
        ctx.save(); ctx.setLineDash([5,5]); ctx.strokeStyle='rgba(232,100,50,0.55)'; ctx.lineWidth=1.8;
        ctx.beginPath();
        for(let x=55;x<=W-20;x++){const y=H-26-g(x,sNF)*sy; x===55?ctx.moveTo(x,y):ctx.lineTo(x,y);}
        ctx.stroke(); ctx.restore();
        ctx.fillStyle='rgba(240,110,60,0.7)'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='center';
        ctx.fillText('Without AXIOM \u2014 dangerous certainty', mu+80, Math.max(H-26-g(mu,sNF)*sy-12,14));
        ctx.textAlign='left';
      }

      // Danger shading (no-AXIOM mode, high n)
      if (!withA && n>30) { ctx.fillStyle='rgba(255,50,50,0.05)'; ctx.fillRect(mu-80,0,160,H-26); }

      // Floor line
      if (withA) {
        const fy = H-26-g(mu,FLOOR)*sy;
        if (atFloor) { ctx.strokeStyle='rgba(74,144,232,0.14)'; ctx.lineWidth=10; ctx.beginPath(); ctx.moveTo(55,fy); ctx.lineTo(W-20,fy); ctx.stroke(); }
        ctx.setLineDash([6,4]); ctx.strokeStyle=atFloor?'rgba(90,168,255,0.9)':'rgba(74,144,232,0.38)'; ctx.lineWidth=atFloor?2.2:1.5;
        ctx.beginPath(); ctx.moveTo(55,fy); ctx.lineTo(W-20,fy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=atFloor?'rgba(90,168,255,0.9)':'rgba(74,144,232,0.55)'; ctx.font='10.5px Inter,sans-serif'; ctx.textAlign='right';
        ctx.fillText('entropy floor',W-22,fy-8);
        if (atFloor){ ctx.fillStyle='rgba(74,210,200,0.75)'; ctx.font='10px Inter,sans-serif'; ctx.fillText('With AXIOM \u2014 enforced humility',W-22,fy+17); }
        ctx.textAlign='left';
      }

      // Fill
      const gr = ctx.createLinearGradient(0,0,0,H);
      const col = withA ? (atFloor?'rgba(74,144,232,0.48)':'rgba(74,144,232,0.2)') : 'rgba(255,68,68,0.22)';
      gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.moveTo(55,H-26);
      for(let x=55;x<=W-20;x++) ctx.lineTo(x,H-26-g(x,s)*sy);
      ctx.lineTo(W-20,H-26); ctx.closePath(); ctx.fillStyle=gr; ctx.fill();

      // Glow on floor
      if (atFloor) {
        ctx.beginPath(); for(let x=55;x<=W-20;x++){const y=H-26-g(x,s)*sy;x===55?ctx.moveTo(x,y):ctx.lineTo(x,y);}
        ctx.strokeStyle='rgba(74,144,232,0.22)'; ctx.lineWidth=11; ctx.stroke();
      }

      // Curve
      ctx.beginPath(); for(let x=55;x<=W-20;x++){const y=H-26-g(x,s)*sy;x===55?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.strokeStyle = withA ? (atFloor?'#5aadff':'rgba(74,144,232,0.9)') : (n>80?'rgba(255,60,40,0.95)':'rgba(255,140,80,0.9)');
      ctx.lineWidth = atFloor?3:2.5; ctx.stroke();

      // Axes
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(55,12); ctx.lineTo(55,H-26); ctx.lineTo(W-20,H-26); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.font='10px Inter,sans-serif';
      ctx.fillText('P(\u03b8 | data)',58,24); ctx.textAlign='center';
      ctx.fillText('\u03b8  (parameter value)',W/2,H-7); ctx.textAlign='left';

      if (flLbl) flLbl.style.opacity = atFloor?'1':'0';

      if (badge) {
        if (!withA && n>80) {
          badge.textContent='\u26a0 OVERCONFIDENT \u2014 MISSION CRITICAL';
          badge.className='scenario-badge badge-danger'; badge.style.display='inline-block';
        } else if (atFloor) {
          badge.textContent='\u2713 EPISTEMICALLY SAFE';
          badge.className='scenario-badge badge-safe'; badge.style.display='inline-block';
        } else {
          badge.style.display='none';
        }
      }
    }

    function autoPlay(withA) {
      if (axiomAutoTimer) clearInterval(axiomAutoTimer);
      axiomWithMode = withA; slider.value=1; countEl.textContent=1; draw(1); let n=1;
      axiomAutoTimer = setInterval(()=>{ n=Math.min(n+2,120); slider.value=n; countEl.textContent=n; draw(n); if(n>=120){clearInterval(axiomAutoTimer);axiomAutoTimer=null;} },55);
    }

    slider.addEventListener('input', ()=>{ const n=+slider.value; countEl.textContent=n; draw(n); });

    if (btnWith) btnWith.addEventListener('click', ()=>{
      btnWith.className='scenario-btn active-yes'; if(btnNo) btnNo.className='scenario-btn';
      autoPlay(true);
    });
    if (btnNo) btnNo.addEventListener('click', ()=>{
      btnNo.className='scenario-btn active-no'; if(btnWith) btnWith.className='scenario-btn';
      autoPlay(false);
    });

    autoPlay(true);
  }

  // ─────────────────────────────────────────
  // HERALD
  // ─────────────────────────────────────────
  function initHerald() {
    if (heraldRaf) { cancelAnimationFrame(heraldRaf); heraldRaf=null; }
    const svg      = document.getElementById('herald-svg');
    const powerSl  = document.getElementById('herald-power');
    const powerLbl = document.getElementById('herald-power-label');
    const togBtn   = document.getElementById('herald-toggle');
    const warnEl   = document.getElementById('herald-warning');
    if (!svg) return;
    svg.innerHTML='';
    const W=700,H=340,mx=W/2;

    // Reset toggle state UI (keep heraldOn from module state)
    if (togBtn) { togBtn.textContent=heraldOn?'HERALD ON':'HERALD OFF'; togBtn.className=heraldOn?'herald-toggle-btn herald-on':'herald-toggle-btn herald-off'; }

    const defs=svgEl('defs',{});
    ['hg0','hg1','hg2','hgf'].forEach(id=>{
      const f=svgEl('filter',{id,x:'-70%',y:'-70%',width:'240%',height:'240%'});
      f.appendChild(svgEl('feGaussianBlur',{stdDeviation:id==='hgf'?'3':'8',result:'b'}));
      const fm=svgEl('feMerge',{}); fm.appendChild(svgEl('feMergeNode',{in:'b'})); fm.appendChild(svgEl('feMergeNode',{in:'SourceGraphic'}));
      f.appendChild(fm); defs.appendChild(f);
    });
    svg.appendChild(defs);

    svg.appendChild(svgEl('line',{x1:mx,y1:20,x2:mx,y2:H-20,stroke:'rgba(255,255,255,0.07)','stroke-width':'1','stroke-dasharray':'4 4'}));
    [['COMPUTE CLUSTER',mx/2,'#4a90e8aa'],['ATTITUDE CONTROL',mx+mx/2,'#e8a44aaa']].forEach(([t,x,f])=>{
      const el=svgEl('text',{x,y:22,'text-anchor':'middle',fill:f,'font-size':'10.5','font-family':'Inter,sans-serif','font-weight':'600','letter-spacing':'0.1em'});
      el.textContent=t; svg.appendChild(el);
    });

    // Magnetic field lines group
    const fieldG = svgEl('g',{id:'fieldG'});
    svg.appendChild(fieldG);

    const nodePts=[{x:78,y:88},{x:155,y:115},{x:78,y:150},{x:158,y:182},{x:90,y:220},{x:162,y:252}];
    const nodes = nodePts.map(({x,y})=>{
      const ring=svgEl('circle',{cx:x,cy:y,r:'22',fill:'none',stroke:'#4a90e8','stroke-width':'1',opacity:'0'});
      const circ=svgEl('circle',{cx:x,cy:y,r:'14',fill:'#4a90e818',stroke:'#4a90e8','stroke-width':'2',filter:'url(#hg0)',opacity:'0.4'});
      svg.appendChild(ring); svg.appendChild(circ); return {ring,circ,x,y};
    });

    const arrG=svgEl('g',{opacity:'0.8'});
    const arrLine=svgEl('line',{x1:mx-12,y1:H/2,x2:mx+14,y2:H/2,stroke:'#ff4444','stroke-width':'2.5'});
    const arrPoly=svgEl('polygon',{points:`${mx+14},${H/2-7} ${mx+28},${H/2} ${mx+14},${H/2+7}`,fill:'#ff4444'});
    const cLbl=svgEl('text',{x:mx,y:H/2-18,'text-anchor':'middle',fill:'#ff444499','font-size':'10','font-family':'Inter,sans-serif'});
    cLbl.textContent='structural coupling';
    arrG.appendChild(arrLine); arrG.appendChild(arrPoly); arrG.appendChild(cLbl); svg.appendChild(arrG);

    const badgeG=svgEl('g',{opacity:'0'});
    badgeG.appendChild(svgEl('rect',{x:mx-46,y:H/2+34,width:'92',height:'28',rx:'5',fill:'#17b97820',stroke:'#17b978','stroke-width':'2',filter:'url(#hg2)'}));
    const bt=svgEl('text',{x:mx,y:H/2+52,'text-anchor':'middle',fill:'#17b978','font-size':'14','font-family':'Space Grotesk,sans-serif','font-weight':'700'});
    bt.textContent='HERALD'; badgeG.appendChild(bt); svg.appendChild(badgeG);

    const nomG=svgEl('g',{opacity:'0'});
    const nomT=svgEl('text',{x:mx+mx/2,y:H-26,'text-anchor':'middle',fill:'#17b978','font-size':'12','font-family':'Space Grotesk,sans-serif','font-weight':'700','letter-spacing':'0.14em'});
    nomT.textContent='\u2713 NOMINAL'; nomG.appendChild(nomT); svg.appendChild(nomG);

    const wave=svgEl('path',{stroke:'#e8a44a','stroke-width':'2.5',fill:'none','stroke-linecap':'round'});
    svg.appendChild(wave);

    // Wire up controls (only add listeners once via data flag)
    if (togBtn && !togBtn.dataset.wired) {
      togBtn.dataset.wired='1';
      togBtn.addEventListener('click', ()=>{
        heraldOn=!heraldOn;
        togBtn.textContent=heraldOn?'HERALD ON':'HERALD OFF';
        togBtn.className=heraldOn?'herald-toggle-btn herald-on':'herald-toggle-btn herald-off';
      });
    }
    if (powerSl && !powerSl.dataset.wired) {
      powerSl.dataset.wired='1';
      powerSl.addEventListener('input', ()=>{ if(powerLbl) powerLbl.textContent=powerSl.value+' MW'; });
    }

    function greenShockwave() {
      for(let i=0;i<4;i++) setTimeout(()=>{
        const r=svgEl('circle',{cx:mx,cy:H/2,r:'22',fill:'none',stroke:'#17b978','stroke-width':'3',opacity:'0.9'});
        svg.appendChild(r); let rv=22,op=0.9;
        const t=setInterval(()=>{ rv+=5.5;op-=0.042;r.setAttribute('r',rv);r.setAttribute('opacity',Math.max(0,op));if(op<=0){clearInterval(t);if(r.parentNode)r.parentNode.removeChild(r);} },26);
      },i*210);
    }

    let amp=0, phase=0, pulse=0, lastOn=true, swFired=false;

    function frame() {
      phase+=0.048; pulse+=0.1;
      const pwr  = powerSl ? +powerSl.value : 20;
      const isOn = heraldOn;
      const tgt  = isOn ? 0 : pwr * 0.75;
      amp += (tgt - amp) * 0.04;

      // Magnetic field lines
      fieldG.innerHTML='';
      const fOp = Math.min(pwr/70,1) * (isOn?0.25:0.65);
      nodePts.forEach(({x,y},ni)=>{
        const cpx=x+(mx-x)*0.4+Math.sin(pulse*0.5+ni)*14;
        const cpy=y+(H/2-y)*0.18;
        const endY=H/2+(ni-2.5)*18;
        const lineOp=(fOp*(0.38+0.62*Math.max(0,Math.sin(pulse+ni*0.7)))).toFixed(2);
        fieldG.appendChild(svgEl('path',{d:`M ${x} ${y} Q ${cpx} ${cpy} ${mx-14} ${endY}`,stroke:'#4a90e8','stroke-width':'1',fill:'none',opacity:lineOp,filter:'url(#hgf)'}));
      });

      nodes.forEach(({ring,circ},i)=>{
        const v=0.28+0.72*Math.max(0,Math.sin(pulse+i*0.62)); circ.setAttribute('opacity',v);
        const rv=Math.max(0,Math.sin(pulse*0.65+i*0.5)); ring.setAttribute('opacity',rv*0.4); ring.setAttribute('r',20+rv*14);
      });

      arrG.setAttribute('opacity',(!isOn||pwr>25)?'0.85':'0.15');
      arrLine.setAttribute('stroke',isOn?'#17b97855':'#ff4444');
      arrPoly.setAttribute('fill',isOn?'#17b97855':'#ff4444');
      cLbl.setAttribute('fill',isOn?'#ffffff18':'#ff444499');

      badgeG.style.transition='opacity 0.4s'; badgeG.setAttribute('opacity',isOn?'1':'0');
      const flatlined = isOn && amp<2;
      nomG.style.transition='opacity 0.7s'; nomG.setAttribute('opacity',flatlined?'1':'0');

      if (isOn && !lastOn && !swFired) { swFired=true; greenShockwave(); }
      if (!isOn) swFired=false;
      lastOn=isOn;

      if (warnEl) warnEl.style.opacity=(!isOn&&pwr>50)?'1':'0';

      const x0=mx+26,x1=W-18,wy=H/2;
      let d='M '+x0+' '+wy;
      for(let x=x0;x<=x1;x+=2){ const t=(x-x0)/(x1-x0); d+=' L '+x+' '+(wy+amp*Math.sin(phase+t*5.5*Math.PI)); }
      wave.setAttribute('d',d);
      wave.setAttribute('stroke',isOn?'#17b978':(pwr>55?'#ff5533':'#e8a44a'));
      wave.setAttribute('stroke-width',amp>40?'3.5':'2.5');

      heraldRaf=requestAnimationFrame(frame);
    }
    heraldRaf=requestAnimationFrame(frame);
  }

  // ─────────────────────────────────────────
  // Tab switching & boot
  // ─────────────────────────────────────────
  const tabs   = document.querySelectorAll('.viz-tab');
  const panels = document.querySelectorAll('.viz-panel');

  tabs.forEach(tab => tab.addEventListener('click', ()=>{
    tabs.forEach(t=>t.classList.remove('active'));
    panels.forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    const p=document.getElementById('viz-'+tab.dataset.tab);
    if(p) p.classList.add('active');
    if (tab.dataset.tab==='gamma')  initGamma();
    if (tab.dataset.tab==='herald') initHerald();
    if (tab.dataset.tab==='axiom' && !axiomReady){ initAxiom(); axiomReady=true; }
  }));

  document.querySelectorAll('.viz-replay').forEach(btn=>btn.addEventListener('click',()=>{
    if (btn.dataset.target==='gamma')  initGamma();
    if (btn.dataset.target==='herald') initHerald();
  }));

  let gammaBooted=false;
  const vizSec=document.getElementById('visualizer');
  if (vizSec) new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting&&!gammaBooted){ gammaBooted=true; initGamma(); }
  },{threshold:0.12}).observe(vizSec);

})();
