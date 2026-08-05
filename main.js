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
  // Filter chips at top toggle which pieces show. The lightbox itself
  // is a GENERIC component wired further down — any grid marked with
  // [data-lightbox-source] on its parent registers its clickable items
  // for the same lightbox overlay.
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
  }

  // ============== Lightbox (generic) ==============
  // Any element inside a container marked [data-lightbox-source] becomes
  // a lightbox trigger. On click, the item's image opens in the fullscreen
  // overlay with prev/next arrows within THAT source.
  //
  // Metadata fields (all optional) read from the CLICKED element's data-*:
  //   data-title, data-client, data-year, data-type, data-desc
  //
  // Currently used by:
  //   • /selects/       → the masonry grid ([data-selects-grid] also gets
  //                       [data-lightbox-source] so its .select items open)
  //   • /work/dring/    → the social statics grid + the BTS grid
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

  if (lb) {
    let currentSource = null;   // the group of items being navigated
    let currentIndex = -1;

    const isVisible = (el) => !el.classList.contains('is-hidden');
    const getVisibleItems = (source) => {
      if (!source) return [];
      return Array.from(source.querySelectorAll('[data-lightbox-item]'))
        .filter(isVisible);
    };

    const openLightbox = (item, source) => {
      if (!lb || !item) return;
      currentSource = source;
      const visible = getVisibleItems(source);
      currentIndex = visible.indexOf(item);

      // Populate media
      const img = item.querySelector('img');
      const ph  = item.querySelector('.select__ph');
      lbMedia.innerHTML = '';
      if (img) {
        const big = document.createElement('img');
        big.src = img.src;
        big.alt = item.dataset.title || img.alt || '';
        lbMedia.appendChild(big);
      } else if (ph) {
        const phClone = ph.cloneNode(true);
        phClone.style.aspectRatio = ph.style.aspectRatio || '4/5';
        phClone.style.width = 'auto';
        phClone.style.height = '70vh';
        phClone.style.maxHeight = '80vh';
        lbMedia.appendChild(phClone);
      }

      // Metadata — optional. Fields hide themselves if empty (CSS handles).
      if (lbType)   lbType.textContent   = item.dataset.type    || '';
      if (lbTitle)  lbTitle.textContent  = item.dataset.title   || '';
      if (lbClient) lbClient.textContent = item.dataset.client  || '';
      if (lbYear)   lbYear.textContent   = item.dataset.year    || '';
      if (lbDesc)   lbDesc.textContent   = item.dataset.desc    || '';

      // Toggle metadata sidebar visibility based on whether ANY field has content
      const hasMeta = (item.dataset.title || item.dataset.client ||
                       item.dataset.year || item.dataset.desc);
      lb.classList.toggle('is-media-only', !hasMeta);

      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    };

    const closeLightbox = () => {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      currentSource = null;
      currentIndex = -1;
    };

    const navLightbox = (direction) => {
      if (!currentSource) return;
      const visible = getVisibleItems(currentSource);
      if (!visible.length) return;
      currentIndex = (currentIndex + direction + visible.length) % visible.length;
      openLightbox(visible[currentIndex], currentSource);
    };

    // Wire ALL sources — any grid with [data-lightbox-source] gets its
    // [data-lightbox-item] children wired to open the lightbox.
    document.querySelectorAll('[data-lightbox-source]').forEach((source) => {
      const items = source.querySelectorAll('[data-lightbox-item]');
      items.forEach((item) => {
        item.addEventListener('click', (e) => {
          e.preventDefault();  // <a> href would open in new tab — block it
          openLightbox(item, source);
        });
      });
    });

    // Backward compat: /selects/ grid uses [data-selects-grid] and
    // .select items (no [data-lightbox-item] markers). Treat that as
    // a lightbox source too.
    const selectsGridForLb = document.querySelector('[data-selects-grid]');
    if (selectsGridForLb && !selectsGridForLb.hasAttribute('data-lightbox-source')) {
      selectsGridForLb.setAttribute('data-lightbox-source', '');
      const selectItems = selectsGridForLb.querySelectorAll('.select');
      selectItems.forEach((item) => {
        // Mark as lightbox item so getVisibleItems finds it
        item.setAttribute('data-lightbox-item', '');
        item.addEventListener('click', (e) => {
          e.preventDefault();
          openLightbox(item, selectsGridForLb);
        });
      });
    }

    // Controls
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev)  lbPrev .addEventListener('click', () => navLightbox(-1));
    if (lbNext)  lbNext .addEventListener('click', () => navLightbox(+1));

    // Click outside content closes
    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
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

  // ============== Selects preview strip: rotate every ~3s ==============
  // The strip has 5 rotating slots (data-slot="0..4") + a fixed CTA tile
  // (data-fixed) at the end. Pool of pieces is defined in an inline
  // <script type="application/json" data-selects-pool> block inside each
  // strip. Every ~3s, one random slot cross-fades to a random piece from
  // the pool that isn't currently visible in the strip.
  //
  // To add a new piece to the rotation: edit the data-selects-pool JSON
  // in index.html AND projects/index.html (both pages have the strip).
  // Also drop the image in /selects-images/. That's it — no CSS or JS
  // changes needed.
  document.querySelectorAll('[data-selects-strip]').forEach((strip) => {
    const poolScript = strip.querySelector('[data-selects-pool]');
    if (!poolScript) return;

    let pool;
    try {
      pool = JSON.parse(poolScript.textContent);
    } catch (e) {
      console.error('Selects pool JSON invalid:', e);
      return;
    }
    if (!Array.isArray(pool) || pool.length < 2) {
      return;
    }

    const slots = Array.from(strip.querySelectorAll('.selects-preview-card[data-slot]'));
    if (!slots.length) return;

    // If the pool has the same number of (or fewer) pieces as visible
    // slots, there's nothing new to rotate to — just show them all.
    // As soon as you add a 6th piece to the pool, rotation kicks in
    // automatically.
    if (pool.length <= slots.length) return;

    // Track which pool indices are currently displayed so we don't repeat
    const visible = new Set();
    slots.forEach((slot) => {
      const img = slot.querySelector('img');
      if (!img) return;
      const currentBase = img.getAttribute('src').split('/').pop().replace('.jpg', '');
      const idx = pool.findIndex((p) => p.img === currentBase);
      slot.dataset.poolIdx = idx >= 0 ? String(idx) : '-1';
      if (idx >= 0) visible.add(idx);
    });

    const swapSlot = () => {
      const slot = slots[Math.floor(Math.random() * slots.length)];
      const currentIdx = parseInt(slot.dataset.poolIdx || '-1', 10);

      // Pick a new pool piece that's not currently visible anywhere
      const candidates = pool
        .map((_, i) => i)
        .filter((i) => !visible.has(i) && i !== currentIdx);
      if (!candidates.length) return;

      const newIdx = candidates[Math.floor(Math.random() * candidates.length)];
      const piece = pool[newIdx];

      // Cross-fade: fade the current slot out, swap image, fade in
      slot.classList.add('is-swapping');
      setTimeout(() => {
        const img = slot.querySelector('img');
        const source = slot.querySelector('source');
        // Respect local-preview BASE prefix if set (window.__SITE_BASE);
        // otherwise use root-absolute path which is how the deployed site
        // serves everything.
        const base = (typeof window !== 'undefined' && window.__SITE_BASE)
          ? window.__SITE_BASE + 'selects-images/'
          : '/selects-images/';
        if (img) {
          img.src = `${base}${piece.img}.jpg`;
          img.alt = piece.alt;
        }
        if (source) {
          source.srcset = `${base}${piece.img}.webp`;
        }

        // Update tracking
        if (currentIdx >= 0) visible.delete(currentIdx);
        visible.add(newIdx);
        slot.dataset.poolIdx = String(newIdx);

        // Fade back in
        requestAnimationFrame(() => {
          slot.classList.remove('is-swapping');
        });
      }, 400);
    };

    // Rotate every 3 seconds. Randomize slightly so multiple visible
    // strips don't tick in lockstep.
    const interval = 3000 + Math.floor(Math.random() * 500);
    setInterval(swapSlot, interval);
  });

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
