# Urimor Terra Development LLC — Website

Corporate website for **Urimor Terra Development LLC**, a Mongolian climate-infrastructure
venture working in solar distribution, renewable energy and ESG consulting, small-scale
solar installation, and post-mining renewable energy.

The site's central idea is rendered literally in the hero: a WebGL particle field that holds
three states of the same piece of ground and moves between them as you scroll — the terraced
bowl of a depleted open-pit mine, an installed solar array, and that array with the land
restored and vegetation returned to the aisles between the rows.

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
| `index.html` | Home — hero and the three-state transformation, about, market context, services, project reference, track record, team |
| `services.html` | The four service lines in depth |
| `approach.html` | Market, drivers, project reference, research, project finance, closure software |
| `about.html` | Company, mission, track record, team, partnerships, what we're looking for |

## Structure

```
index.html, services.html,         page markup (hand-editable, no templating step)
approach.html, about.html
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
      terrain.js                   three.js particle field (pit → array → restored land)
      motion.js                    line splitter, scroll reveals, counters, track record
      ui.js                        nav, mobile menu, cursor, magnetic buttons, accordion
```

## Brand

The mark is a horizon: a rising sun above the line, the terraces of an open pit below it.
Same geometry, mirrored — the transformation the company exists to perform. It is defined
inline as SVG in each page's header and in `public/favicon.svg`.

Core tokens live in `src/styles/tokens.css`:

| Token | Value | Role |
|---|---|---|
| `--midnight` | `#060b13` | page ground |
| `--paper` | `#f0f4f8` | inverted sections |
| `--ink` | `#eef4fa` | primary text |
| `--pv` | `#3d8bfd` | primary accent — photovoltaic blue |
| `--flora` | `#35c08a` | restoration green |
| `--earth` | `#8a7259` | depleted ground, used by the WebGL field |
| `--cyan` | `#63d5ea` | panel glint, notes |

Blue carries the energy side of the business and green the restoration side; both
appear in the hero field, in the track-record rail, and in the scroll indicator.
`.invert` (light sections) substitutes darker values for `--pv` and `--flora` so small
text on paper clears WCAG AA — see the bottom of `src/styles/base.css`.

Changing `--pv` re-tints the site; the WebGL field mirrors these values as `uPanel`,
`uFlora` and `uEarth` in `src/js/modules/terrain.js`.

## Behaviour notes

- **Progressive enhancement.** `<html>` ships with `class="no-js"`; all reveal animations
  are gated behind `.js`. With JavaScript disabled every page renders fully and readably.
- **No WebGL, no problem.** `terrain.js` probes for a context and returns `null` if there
  isn't one; the hero falls back to a CSS gradient (`.hero__canvas.is-fallback`).
- **Reduced motion.** `prefers-reduced-motion: reduce` collapses transition durations and
  freezes the particle field's idle drift.
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

## People

Founders and extended team share one fixed headshot size (`--headshot` in
`src/styles/layout.css`), so the section reads as a single group. `.headshot` currently
renders initials over the brand glyph. To use photographs, replace the
`<svg class="headshot__glyph">` and `<span class="headshot__initials">` inside a
`.headshot` with an `<img>` — the container already handles the square crop via
`object-fit: cover`.

**The five extended team members are placeholders.** Their names, titles and institutions
are lorem ipsum, pending the real details. Search for `Lorem Ipsum` in `index.html` and
`about.html` to find them.
