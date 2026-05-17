/* heybharat — interactions */
(function () {
  'use strict';

  // Fade-in body
  window.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => document.body.classList.add('is-loaded'));
  });

  // Menu
  const menu = document.querySelector('.menu');
  document.querySelectorAll('[data-menu-open]').forEach(b => b.addEventListener('click', () => menu && menu.classList.add('is-open')));
  document.querySelectorAll('[data-menu-close]').forEach(b => b.addEventListener('click', () => menu && menu.classList.remove('is-open')));
  document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => menu && menu.classList.remove('is-open')));

  // Scroll reveals
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-blur, .reveal-stagger').forEach(el => io.observe(el));

  // Hero rotator — blur + slide
  const rot = document.querySelector('[data-rotator]');
  if (rot) {
    const phrases = JSON.parse(rot.dataset.rotator);
    const item = rot.querySelector('.rot__item');
    let i = 0;
    if (item && phrases.length) {
      item.textContent = phrases[0];
      const swap = () => {
        i = (i + 1) % phrases.length;
        item.animate(
          [
            { transform: 'translateY(0)', opacity: 1, filter: 'blur(0px)' },
            { transform: 'translateY(-40%)', opacity: 0, filter: 'blur(14px)' }
          ],
          { duration: 520, easing: 'cubic-bezier(0.76,0,0.24,1)', fill: 'forwards' }
        ).onfinish = () => {
          item.textContent = phrases[i];
          item.animate(
            [
              { transform: 'translateY(40%)', opacity: 0, filter: 'blur(14px)' },
              { transform: 'translateY(0)', opacity: 1, filter: 'blur(0px)' }
            ],
            { duration: 720, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' }
          );
        };
      };
      setInterval(swap, 2600);
    }
  }

  // Note row image follows cursor
  if (window.matchMedia('(min-width: 1024px)').matches) {
    document.querySelectorAll('.note-row').forEach(row => {
      const img = row.querySelector('.note-row__img');
      if (!img) return;
      row.addEventListener('mousemove', (e) => {
        const rect = row.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        img.style.left = (x - 110) + 'px';
        img.style.top = (y - 70) + 'px';
      });
    });
  }

  // ============== Custom cursor ==============
  if (window.matchMedia('(min-width: 1024px) and (hover: hover)').matches) {
    const c = document.createElement('div');
    c.className = 'cursor';
    c.innerHTML = `<div class="cursor__triangle"></div><div class="cursor__label">Open</div>`;
    document.body.appendChild(c);

    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
    const tick = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      c.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    tick();

    // "Open" mode on project cards & see-also rows
    const projectHoverTargets = document.querySelectorAll('.work-card, .see-also-row, .proj-card');
    projectHoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => c.classList.add('is-project'));
      el.addEventListener('mouseleave', () => c.classList.remove('is-project'));
    });
  }

  // ============== Grid ripple on click ==============
  // Background click anywhere (but not on interactive elements)
  document.addEventListener('click', (e) => {
    // Skip if click was inside a link, button, form input, card, etc.
    if (e.target.closest('a, button, input, textarea, label, .work-card, .note-row, .social-row, .see-also-row, .nav, .menu, .footer, .submit-btn')) return;

    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 950);
  });

})();
