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

  // ============== Services: smooth expand/collapse + hover open ==============
  // Native <details> snaps instantly. We hijack the open/close to animate
  // the body's height smoothly. The CSS uses max-height + opacity + transform
  // for a polished feel (transitions defined in .service__body block).
  // Desktop also opens on hover with a small delay.
  const services = document.querySelectorAll('.service');
  if (services.length) {
    const setOpen = (s, open) => {
      if (open) {
        // Cancel any pending close
        s.dataset.closing = '';
        s.setAttribute('open', '');
        // The <details> needs the open attribute to render the body. CSS
        // animates max-height from 0 → big value via .service[open] state.
      } else {
        s.removeAttribute('open');
      }
    };

    const isDesktop = window.matchMedia('(min-width: 1024px) and (hover: hover)').matches;
    let hoverTimer;

    services.forEach((s) => {
      // Click toggle (works on all devices)
      const summary = s.querySelector('summary');
      if (summary) {
        summary.addEventListener('click', (e) => {
          e.preventDefault();
          const willOpen = !s.hasAttribute('open');
          if (willOpen) {
            // Close all others first
            services.forEach((o) => { if (o !== s) setOpen(o, false); });
          }
          setOpen(s, willOpen);
        });
      }

      // Desktop: open on hover with brief delay
      if (isDesktop) {
        s.addEventListener('mouseenter', () => {
          clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => {
            services.forEach((o) => { if (o !== s) setOpen(o, false); });
            setOpen(s, true);
          }, 120);
        });
      }
    });
  }


  // ============== Selects: filter chips + lightbox ==============
  // Filter chips at top toggle which pieces show. Click a piece to open
  // it in a lightbox with title/client/year/description. Esc, arrows,
  // outside-click, and X button all close.
  const selectsGrid = document.querySelector('[data-selects-grid]');
  if (selectsGrid) {
    const pieces = Array.from(selectsGrid.querySelectorAll('.select'));
    const chips = document.querySelectorAll('.filter-chip');
    const emptyMsg = document.querySelector('[data-selects-empty]');

    // ─── Filtering ───────────────────────────────────────────────
    let activeFilter = 'all';
    const applyFilter = (filter) => {
      activeFilter = filter;
      let visible = 0;
      pieces.forEach((p) => {
        const matches = filter === 'all' || p.dataset.type === filter;
        p.classList.toggle('is-hidden', !matches);
        if (matches) visible++;
      });
      if (emptyMsg) emptyMsg.classList.toggle('is-visible', visible === 0);
    };
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        applyFilter(chip.dataset.filter);
      });
    });

    // ─── Lightbox ────────────────────────────────────────────────
    const lb         = document.querySelector('[data-lightbox]');
    const lbMedia    = document.querySelector('[data-lightbox-media]');
    const lbType     = document.querySelector('[data-lightbox-type]');
    const lbTitle    = document.querySelector('[data-lightbox-title]');
    const lbClient   = document.querySelector('[data-lightbox-client]');
    const lbYear     = document.querySelector('[data-lightbox-year]');
    const lbDesc     = document.querySelector('[data-lightbox-desc]');
    const lbClose    = document.querySelector('[data-lightbox-close]');
    const lbPrev     = document.querySelector('[data-lightbox-prev]');
    const lbNext     = document.querySelector('[data-lightbox-next]');
    let currentIndex = -1;

    const getVisiblePieces = () => pieces.filter((p) => !p.classList.contains('is-hidden'));

    const openLightbox = (piece) => {
      if (!lb || !piece) return;
      const visible = getVisiblePieces();
      currentIndex = visible.indexOf(piece);

      // Populate
      const img = piece.querySelector('img');
      const ph  = piece.querySelector('.select__ph');
      lbMedia.innerHTML = '';
      if (img) {
        const big = document.createElement('img');
        big.src = img.src;
        big.alt = piece.dataset.title || '';
        lbMedia.appendChild(big);
      } else if (ph) {
        // Show a clone of the placeholder for design preview
        const phClone = ph.cloneNode(true);
        phClone.style.aspectRatio = ph.style.aspectRatio || '4/5';
        phClone.style.width = 'auto';
        phClone.style.height = '70vh';
        phClone.style.maxHeight = '80vh';
        lbMedia.appendChild(phClone);
      }
      lbType.textContent   = piece.dataset.type    || '';
      lbTitle.textContent  = piece.dataset.title   || '';
      lbClient.textContent = piece.dataset.client  || '—';
      lbYear.textContent   = piece.dataset.year    || '—';
      lbDesc.textContent   = piece.dataset.desc    || '';

      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    };

    const closeLightbox = () => {
      if (!lb) return;
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      currentIndex = -1;
    };

    const navLightbox = (direction) => {
      const visible = getVisiblePieces();
      if (!visible.length) return;
      currentIndex = (currentIndex + direction + visible.length) % visible.length;
      openLightbox(visible[currentIndex]);
    };

    // Wire piece clicks
    pieces.forEach((p) => {
      p.addEventListener('click', () => openLightbox(p));
    });

    // Wire lightbox controls
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev)  lbPrev .addEventListener('click', () => navLightbox(-1));
    if (lbNext)  lbNext .addEventListener('click', () => navLightbox(+1));

    // Click outside content closes
    if (lb) {
      lb.addEventListener('click', (e) => {
        if (e.target === lb) closeLightbox();
      });
    }

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (!lb || !lb.classList.contains('is-open')) return;
      if (e.key === 'Escape')    closeLightbox();
      if (e.key === 'ArrowLeft') navLightbox(-1);
      if (e.key === 'ArrowRight')navLightbox(+1);
    });
  }

  // ============== Contact form submit → Web3Forms ==============
  // The form has data-contact-form. It normally POSTs to Web3Forms and
  // redirects, but we intercept to keep the user on the page and show
  // inline success/error state on the submit button.
  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    const btn = contactForm.querySelector('[data-submit-btn]');
    const originalLabel = btn ? btn.textContent : 'Submit';

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot check — if a bot filled the hidden checkbox, silently
      // pretend success without sending anything.
      const honeypot = contactForm.querySelector('input[name="botcheck"]');
      if (honeypot && honeypot.checked) return;

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending…';
      }

      try {
        // Build a JSON payload from the form fields. Web3Forms accepts
        // both multipart form-data and JSON; JSON is cleaner here.
        const data = new FormData(contactForm);
        const payload = {};
        data.forEach((value, key) => { payload[key] = value; });

        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (result.success) {
          if (btn) btn.textContent = 'Sent ✓';
          contactForm.reset();
          // Restore button after a moment so the user can send again
          setTimeout(() => {
            if (btn) {
              btn.textContent = originalLabel;
              btn.disabled = false;
            }
          }, 2500);
        } else {
          throw new Error(result.message || 'Submission failed');
        }
      } catch (err) {
        console.error('Contact form error:', err);
        if (btn) {
          btn.textContent = 'Try again';
          setTimeout(() => {
            btn.textContent = originalLabel;
            btn.disabled = false;
          }, 2500);
        }
      }
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
