# Project website

Static, dependency-free site for *Can Fast Decisions Afford to Skip Reasoning?*
Open `index.html` directly, or serve the folder with any static host.

Live site: https://kisekis.github.io/jev-ipi/

## Publish on GitHub Pages

1. Copy the contents of this folder to the root of a repository (or to `docs/`).
2. Settings → Pages → Deploy from a branch → select the branch and `/ (root)` or `/docs`.

`.nojekyll` is included so GitHub serves every file as-is.

## Contents

- `index.html`, `assets/style.css`, `assets/app.js` — page, styles, interactive charts (vanilla JS + SVG; no CDN).
- `assets/fonts.css` — Nunito (SIL OFL 1.1, `assets/fonts/OFL.txt`) inlined, so the page also renders from `file://`.
- `assets/figures/` — Figures 1–2 (SVG with embedded fonts).
- `data/paper-data.js` — every number shown on the page.
- `paper.pdf` — the manuscript.

## Regenerate the data

From the paper root:

    python scripts/build_site_data.py

RQ1/RQ2 numbers are recomputed from the frozen runs (probability-argmax rule) and
asserted against the manuscript tables; RQ3 and recovery numbers are parsed from
the generated tables; references come from `main.bbl`. After rebuilding the paper,
also re-copy `main.pdf` to `site/paper.pdf` and the two `fig.final.svg` files to
`site/assets/figures/`.
