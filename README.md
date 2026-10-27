# Paper and project website

Static, dependency-free site for *Is Speed Worth the Risk? Skipping Reasoning Leaves Jev-like Models Vulnerable*
Open `index.html` directly, or serve the folder with any static host.

Live site: https://kisekis.github.io/jev-ipi/

## Import into Overleaf

This repository includes the complete manuscript source at its root. Import
the repository into Overleaf and use `main.tex` as the main document with the
pdfLaTeX compiler. The ICML style, bibliography, included sections, tables,
and figure assets are bundled; no external experiment workspace is needed
to compile the paper.

To build locally with a TeX installation:

    latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex

The source is a publication snapshot of the local paper project. Raw experiment
records, internal reviews, and analysis scripts are not included.

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
- `main.tex`, `references.bib`, `icml2026.sty`, `icml2026.bst` — manuscript and venue template.
- `sections/`, `tables/`, `figures/` — manuscript dependencies, separate from website assets.

## Regenerate the data

From the original local paper workspace (the generation script is not bundled here):

    python scripts/build_site_data.py

RQ1/RQ2 numbers are recomputed from the frozen runs (probability-argmax rule) and
asserted against the manuscript tables; RQ3 and recovery numbers are parsed from
the generated tables; references come from `main.bbl`. After rebuilding the paper,
also re-copy `main.pdf` to `site/paper.pdf` and the two `fig.final.svg` files to
`site/assets/figures/`.
