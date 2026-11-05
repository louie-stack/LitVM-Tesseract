# Removes the beam painted into the hero art, so the page's own beam (WORLD_FRAG in src/tunnel.js) can stop at the object.
# Reads the untouched paintings in work/art-src, writes public/assets/art. Run from the project folder.
# Above CUT the sky band around the beam is rebuilt from the sky either side; below it only the thin bright line goes,
# because the soft haze there overlaps the tower and clouds and still looks right rising from the pool.
import numpy as np, cv2
from PIL import Image
X, POOL, CUT_LO, CUT_HI = 0.773, 0.19, 0.50, 0.58  # all as fractions of the image, v measured from the bottom
sm = lambda a, b, v: (lambda t: t * t * (3 - 2 * t))(np.clip((v - a) / (b - a), 0, 1))
for name in ['portal', 'portal-sm']:
    src = np.array(Image.open(f'work/art-src/{name}.webp').convert('RGB'))
    h, w = src.shape[:2]; cx = int(X * w)
    # the bright line, full height
    half = max(3, int(.0032 * w)); mask = np.zeros((h, w), np.uint8)
    mask[int((1 - .98) * h):int((1 - POOL) * h), cx - half:cx + half + 1] = 255
    out = cv2.inpaint(src, mask, max(3, int(.0015 * w)), cv2.INPAINT_TELEA).astype(np.float32)
    # the sky band above the cut
    B, R = int(.021 * w), max(3, int(.004 * w))
    l = cv2.GaussianBlur(out[:, cx - B - R:cx - B].mean(1, keepdims=True), (1, 0), .004 * w).reshape(h, 3)
    r = cv2.GaussianBlur(out[:, cx + B:cx + B + R].mean(1, keepdims=True), (1, 0), .004 * w).reshape(h, 3)
    xs = np.arange(cx - B, cx + B); t = (xs - xs[0]) / (len(xs) - 1)
    fill = l[:, None] * (1 - t)[None, :, None] + r[:, None] * t[None, :, None]
    side = 1 - sm(.62, 1, np.abs(xs - cx) / B)
    v = 1 - (np.arange(h) + .5) / h
    wgt = (sm(CUT_LO, CUT_HI, v)[:, None] * side[None, :])[..., None]
    out[:, cx - B:cx + B] = out[:, cx - B:cx + B] * (1 - wgt) + fill * wgt
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(f'public/assets/art/{name}.webp', quality=93, method=6)
    print(name, w, h)
