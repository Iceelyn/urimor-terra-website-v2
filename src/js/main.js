/* ============================================================
   URIMOR TERRA — entry point
   ============================================================ */

/* Self-hosted webfonts — no third-party CDN, no FOUT from a foreign origin. */
import '@fontsource-variable/archivo/wght.css';
import '@fontsource-variable/archivo/wght-italic.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono/wght.css';

import '../styles/main.css';
import { gsap, ScrollTrigger, reduced, splitLines, initReveals, initCounters, initParallax, initProgress, initTrack } from './modules/motion.js';
import { initNav, initMenu, initCursor, initMagnetic, initAccordion, initBios, initYear } from './modules/ui.js';

document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

// Scroll-driven page: always begin at the top, never at a restored offset.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!window.location.hash) window.scrollTo(0, 0);

/* ——— Preloader ——————————————————————————————— */
function runPreloader() {
  const el = document.querySelector('[data-preloader]');
  if (!el) return Promise.resolve();

  const bar = el.querySelector('.preloader__bar span');
  const pct = el.querySelector('.preloader__pct');
  const draws = el.querySelectorAll('.pl-draw');

  draws.forEach((p) => {
    const len = p.getTotalLength ? p.getTotalLength() : 300;
    p.style.setProperty('--len', len);
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  const counter = { v: 0 };
  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => { el.remove(); resolve(); },
    });
    tl.to(draws, { strokeDashoffset: 0, duration: reduced ? 0.01 : 1.15, ease: 'power2.inOut', stagger: 0.12 }, 0)
      .to(bar, { scaleX: 1, duration: reduced ? 0.01 : 1.25, ease: 'power2.inOut' }, 0)
      .to(counter, {
        v: 100,
        duration: reduced ? 0.01 : 1.25,
        ease: 'power2.inOut',
        onUpdate: () => { if (pct) pct.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
      }, 0)
      .to(el, { yPercent: -100, duration: reduced ? 0.01 : 0.9, ease: 'expo.inOut' }, '+=0.15');
  });
}

/* ——— Hero + transformation stage ——————————————— */
async function initHero() {
  const hero = document.querySelector('[data-hero]');
  const stage = document.querySelector('[data-stage]');
  if (!hero) return;

  const canvasHost = document.querySelector('[data-terrain]');
  let field = null;

  if (canvasHost) {
    try {
      const { initTerrain } = await import('./modules/terrain.js');
      field = initTerrain(canvasHost);
    } catch (err) {
      canvasHost.classList.add('is-fallback');
    }
  }

  // One scrub across the whole stage drives both transitions: the array is
  // built first, then the land recovers around it.
  const phaseBar = hero.querySelector('[data-phase-bar]');
  const phaseLabel = hero.querySelector('[data-phase-label]');
  const LABELS = ['Closed mine', 'Solar installed', 'Land restored'];

  const pager = document.querySelector('[data-seq-pager]');
  const pagerItems = pager ? [...pager.querySelectorAll('.seqpager__item')] : [];
  if (pager) {
    gsap.to(pager, {
      opacity: 1,
      ease: 'none',
      scrollTrigger: { trigger: stage, start: 'top top-=40', end: 'top top-=200', scrub: true },
    });
  }

  if (stage) {
    ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const t = self.progress;
        // Hold the pit through the opening screen, build, hold, then restore.
        const build = gsap.utils.clamp(0, 1, (t - 0.20) / 0.36);
        const restore = gsap.utils.clamp(0, 1, (t - 0.66) / 0.24);
        field?.setBuild(build);
        field?.setRestore(restore);

        const overall = (build + restore) / 2;
        if (phaseBar) phaseBar.style.width = (overall * 100).toFixed(1) + '%';
        if (phaseLabel) {
          const idx = restore > 0.5 ? 2 : build > 0.5 ? 1 : 0;
          if (phaseLabel.dataset.idx !== String(idx)) {
            phaseLabel.dataset.idx = String(idx);
            gsap.fromTo(
              phaseLabel,
              { autoAlpha: 0, y: 6 },
              { autoAlpha: 1, y: 0, duration: 0.4, onStart: () => { phaseLabel.textContent = LABELS[idx]; } }
            );
          }
        }
      },
    });
  }

  // Transformation captions fade through as each takes the screen.
  document.querySelectorAll('[data-tstep]').forEach((step, i) => {
    const inner = step.querySelector('.tstep__inner');
    const lines = splitLines(step.querySelector('.tstep__title'));
    gsap.set(inner, { autoAlpha: 0, y: 40 });
    if (lines.length) gsap.set(lines, { yPercent: 108 });

    const setPager = () => pagerItems.forEach((el, n) => el.classList.toggle('is-active', n === i));
    const show = (dur) => {
      setPager();
      gsap.to(inner, { autoAlpha: 1, y: 0, duration: dur, ease: 'expo.out' });
      if (lines.length) gsap.to(lines, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.06 });
    };

    ScrollTrigger.create({
      trigger: step,
      start: 'top 68%',
      end: 'bottom 32%',
      onEnter: () => show(0.8),
      onLeave: () => gsap.to(inner, { autoAlpha: 0, y: -26, duration: 0.5, ease: 'power2.in' }),
      onEnterBack: () => show(0.6),
      onLeaveBack: () => gsap.to(inner, { autoAlpha: 0, y: 34, duration: 0.5, ease: 'power2.in' }),
    });
  });

  // Hero copy lifts away as the transformation chapter takes over.
  gsap.to(hero.querySelector('.hero__content'), {
    autoAlpha: 0,
    y: -60,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 40%', scrub: 0.4 },
  });

  // Entrance
  const title = hero.querySelector('[data-hero-title]');
  const lines = title ? splitLines(title) : [];
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  if (lines.length) {
    gsap.set(lines, { yPercent: 110 });
    tl.to(lines, { yPercent: 0, duration: reduced ? 0.01 : 1.25, stagger: 0.09 }, 0.1);
  }
  tl.fromTo(
    hero.querySelectorAll('[data-hero-fade]'),
    { autoAlpha: 0, y: 22 },
    { autoAlpha: 1, y: 0, duration: reduced ? 0.01 : 1, stagger: 0.09 },
    0.45
  );
  return tl;
}

/* ——— Ledger hover tint ————————————————————————— */
function initLedger() {
  document.querySelectorAll('[data-ledger] .ledger__row').forEach((row) => {
    row.addEventListener('pointerenter', () => {
      gsap.to(row.querySelector('.ledger__title'), { x: 6, duration: 0.5, ease: 'expo.out' });
    });
    row.addEventListener('pointerleave', () => {
      gsap.to(row.querySelector('.ledger__title'), { x: 0, duration: 0.5, ease: 'expo.out' });
    });
  });
}

/* ——— Anchor scrolling ————————————————————————
   scroll-margin-top in CSS supplies the header offset, so scrollIntoView
   lands correctly for in-page links and cross-page hashes alike. */
function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    a.addEventListener('click', (e) => {
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  // Arriving with a hash: re-seat it once layout has settled.
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'auto', block: 'start' }));
      window.addEventListener('load', () => target.scrollIntoView({ behavior: 'auto', block: 'start' }));
    }
  }
}

/* ——— Boot ————————————————————————————————— */
function boot() {
  initNav();
  initMenu();
  initCursor();
  initMagnetic();
  initAccordion();
  initBios();
  initLedger();
  initAnchors();
  initYear();
  initReveals();
  initCounters();
  initParallax();
  initProgress();
  initTrack();

  // Re-measure once webfonts land so split lines sit correctly.
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

runPreloader().then(() => {
  boot();
  initHero();
});
