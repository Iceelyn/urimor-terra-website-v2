/* ============================================================
   DEMO PAGE — the Mine-to-Value prototype, framed.

   The prototype is hosted separately. If it declines to be framed,
   or simply does not arrive, the visitor gets a direct link rather
   than an empty rectangle.
   ============================================================ */

import '@fontsource-variable/archivo/wght.css';
import '@fontsource-variable/archivo/wght-italic.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono/wght.css';

import '../styles/main.css';

document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

const frame = document.querySelector('[data-demo-frame]');
const fallback = document.querySelector('[data-demo-fallback]');

if (frame && fallback) {
  let loaded = false;

  frame.addEventListener('load', () => {
    loaded = true;
    frame.classList.add('is-ready');
  });

  // A frame that is refused, or that renders a browser error page, still
  // fires load. There is no reliable cross-origin way to tell the difference,
  // so the bar link and the note below the bar are the escape route, and this
  // card is kept for the case where nothing arrives at all.
  setTimeout(() => {
    if (loaded) return;
    fallback.hidden = false;
    frame.setAttribute('hidden', '');
  }, 10000);
}

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
