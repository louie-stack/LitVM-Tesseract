# Bakes the frosted glass for the Four Dimensions cards: public/assets/art/cards/<name>-blur.webp from each card image.
# Rerun after swapping card art. Small on purpose: it is blurred, so it scales up without showing it.
import glob, os
import numpy as np, cv2
from PIL import Image, ImageEnhance, ImageFilter
try:
    import pillow_avif  # noqa: F401  (older Pillow reads AVIF through this)
except ImportError:
    pass
for f in glob.glob('public/assets/art/cards/*.avif'):
    # some card art has transparent corners cut out of it: fill them from the colours around them, or they blur into a dark blob
    im = Image.open(f).convert('RGBA'); w, h = im.size; s = 640 / w
    a = np.array(im.resize((640, round(h * s)), Image.LANCZOS))
    a = cv2.inpaint(a[..., :3], (a[..., 3] < 200).astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)
    im = Image.fromarray(a).filter(ImageFilter.GaussianBlur(16))
    out = os.path.splitext(f)[0] + '-blur.webp'
    ImageEnhance.Color(im).enhance(1.35).save(out, quality=92, method=6)
    print(os.path.basename(out), im.size, os.path.getsize(out) // 1024, 'KB')
