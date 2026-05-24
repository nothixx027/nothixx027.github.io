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
      // Tighter follow (was 0.18) — cursor tracks the mouse closely so its
      // mix-blend-mode trail doesn't flash over unrelated elements during lag.
      cx += (mx - cx) * 0.45;
      cy += (my - cy) * 0.45;
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

  // ============== Services: hover-to-open on desktop ==============
  // Native <details> elements only toggle on click. To match the reference,
  // we add hover-to-open on desktop with a small delay so quick mouse
  // sweeps across the page don't trigger every row. Click still works
  // everywhere as a fallback (mobile + accessibility).
  if (window.matchMedia('(min-width: 1024px) and (hover: hover)').matches) {
    const services = document.querySelectorAll('.service');
    let hoverTimer;
    services.forEach((s) => {
      s.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          // Close all others, open this one
          services.forEach((o) => { if (o !== s) o.removeAttribute('open'); });
          s.setAttribute('open', '');
        }, 120);
      });
    });
    // When the cursor leaves the whole services list, no need to do anything —
    // the most recently hovered row stays open (matches the reference behavior).
  }

  // ============== Reels: hover-to-unmute ==============
  // Each .reel contains a muted autoplay <video>. On hover (desktop) or
  // first tap (mobile), unmute that one video. Move cursor away (or tap
  // outside) — mute it again. Only one reel can be unmuted at a time.
  const reels = document.querySelectorAll('.reel');
  if (reels.length) {
    let activeReel = null;

    const unmute = (reel) => {
      // Mute the previously active reel (if any)
      if (activeReel && activeReel !== reel) {
        const v = activeReel.querySelector('video');
        if (v) { v.muted = true; }
        activeReel.classList.remove('is-unmuted');
      }
      const v = reel.querySelector('video');
      if (!v) return;
      v.muted = false;
      // Some browsers require an explicit play() after unmuting
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      reel.classList.add('is-unmuted');
      activeReel = reel;
    };

    const mute = (reel) => {
      const v = reel.querySelector('video');
      if (v) v.muted = true;
      reel.classList.remove('is-unmuted');
      if (activeReel === reel) activeReel = null;
    };

    const isDesktop = window.matchMedia('(min-width: 1024px) and (hover: hover)').matches;

    reels.forEach((reel) => {
      if (isDesktop) {
        // Desktop: hover to unmute, leave to re-mute
        reel.addEventListener('mouseenter', () => unmute(reel));
        reel.addEventListener('mouseleave', () => mute(reel));
      } else {
        // Mobile: tap to toggle. Stop the click from navigating to Instagram
        // immediately so the user can hear it first; second tap navigates.
        reel.addEventListener('click', (e) => {
          if (!reel.classList.contains('is-unmuted')) {
            e.preventDefault();
            unmute(reel);
          }
          // Second click (when already unmuted) → navigate normally
        });
      }
    });

    // Mobile only: tap anywhere outside an unmuted reel → mute it
    if (!isDesktop) {
      document.addEventListener('click', (e) => {
        if (!activeReel) return;
        if (!e.target.closest('.reel')) mute(activeReel);
      });
    }
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
