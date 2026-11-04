# LitVM Tesseract Accelerator: standalone landing page

START HERE in a new session. Last worked on 2026-11-04.

Standalone review page for the LitVM team, in LitVM's brand, with Lunar Digital Assets. NOT part of the site repo (`~/Desktop/litvm-site`) and never pushed. This folder is a local git repo with no remote: do not push or deploy unless Louie asks. Earlier simple version kept at `~/Desktop/litvm-tesseract` (frozen fallback, port 4177).

## Run it
```
cd ~/Desktop/litvm-tesseract-v2
npm install            # only if node_modules is missing
python serve.py        # http://127.0.0.1:4178, caching off (leave running, the page is in public/)
npm run build          # after editing anything in src/
```
CSS in `public/css/tesseract.css` needs no build, just a refresh. Page HTML: edit `work/body.html`, then `python work/page.py` (run from this folder; it pulls nav, footer and head from `../litvm-tesseract/index.html`, so keep that folder).

## The page, top to bottom
1. **Hero**: portal painting with depth parallax, glass tesseract hanging in the beam, unfolds out of the logo on load. Left overlay is inside the painting shader.
2. **Soft dissolve**: painting melts upward into the site gradient on scroll (`uSplit` in the composite). Louie approved this.
3. **Our Mission**: 300vh pin on plain gradient. Cube makes one full scrubbed 4D turn while words light up.
4. **Four Dimensions of Support**: four site-style cards fly out from the cube; each lights one family of 8 parallel edges (four pillars = four dimensions). Hover lights a family again.
5. **The Track**: the real cube turns with the tunnel visible inside its silhouette (mask drawn from its own faces), you fly into it. Minimal tunnel: dark faces, rails, light-bar gates. 14 stops at even scroll pace, one central readout, stage progress line.
6. **Cohort 1 line-up**: far end of the tunnel opens on a dark vault. Five glass cubes rotating in sync, spotlights, fading floor reflections, placeholder names.
7. **Brought to you by**: title, two-line subtext, three people cards, "In collaboration with" + LDA logo under them, on the gradient.
8. **Cohort 2**: central card, applications not open, disabled button, follow link, under the Litecoin coin painting with the sealed logo in the coin.
Then the live site's footer.

## Louie's decisions (do not undo)
- Immersion is only for the Track. Mission and Four Dimensions stay site-style.
- REJECTED: immersive lattice behind the blurb; per-pillar colour worlds; white-sky Network; the Network section entirely; hexagon forming at the Track entrance (white outline overlay); flying boxes outside the tunnel; big left "Cohort 1 Begins December" title; "Who runs the track" title; LDA logo above the team; divider strip under the hero; hard colour break under the hero.
- LIKED: the tunnel idea, the Cohort 1 line-up, the Four Dimensions cards, the soft dissolve.
- GCash in the deck is leftover: never use it. Written as "LitVM ecosystem".
- Cohort 2: no form, no date, shown as not open.
- No grant amounts or terms: the deck has none.
- Bar he set: "expertly placed, sized, mapped", awwwards level, nothing messy. No em dashes in copy.

## Still open
- **Final art from Louie**: hero and ending paintings and the four card images are the site's, as placeholders.
- **Five Cohort 1 project names**: `COHORT` in `src/main.js`.
- **Copy sign-off from the team.** Lines written for this page, not from the deck: hero subline, "Five projects enter the first track in December", the Account Executive line under Four Dimensions, the Cohort 2 text.
- **Deck is marked Proprietary & confidential**: track stops and leadership details need clearing before public.
- **Removed with the Network**: the deck's 12 partner types and the four-step process are no longer on the page. Offered a row of tags under the team if wanted.
- **Sharing**: Louie's habit is one self-contained file on the Desktop for the team. Not built yet; needs fonts, art and JS inlined (textures must become data URLs or WebGL loading breaks from file://).
- **Possible add-back**: subtle stop labels on the tunnel gates. Offered, no answer yet.

## Not verified
Real phone (only emulated phones so far), mobile menu on this build, 1920 frame rate since full-resolution rendering, Louie's Nvidia GPU (QA ran on the AMD chip), reduced-motion mode since the rebuild. Full alignment audit last run before the soft dissolve, which only changed the background and removed the hero overlay. Scroll feel is judged from frames: Louie is the judge of motion. On phones the Brought-to-you-by subtext runs four lines and the Cohort 2 card has about 36px above the footer.

## Where things are
- `src/main.js`: content (COHORT, STOPS, STAGES, ART). `layout()` holds the story as keys against scroll; `frame()` is the per-frame work.
- `src/tunnel.js`: tunnel shader, world composite (paintings, gradient, dissolve, vault, cube mask), speed lines.
- `src/shaders.js`: glass, panes, dust, final grade. LATTICE_FRAG and WORLD_FRAG in here are unused leftovers, safe to delete.
- `src/hyper.js`: the 4D hypercube. Leftover: hexOnly.
- `public/css/tesseract.css`: tokens at the top (one gutter, one title line, one type scale). All `tx-` classes. Other files in `public/css` are copied from live litvm.com (the local litvm-site repo is stale).
- `public/assets/art`: `portal` (hero), `sky` (ending), `*-depth` (AI depth maps), `cards/`. `islands*` unused.

## Swapping art
1. Save over `public/assets/art/portal.webp` and/or `sky.webp`, plus `-sm` versions (about 1400px wide, used on phones).
2. Depth map: `python work/depth.py <painting> <output-depth.webp>` (Depth Anything V2, on the GPU, about a minute).
3. Update `ART` in `src/main.js`: aspect, and the point (0 to 1) where the object hangs and the beam starts. Hero art needs open sky around the focal point. `npm run build`.

## QA tools (run from this folder, server running; they open a real browser window)
- `node work/shot.js work/s 1440 810 "name:#section:progress[:offsetVh]" ...` screenshots on the real GPU.
- `node work/scrub.js work/f 1280 720 48 [mobile]` then `python work/contact.py work/f 8 320 180 work/contact.jpg` whole-page contact sheet. Create the output folder first.
- `node work/measure.js` edges, centres, equal cards. `node work/fit.js` card text fit, stop pacing. `work/check5.js` is out of date: it still looks for the removed strip.
Headless software rendering is unreliable with postprocessing, so these run headed. Screenshot and frame folders in `work/` are git-ignored and safe to delete.
