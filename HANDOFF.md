# LitVM Tesseract Accelerator v2: standalone landing page

Review build only. Not part of the LitVM site repo and never pushed. v1 is untouched at `~/Desktop/litvm-tesseract`.

Preview: `python serve.py`, then http://127.0.0.1:4178 (caching is off). The page itself is `public/`.
Rebuild after editing `src/`: `npm run build`.

## Concept (after Louie's feedback on 2026-11-04)
Site-style page with one immersive stretch. One glass hypercube persists throughout.
Hero painting, which dissolves softly upward into the site gradient as you scroll (uSplit in the composite); the left overlay is part of the painting shader so it has no edge. A divider strip and a hard colour break were both tried and rejected. Our Mission sits on the plain site gradient and holds (300vh pin) while the cube makes a full scrubbed 4D turn and the words light. Four Dimensions: site-style cards assembling around the cube, each lighting one family of 8 parallel edges.
The Track: the real cube keeps turning, the tunnel shows only inside its silhouette (a mask drawn from its own faces), and you fly straight into it. Tunnel is deliberately minimal: dark faces, rails, light-bar gates, no guide cube, no flying labels. 14 stops at an even scroll pace, shown as one central readout with a stage progress line. The far end opens onto the Cohort 1 line-up (vault with five glass tesseracts and floor reflections). Five cubes rotate in sync. Then "Brought to you by" Lunar Digital Assets on the site gradient, then a central Cohort 2 card under the sealed mark in the Litecoin coin painting.
Louie liked: the tunnel idea, the line-up, the Four Dimensions cards. Removed at his request: immersive mission and pillar worlds, the Network section, the big Cohort 1 left title, "Who runs the track".

## Layout rules
CSS tokens at the top of tesseract.css: one gutter, one title line (--title-top), one type scale. 3D positions are measured from the DOM in `layout()`, and the canvas uses clientWidth so 3D and page share one centre line. `work/measure.js` and `work/fit.js` audit edges, centres, card fit and stop pacing: run them after layout changes.

## Where things are
- `src/main.js`: COHORT, STOPS, NETWORK, ART. `layout()` holds the keyframed story: every value (world mix, object position, grade) is a key against scroll.
- `src/tunnel.js`: the Track tunnel shader, world composite (paintings with depth parallax, gradient, vault, hexagon mask), speed lines.
- `src/shaders.js`: glass, dust, final grade. Its LATTICE_FRAG and WORLD_FRAG are unused leftovers from an earlier build.
- `src/hyper.js`: the 4D hypercube.
- `public/css/tesseract.css`: page styles, all `tx-`. Other files in `public/css` are the site's own, copied from live.
- `work/body.html` + `work/page.py`: rebuilds `public/index.html` (nav and footer come from the v1 copy of live litvm.com).
- `work/shot.js`, `work/scrub.js`: QA on the real GPU. Headless software rendering is unreliable with postprocessing; these open a window.

## Swapping the art
Louie is supplying final art. Current paintings are placeholders from the site.
1. Save over `public/assets/art/portal.webp` (hero) and `sky.webp` (ending, the coin), plus the `-sm` versions (about 1400px wide, used on phones). `islands.*` is no longer used. Mission cards are in `assets/art/cards`.
2. Regenerate depth: `python work/depth.py <painting> <depth output>` (Depth Anything V2, runs on the GPU).
3. In `src/main.js` update ART: image aspect, and the point where the tesseract hangs and where the beam starts.
Hero art needs open sky around the focal point.

## Placeholders and open points
- Five Cohort 1 projects: edit COHORT.
- Headshots are cropped from deck slide 9 at about 200px.
- Copy is condensed from the deck plus new lines written for this page. Team has not signed off.
- Deck is marked Proprietary & confidential; track stops and leadership details need clearing before public.

## Decisions
- GCash in the deck is leftover, never used. Written as "LitVM ecosystem".
- Cohort 2: not open, no form, no date. Button disabled.
- No grant amounts or terms: the deck gives none.
- Live site is the source of truth for chrome. The local litvm-site repo is stale.
