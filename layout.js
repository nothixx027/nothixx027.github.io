/* Shared layout — nav, menu, footer, grid */
(function () {
  'use strict';
  const page = document.body.dataset.page || '';
  const active = (p) => p === page ? 'is-active' : '';

  const grid = `
    <div class="grid-bg" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
  `;

  const nav = `
    <nav class="nav">
      <div class="nav__inner">
        <a href="index.html" class="nav__logo">.heybharat</a>
        <ul class="nav__links">
          <li><a href="projects.html" class="${active('projects')}">projects</a></li>
          <li><a href="about.html" class="${active('about')}">about</a></li>
          <li><a href="services.html" class="${active('services')}">services</a></li>
          <li><a href="contact.html" class="${active('contact')}">contact</a></li>
          <li><a href="resume.html" class="green ${active('resume')}">resume</a></li>
        </ul>
        <button class="nav__menu" data-menu-open aria-label="Open menu">
          menu
          <svg viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4h18M3 9h18"/></svg>
        </button>
      </div>
    </nav>
    <div class="menu" role="dialog" aria-modal="true">
      <button class="menu__close" data-menu-close aria-label="Close menu">
        close
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M6 18 18 6"/></svg>
      </button>
      <div class="menu__inner">
        <ul class="menu__list">
          <li><a href="projects.html">projects</a></li>
          <li><a href="about.html">about</a></li>
          <li><a href="services.html">services</a></li>
          <li><a href="contact.html">contact</a></li>
          <li><a href="resume.html" class="green">resume</a></li>
        </ul>
      </div>
    </div>
  `;

  const cta = `
    <section class="section cta">
      <div class="shell">
        <p class="section-label reveal">.say hello</p>
        <div class="cta__row">
          <h2 class="cta__title reveal">i'm open for freelance projects, feel free to email me to see how can we collaborate</h2>
          <a href="contact.html" class="btn-outline reveal">
            contact me
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </div>
    </section>
  `;

  const footer = `
    <footer class="footer">
      <div class="footer__grid-wrap">
        <div class="shell">
          <div class="footer__grid">
            <div class="footer__col footer__col--brand">
              <a href="index.html" class="footer__logo">.heybharat</a>
            </div>
            <div class="footer__col">
              <p class="footer__col-label">Contact</p>
              <ul class="footer__col-list">
                <li><a href="mailto:work@heybharat.design">work@heybharat.design</a></li>
              </ul>
            </div>
            <div class="footer__col">
              <p class="footer__col-label">Follow us</p>
              <ul class="footer__col-list">
                <li><a href="https://dribbble.com/bharatarora27" target="_blank" rel="noopener">Dribbble</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noopener">Twitter / X</a></li>
              </ul>
            </div>
            <div class="footer__col">
              <p class="footer__col-label">Legal</p>
              <ul class="footer__col-list">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms &amp; Conditions</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="footer__wordmark" aria-hidden="true">.heybharat</div>
    </footer>
  `;

  const mount = (name, html) => {
    const el = document.querySelector(`[data-mount="${name}"]`);
    if (el) el.outerHTML = html;
  };
  mount('grid', grid);
  mount('nav', nav);
  mount('cta', cta);
  mount('footer', footer);
})();
