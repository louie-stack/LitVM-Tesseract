# LitVM Tesseract Accelerator: standalone landing page

START HERE in a new session. Last worked on 2026-11-05.

Standalone review page for the LitVM team, in LitVM's brand, with Lunar Digital Assets. NOT part of the site repo (`~/Desktop/litvm-site`) and never pushed. This folder is a local git repo with no remote: do not push or deploy unless Louie asks. Earlier simple version kept at `~/Desktop/litvm-tesseract` (frozen fallback, port 4177).

## Where it stands (2026-11-05)
Louie looked at the 2026-11-05 round and said "this looks good", then paused. All work is committed locally. Nothing is waiting on a decision from Claude: the next move is whichever of these he brings:
1. The **fifth Cohort 1 logo and name** (steps under Still open).
2. His **final art** (steps under Swapping art).
3. A **single shareable file** for the team, when he asks for it.
4. More design feedback. He reviews in the browser and answers in short notes; act on exactly what he names.

Done in the 2026-11-05 round: four Cohort 1 logos sealed in the crystals; hero object lowered with the beam stopping at its centre; Four Dimensions rebuilt as one panel with a hexagonal opening; logo removed from the Cohort 2 coin; Cohort 2 box moved up from the footer.

## Run it
```
cd ~/Desktop/litvm-tesseract-v2
npm install            # only if node_modules is missing
python serve.py        # http://127.0.0.1:4178, caching off (leave running, the page is in public/)
npm run build          # after editing anything in src/
```
CSS in `public/css/tesseract.css` needs no build, just a refresh. Page HTML: edit `work/body.html`, then `python work/page.py` (run from this folder; it pulls nav, footer and head from `../litvm-tesseract/index.html`, so keep that folder).

## The page, top to bottom
1. **Hero**: portal painting with depth parallax, glass tesseract, unfolds out of the logo on load. The beam is drawn by the page, not the painting: it climbs from the pool on load, stops at the object's exact centre (`uBeamTop` follows the object) and lights a hot point there (`NODE_FRAG`). On phones it fades out above the copy. Left overlay is inside the painting shader.
2. **Soft dissolve**: painting melts upward into the site gradient on scroll (`uSplit` in the composite). Louie approved this.
3. **Our Mission**: 300vh pin on plain gradient. Cube makes one full scrubbed 4D turn while words light up.
4. **Four Dimensions of Support**: on desktop the four cards fly out of the cube and lock into one panel with a hexagonal opening at its centre (geometry computed in `layout()`, drawn with `roundPoly`/`insetPoly`), the cube turning inside and lighting the art nearest it. Phones keep one plain rounded card at a time. Each card lights one family of 8 parallel edges (four pillars = four dimensions). Art stays vivid and melts into pre-blurred glass behind the words (`work/blurcards.py`; rerun it when the card art changes); a point of light travels each card edge. Hover tilts the card, isolates its edges on the cube, dims the others.
5. **The Track**: the real cube turns with the tunnel visible inside its silhouette (mask drawn from its own faces), you fly into it. Minimal tunnel: dark faces, rails, light-bar gates. 14 stops at even scroll pace, one central readout, stage progress line.
6. **Cohort 1 line-up**: far end of the tunnel opens on a dark vault. Five glass cubes rotating in sync, spotlights, fading floor reflections. Each project's logo is a thick solid (stacked slices) hanging inside its crystal: it condenses out of depth on arrival, sways, turns once on hover, gives off its own colour, and appears in the floor reflection. The fifth crystal stays empty until its logo arrives.
7. **Brought to you by**: title, two-line subtext, three people cards, "In collaboration with" + LDA logo under them, on the gradient.
8. **Cohort 2**: central card, applications not open, disabled button, follow link, under the Litecoin coin painting, with nothing placed on the art.
Then the live site's footer.

## Louie's decisions (do not undo)
- Immersion is only for the Track. Mission and Four Dimensions stay site-style.
- REJECTED: immersive lattice behind the blurb; per-pillar colour worlds; white-sky Network; the Network section entirely; hexagon forming at the Track entrance (white outline overlay); flying boxes outside the tunnel; big left "Cohort 1 Begins December" title; "Who runs the track" title; LDA logo above the team; divider strip under the hero; hard colour break under the hero; the logo sealed into the coin on the Cohort 2 art; mini tesseract symbols on the Four Dimensions cards; lines from the cube to the cards.
- LIKED: the tunnel idea, the Cohort 1 line-up, the Four Dimensions cards, the soft dissolve, the logos in the crystals, the lowered hero object with the beam ending at its centre, the hexagon panel ("this looks better", once the mini symbols and lines were removed).
- The cube is the only tesseract in Four Dimensions. Do not add anything between it and the cards.
- Scrolling out of the hero must melt straight into Our Mission. It must never pass through black (see Gotchas).
- GCash in the deck is leftover: never use it. Written as "LitVM ecosystem".
- Cohort 2: no form, no date, shown as not open.
- No grant amounts or terms: the deck has none.
- Bar he set: "expertly placed, sized, mapped", awwwards level, nothing messy. No em dashes in copy.

