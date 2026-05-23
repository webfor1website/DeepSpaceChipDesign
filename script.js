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
