/* ============================================================
   UI — navigation, menu, cursor, accordion, misc chrome.
   ============================================================ */

import { gsap } from 'gsap';

const mqCoarse = window.matchMedia('(hover: none), (pointer: coarse)');

/* ——— Header: hide on scroll down, reveal on scroll up ——— */
export function initNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  let last = window.scrollY;
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 24);
    const menuOpen = document.body.classList.contains('is-locked');
    if (!menuOpen) {
      const down = y > last && y > 260;
      nav.classList.toggle('is-hidden', down);
    }
    last = y;
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    },
    { passive: true }
  );
  update();
}

/* ——— Mobile menu ——————————————————————————— */
export function initMenu() {
  const burger = document.querySelector('[data-burger]');
  const menu = document.querySelector('[data-menu]');
  if (!burger || !menu) return;

  const links = menu.querySelectorAll('.menu__link');
  const foot = menu.querySelector('.menu__foot');
  let open = false;

  const tl = gsap.timeline({ paused: true })
    .set(menu, { visibility: 'visible' })
    .to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.72, ease: 'expo.inOut' })
    .to(links, { y: '0%', duration: 0.85, stagger: 0.055, ease: 'expo.out' }, '-=0.42')
    .fromTo(foot, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.4');

  const toggle = (next) => {
    open = next ?? !open;
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
    if (open) tl.play();
    else tl.reverse().eventCallback('onReverseComplete', () => gsap.set(menu, { visibility: 'hidden' }));
  };

  burger.addEventListener('click', () => toggle());
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => open && toggle(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) toggle(false); });
  window.addEventListener('resize', () => { if (open && window.innerWidth > 900) toggle(false); });
}

/* ——— Custom cursor ————————————————————————— */
export function initCursor() {
  if (mqCoarse.matches) return;
  const dot = document.querySelector('[data-cursor]');
  const ring = document.querySelector('[data-cursor-ring]');
  if (!dot || !ring) return;

  const xTo = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const yTo = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const rxTo = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
  const ryTo = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });

  gsap.set([dot, ring], { autoAlpha: 0 });
  let shown = false;

  window.addEventListener('pointermove', (e) => {
    if (!shown) { shown = true; gsap.to([dot, ring], { autoAlpha: 1, duration: 0.4 }); }
    xTo(e.clientX); yTo(e.clientY); rxTo(e.clientX); ryTo(e.clientY);
  }, { passive: true });

  document.addEventListener('pointerleave', () => gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 }));

  const hot = 'a, button, [data-hover], input, textarea, summary';
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest(hot)) gsap.to(ring, { scale: 1.85, borderColor: 'rgba(61,139,253,.7)', duration: 0.4, ease: 'power3' });
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest(hot)) gsap.to(ring, { scale: 1, borderColor: 'rgba(238,244,250,.25)', duration: 0.4, ease: 'power3' });
  });
}

/* ——— Magnetic buttons ——————————————————————— */
export function initMagnetic() {
  if (mqCoarse.matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic) || 0.32;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ——— Accordion ————————————————————————————— */
export function initAccordion() {
  document.querySelectorAll('[data-acc]').forEach((acc) => {
    const items = [...acc.querySelectorAll('.acc__item')];
    items.forEach((item, i) => {
      const btn = item.querySelector('.acc__btn');
      const panel = item.querySelector('.acc__panel');
      if (!btn || !panel) return;
      const id = panel.id || `acc-${Math.random().toString(36).slice(2, 8)}`;
      panel.id = id;
      btn.setAttribute('aria-controls', id);
      btn.setAttribute('aria-expanded', 'false');

      const setOpen = (open) => {
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        gsap.to(panel, { height: open ? 'auto' : 0, duration: 0.6, ease: 'expo.out' });
      };

      btn.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        items.forEach((other) => {
          if (other !== item && other.classList.contains('is-open')) {
            other.classList.remove('is-open');
            other.querySelector('.acc__btn')?.setAttribute('aria-expanded', 'false');
            gsap.to(other.querySelector('.acc__panel'), { height: 0, duration: 0.5, ease: 'expo.out' });
          }
        });
        setOpen(willOpen);
      });

      if (i === 0 && acc.hasAttribute('data-acc-first')) setOpen(true);
    });
  });
}

/* ——— Footer year ————————————————————————————— */
export function initYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}
