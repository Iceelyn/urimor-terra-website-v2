/* ============================================================
   VIDEO — the Mine-to-Value showcase background.

   Autoplaying, looping motion needs a way to stop it (WCAG 2.2.2),
   it should not run while off screen, and it must never leave a
   blank rectangle if the file cannot be decoded or the visitor has
   asked for less motion or less data.
   ============================================================ */

export function initShowcaseVideo() {
  const video = document.querySelector('[data-demo-video]');
  if (!video) return;

  const section = video.closest('.demofirst');
  const toggle = document.querySelector('[data-video-toggle]');
  const label = document.querySelector('[data-video-label]');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const frugal = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')));

  // Wanted = what the visitor asked for. Playing = what is happening now.
  let wanted = !(reduced || frugal);
  let onScreen = true;

  const setLabel = () => {
    if (label) label.textContent = wanted ? 'Pause video' : 'Play video';
    if (toggle) toggle.setAttribute('aria-pressed', String(!wanted));
    if (toggle) toggle.classList.toggle('is-paused', !wanted);
  };

  const apply = () => {
    if (wanted && onScreen) {
      const p = video.play();
      if (p && p.catch) p.catch(() => { /* autoplay refused — poster stays */ });
    } else {
      video.pause();
    }
  };

  video.addEventListener('playing', () => section && section.classList.add('is-playing'), { once: true });
  video.addEventListener('error', () => section && section.classList.add('is-unavailable'));
  // Nothing decodable arrived: keep the painted fallback rather than a black box.
  video.addEventListener('stalled', () => {
    if (!video.videoWidth) section && section.classList.add('is-unavailable');
  });

  if (toggle) {
    toggle.addEventListener('click', () => { wanted = !wanted; setLabel(); apply(); });
  }
  setLabel();

  if ('IntersectionObserver' in window && section) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; apply(); }, { threshold: 0.05 })
      .observe(section);
  }
  document.addEventListener('visibilitychange', () => { onScreen = !document.hidden && onScreen; apply(); });

  if (frugal || reduced) {
    // Do not pull three megabytes the visitor did not ask for.
    video.preload = 'none';
  } else {
    apply();
  }
}
