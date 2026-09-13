# Urimor Terra Development LLC — logo files

Exported from the mark used in the site header. The mark is a horizon: a rising
sun above the line, open-pit terraces below it, the same geometry mirrored.

## Which file to use

| File | Use on |
|---|---|
| `urimor-terra-logo-horizontal-light.png` | dark backgrounds, transparent |
| `urimor-terra-logo-horizontal-dark.png` | light backgrounds, transparent |
| `urimor-terra-logo-stacked-light.png` | dark backgrounds, narrow space |
| `urimor-terra-logo-stacked-dark.png` | light backgrounds, narrow space |
| `urimor-terra-logo-horizontal-on-midnight.png` | where transparency is not supported (some Office and email clients) |
| `urimor-terra-logo-horizontal-on-paper.png` | as above, on a light ground |
| `urimor-terra-mark-light.png` / `.svg` | the mark alone: avatars, favicons, stamps |
| `urimor-terra-mark-dark.png` / `.svg` | the mark alone, on light |

PNGs are 3660 px wide (horizontal), 2876 px (stacked) and 1728 px square (mark),
which is enough for print at A4. The SVG files are the scalable masters for the
mark and should be preferred wherever vector artwork is accepted.

The light and dark files are not the same artwork recoloured. Tinted strokes lose
weight against paper, so the dark variant carries the sun rays and pit terraces
at higher opacity. Use the one that matches the background rather than inverting
the other.

## Clear space and minimum size

Each file already carries clear space of roughly 0.4 × the mark height. Do not
crop into it. Minimum reproduction width for the horizontal lockup is 120 px on
screen or 30 mm in print; below that use the mark alone.

## Colours

| | Hex | Role |
|---|---|---|
| PV blue | `#3d8bfd` | the sun and its rays |
| Ink | `#eef4fa` | artwork on dark backgrounds |
| Ink dark | `#0a1220` | artwork on light backgrounds |
| Midnight | `#060b13` | brand background |
| Paper | `#f0f4f8` | light background |

## Typography

The wordmark is not a custom drawing. It is set in **Archivo**:

- `URIMOR` — Archivo, weight 700, uppercase, letter-spacing 0.13em
- `TERRA` — Archivo, weight 400, uppercase, letter-spacing 0.13em
- `DEVELOPMENT LLC` — JetBrains Mono, weight 500, uppercase, letter-spacing 0.24em,
  set at 27% of the wordmark size

Both are open-source and bundled with this repository under `node_modules`. A
designer can rebuild the lockup as outlined vector from this spec in a few minutes.