## Still open
- **Final art from Louie**: hero and ending paintings and the four card images are the site's, as placeholders. New card art loses its inner corner to the hexagon, so the subject should sit towards the outer corner (the Advisory coin currently sits right against the cut).
- **Fifth Cohort 1 project**: logo and name still to come. Save a transparent square PNG as `public/assets/logos/<name>.png` (see `work/logos.py`), then replace the last `COHORT` entry in `src/main.js` with `{ name, logo, glow, size }` (glow = its main colour, size = optical size, around 0.75 to 1.1). `npm run build`.
- **Logo liberties to confirm** (told Louie, no answer yet): Lithium Lend's black L is off-white here because black vanishes in the dark vault. Lester Labs is cut out of its square avatar and fades out at the chest. Names come from the logo file names.
- **Copy sign-off from the team.** Lines written for this page, not from the deck: hero subline, "Five projects enter the first track in December", the Account Executive line under Four Dimensions, the Cohort 2 text.
- **Deck is marked Proprietary & confidential**: track stops and leadership details need clearing before public.
- **Removed with the Network**: the deck's 12 partner types and the four-step process are no longer on the page. Offered a row of tags under the team if wanted.
- **Sharing**: Louie's habit is one self-contained file on the Desktop for the team. Not built yet; needs fonts, art and JS inlined (textures must become data URLs or WebGL loading breaks from file://).
- **Possible add-back**: subtle stop labels on the tunnel gates. Offered, no answer yet.

## Not verified
Real phone (only emulated phones so far), mobile menu on this build, Louie's Nvidia GPU (QA ran on the AMD chip). Scroll feel is judged from frames: Louie is the judge of motion.

Checked on 2026-11-05: logos, hero beam, Four Dimensions and hover by eye on desktop and an emulated phone; reduced motion for those three (hover aside); card text fit at 1920, 1440, 1366, 1280 and 390; no black frames leaving the hero at 1440, 1920 and phone (before the Four Dimensions rebuild on phone and 1920; 1440 was rechecked after it). `measure.js` last ran before the hexagon panel, so rerun it and expect its Four Dimensions readings to need updating. A full-page contact sheet has not been rerun since these changes.

Frame rate on the AMD chip at 1440 with a 2x screen: about 45 to 50fps in Four Dimensions, same as Our Mission. Wheel scrolling averaged 45fps over the first 57% of the section, worst single frame 230ms, so a small hitch as a card arrives is possible. Jumping straight into the section reads about 4fps for the first couple of seconds, then recovers.

## Gotchas
- **Black screen means NaN in the world composite.** Any bad value (a width that hits zero, then inf times 0) gets spread over the whole frame by bloom. This caused the black swipe after the hero. Clamp anything fed into a division or exp in `WORLD_FRAG`, and run `work/scrollblack.js` after touching it.
- **Do not use backdrop-filter on the Four Dimensions cards.** It loses its fade once a card tilts in 3D, and the whole art goes blurry. The glass is a pre-blurred image, faded with a mask.
- **Card art has transparent corners cut out of it.** `work/blurcards.py` fills them before blurring, otherwise they become a dark blob in the glass.
- **Logo colours**: textures are sRGB-decoded because the pipeline is linear with a gamma at the end. Without it they wash out.
- `work/logos.py` reads the original logo JPGs from the Desktop (`lester labs logo.jpg`, `omega logo.jpg`, `midas hand logo.jpg`, `lithium lend logo.jpg`). Finished PNGs are already in `public/assets/logos`.

## Where things are
- `src/main.js`: content (COHORT, STOPS, STAGES, ART). `layout()` holds the story as keys against scroll, plus the hexagon geometry; `frame()` is the per-frame work.
- `src/tunnel.js`: tunnel shader, world composite (paintings, gradient, dissolve, vault, cube mask), speed lines.
- `src/shaders.js`: glass, panes, dust, final grade, logo slices (LOGO_VERT/FRAG, HALO_FRAG), hero hot point (NODE_FRAG). LATTICE_FRAG and WORLD_FRAG in here are unused leftovers, safe to delete.
- `src/hyper.js`: the 4D hypercube. Leftover: hexOnly.
- `public/css/tesseract.css`: tokens at the top (one gutter, one title line, one type scale). All `tx-` classes. Other files in `public/css` are copied from live litvm.com (the local litvm-site repo is stale).
- `public/assets/art`: `portal` (hero), `sky` (ending), `*-depth` (AI depth maps), `cards/` (`*-blur.webp` are baked glass). `islands*` unused. `public/assets/logos`: project logos and LDA. `work/art-src`: the hero paintings with their original beam, untouched.

## Swapping art
1. Save over `public/assets/art/portal.webp` and/or `sky.webp`, plus `-sm` versions (about 1400px wide, used on phones). Card images: save over the files in `cards/`, then `python work/blurcards.py`.
2. Depth map: `python work/depth.py <painting> <output-depth.webp>` (Depth Anything V2, on the GPU, about a minute).
3. The hero art must have NO beam painted in: the page draws it. If the new art has one, use `work/debeam.py` (reads untouched paintings from `work/art-src`, adjust its X and CUT values).
4. Update `ART` in `src/main.js`: aspect, and the point (0 to 1) where the object hangs and the beam starts. Hero art needs open sky around the focal point. `npm run build`.

## QA tools (run from this folder, server running; they open a real browser window)
- `node work/shot.js work/s 1440 810 "name:#section:progress[:offsetVh]" ...` screenshots on the real GPU.
- `node work/scrub.js work/f 1280 720 48 [mobile]` then `python work/contact.py work/f 8 320 180 work/contact.jpg` whole-page contact sheet. Create the output folder first.
- `node work/measure.js` edges, centres, equal cards. `node work/fit.js` card text fit, stop pacing. `work/check5.js` is out of date: it still looks for the removed strip.
- `node work/dimqa.js`, `node work/dimfps.js`, `node work/dimscroll.js` Four Dimensions frames, frame cost, and frame times during real wheel scrolling. `node work/scrollblack.js` + `python work/scrollblack.py` catch black frames leaving the hero.
- `node work/logoqa.js`, `node work/heroqa.js` crystal logos and hero beam: zooms, arrival, hover, load, phone, reduced motion; output in `work/s`.
Headless software rendering is unreliable with postprocessing, so these run headed. Screenshot and frame folders in `work/` are git-ignored and safe to delete.
