/* ============================================================
   MOTION — scroll choreography.
   ============================================================ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Split an element's text into word spans wrapped in line masks.
   Kept in-house so the markup stays predictable and re-splittable. */
export function splitLines(el) {
  if (el.dataset.split === 'done') return [...el.querySelectorAll('.r-line > span')];
  const html = el.innerHTML;
  el.dataset.original = html;

  // Wrap every word in its own span. Styling carried by inline tags
  // (an italic <span class="serif">, say) is copied onto the word so it
  // survives the regrouping into lines below.
  const walk = (node, inherited) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        if (!child.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((chunk) => {
          if (!chunk) return;
          if (/^\s+$/.test(chunk)) { frag.appendChild(document.createTextNode(chunk)); return; }
          const s = document.createElement('span');
          s.className = inherited ? 'w ' + inherited : 'w';
          s.textContent = chunk;
          frag.appendChild(s);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        if (child.tagName === 'BR') return;
        walk(child, [inherited, child.className].filter(Boolean).join(' ').trim());
      }
    });
  };
  walk(el, '');

  // Group words into visual lines by their offsetTop.
  // Group words into visual lines. Horizontal position is the reliable
  // signal here: a new line is where the text runs back to the left. Vertical
  // offsets lie when a headline mixes fonts, because a serif and a sans word
  // on the same line do not share an offsetTop.
  const words = [...el.querySelectorAll('.w')];
  if (!words.length) return [];
  const lines = [];
  let cur = null;
  let lastLeft = null;
  words.forEach((w) => {
    const left = w.offsetLeft;
    if (lastLeft === null || left < lastLeft) {
      cur = [];
      lines.push(cur);
    }
    lastLeft = left;
    cur.push(w);
  });

  // Rebuild as masked lines.
  const frag = document.createDocumentFragment();
  lines.forEach((line) => {
    const mask = document.createElement('span');
    mask.className = 'r-line';
    const inner = document.createElement('span');
    line.forEach((w, i) => {
      inner.appendChild(w);
      if (i < line.length - 1) inner.appendChild(document.createTextNode(' '));
    });
    mask.appendChild(inner);
    frag.appendChild(mask);
  });
  el.innerHTML = '';
  el.appendChild(frag);
  el.dataset.split = 'done';
  return [...el.querySelectorAll('.r-line > span')];
}

/* ——— Headline reveals ——————————————————————— */
export function initReveals() {
  document.querySelectorAll('[data-split]').forEach((el) => {
    const lines = splitLines(el);
    if (!lines.length) return;
    gsap.set(lines, { yPercent: 108 });
    gsap.to(lines, {
      yPercent: 0,
      duration: reduced ? 0.01 : 1.05,
      ease: 'expo.out',
      stagger: 0.075,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  document.querySelectorAll('.r-up').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: reduced ? 0.01 : 0.95,
      ease: 'expo.out',
      delay: parseFloat(el.dataset.delay || 0),
      scrollTrigger: { trigger: el.dataset.trigger ? el.closest(el.dataset.trigger) : el, start: 'top 90%', once: true },
    });
  });

  document.querySelectorAll('.r-fade').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      duration: reduced ? 0.01 : 1.2,
      ease: 'power2.out',
      delay: parseFloat(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });

  // Staggered groups
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    const kids = [...group.children];
    gsap.set(kids, { opacity: 0, y: 34 });
    gsap.to(kids, {
      opacity: 1,
      y: 0,
      duration: reduced ? 0.01 : 0.9,
      ease: 'expo.out',
      stagger: parseFloat(group.dataset.stagger) || 0.08,
      scrollTrigger: { trigger: group, start: 'top 86%', once: true },
    });
  });

  // Rules draw in
  document.querySelectorAll('.r-rule').forEach((el) => {
    gsap.to(el, {
      scaleX: 1,
      duration: reduced ? 0.01 : 1.3,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 95%', once: true },
    });
  });
}

/* ——— Numeric counters ——————————————————————— */
export function initCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const obj = { v: 0 };
    const render = () => {
      el.textContent = prefix + obj.v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
    };
    render();
    gsap.to(obj, {
      v: target,
      duration: reduced ? 0.01 : 2.1,
      ease: 'expo.out',
      onUpdate: render,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}

/* ——— Parallax ————————————————————————————— */
export function initParallax() {
  if (reduced) return;
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax) || 12;
    gsap.fromTo(
      el,
      { yPercent: -amount / 2 },
      {
        yPercent: amount / 2,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });
}

/* ——— Reading progress ————————————————————————— */
export function initProgress() {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return;
  gsap.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: () => document.body.scrollHeight - window.innerHeight, scrub: 0.3 },
  });
}

/* ——— Track record ————————————————————————————
   A vertical, chronological list. The rail fills as you read down it
   and each year lights up when it is reached. */
export function initTrack() {
  const track = document.querySelector('[data-track]');
  if (!track) return;
  const fill = track.querySelector('[data-track-fill]');
  const items = [...track.querySelectorAll('.track__item')];

  if (fill) {
    gsap.to(fill, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: track,
        start: 'top 62%',
        end: 'bottom 78%',
        scrub: 0.4,
      },
    });
  }

  items.forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 72%',
      onEnter: () => item.classList.add('is-reached'),
      onLeaveBack: () => item.classList.remove('is-reached'),
    });
  });
}

export { ScrollTrigger, gsap, reduced };
