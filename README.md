# Urimor Terra Development LLC — Website

Corporate website for **Urimor Terra Development LLC**, a Mongolian climate-infrastructure
venture working in solar distribution, renewable energy and ESG consulting, small-scale
solar installation, and post-mining renewable energy.

The site's central idea — *where the mine ends, the grid begins* — is rendered literally in
the hero: a WebGL particle field that holds the terraced bowl of a depleted open-pit mine
and, as you scroll, reorganises into the ordered rows of a solar array.

---

## Stack

| | |
|---|---|
| Build | [Vite](https://vite.dev) — multi-page static output |
| Motion | [GSAP](https://gsap.com) + ScrollTrigger |
| 3D | [three.js](https://threejs.org), custom GLSL point shader |
| Type | Archivo, Instrument Serif, JetBrains Mono — self-hosted via Fontsource |
| Output | Static HTML/CSS/JS. No server, no build-time data, no runtime dependencies |

## Getting started

```bash
npm install
npm run dev       # dev server on http://localhost:5173
npm run build     # static build into dist/
npm run preview   # serve the built site on http://localhost:4173
```

`dist/` is a plain static folder. It will deploy as-is to GitHub Pages, Netlify,
Vercel, Cloudflare Pages, or any static host. Asset paths are relative (`base: './'`),
so it also works from a subdirectory.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home — hero, the pit→array transformation, capabilities, Nalaikh proof point, timeline, team |
| `capabilities.html` | The four revenue lines in depth, revenue model, stacked site revenue |
| `thesis.html` | The market thesis: closure liabilities, siting crisis, climate finance, evidence, competitors |
| `about.html` | Company, mission, journey, founders, partnerships, what we're looking for |

## Structure

```
index.html, capabilities.html,     page markup (hand-editable, no templating step)
thesis.html, about.html
public/                            favicon.svg, og.svg, robots.txt — copied verbatim
src/
  styles/
    tokens.css                     colour, type scale, spacing, motion — edit brand here
    base.css                       reset and typographic primitives
    components.css                 nav, hero, cards, ledger, timeline, tables, footer
    layout.css                     per-section composition and page templates
  js/
    main.js                        entry: preloader, hero, boot
    modules/
      terrain.js                   three.js particle field (pit ⇄ solar array)
      motion.js                    line splitter, scroll reveals, counters, timeline
      ui.js                        nav, mobile menu, cursor, magnetic buttons, accordion
```

## Brand

The mark is a horizon: a rising sun above the line, the terraces of an open pit below it.
Same geometry, mirrored — the transformation the company exists to perform. It is defined
inline as SVG in each page's header and in `public/favicon.svg`.

Core tokens live in `src/styles/tokens.css`:

| Token | Value | Role |
|---|---|---|
| `--obsidian` | `#0a0a0c` | page ground |
| `--bone` | `#f3efe6` | primary text, inverted sections |
| `--solar` | `#f0a93b` | accent — the sun |
| `--ember` | `#c9542a` | copper, mined earth |
| `--flora` | `#7fa06a` | restoration |
| `--steel` | `#7f97a7` | cold data |

Changing `--solar` re-tints the entire site, including the WebGL field
(`uSolar` in `src/js/modules/terrain.js` mirrors it).

## Behaviour notes

- **Progressive enhancement.** `<html>` ships with `class="no-js"`; all reveal animations
  are gated behind `.js`. With JavaScript disabled every page renders fully and readably.
- **No WebGL, no problem.** `terrain.js` probes for a context and returns `null` if there
  isn't one; the hero falls back to a CSS gradient (`.hero__canvas.is-fallback`).
- **Reduced motion.** `prefers-reduced-motion: reduce` collapses transition durations,
  stops the marquee, and freezes the particle field's idle drift.
- **Performance.** three.js is a dynamic import, so it never blocks first paint. Particle
  count and device pixel ratio scale down on small screens; rendering pauses when the hero
  scrolls out of view or the tab is hidden.
- **Fonts are self-hosted.** No third-party font CDN, so no external request on load.
  The bundled subsets are Latin, Latin Extended and Vietnamese — Cyrillic is not included,
  which matters if a Mongolian-language version is added later.

## Content

Copy is drawn from the company profile and business strategy of September 2026. Internal
material from those documents — the critical audit notes, the honesty scorecard, the risk
register, individual third-party contact names — is deliberately excluded.

Every mention of the Nalaikh 50 MW feasibility study carries the disclaimer that it is a
reference case and that Urimor Terra holds no ownership stake in or contractual
relationship to that project. Please keep that disclaimer attached if the copy is edited.

## Adding founder photographs

`.person__portrait` currently renders initials over the brand glyph. To use photographs,
replace the `<span class="person__initials">` and `<svg class="person__glyph">` inside each
`.person__portrait` with an `<img>`; the container already handles the aspect ratio and
cropping.
