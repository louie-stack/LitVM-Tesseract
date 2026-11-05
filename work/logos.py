# Turns the four square logo JPGs into clean transparent PNGs for the crystals.
# Flat marks are upscaled and keyed by distance from their background, so JPG fringe disappears.
# Lester Labs is an illustration: cut out with rembg.
import os, numpy as np, cv2
from PIL import Image
D = os.path.expanduser('~/Desktop'); OUT = 'public/assets/logos'; S = 1024
def load(n): return cv2.resize(np.array(Image.open(f'{D}/{n}').convert('RGB')).astype(np.float32), (S, S), interpolation=cv2.INTER_CUBIC)
def trim(rgba, pad=.06):
    a = rgba[..., 3] > 8; ys, xs = np.where(a); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    side = int(max(x1-x0, y1-y0) * (1+pad*2)); cx, cy = (x0+x1)//2, (y0+y1)//2
    o = np.zeros((side, side, 4), np.uint8); tx, ty = side//2-cx, side//2-cy
    for y in range(max(0,-ty), min(rgba.shape[0], side-ty)):
        pass
    x_0, y_0 = max(0, -tx), max(0, -ty); x_1, y_1 = min(rgba.shape[1], side-tx), min(rgba.shape[0], side-ty)
    o[y_0+ty:y_1+ty, x_0+tx:x_1+tx] = rgba[y_0:y_1, x_0:x_1]
    return cv2.resize(o, (768, 768), interpolation=cv2.INTER_AREA)
def key(img, bg, lo=40, hi=90):
    d = np.linalg.norm(img - np.array(bg, np.float32), axis=2)
    return np.clip((d - lo) / (hi - lo), 0, 1)
def save(n, rgb, a): Image.fromarray(trim(np.dstack([np.clip(rgb,0,255), a*255]).astype(np.uint8))).save(f'{OUT}/{n}.png')

# Omega: a single off-white mark
im = load('omega logo.jpg'); a = key(im, im[:40,:40].mean((0,1)))
save('omega', np.full_like(im, 0) + np.array([248,245,238],np.float32), a)
# Midas Hand: white + orange, flat colours snapped by hue
im = load('midas hand logo.jpg'); a = key(im, im[:40,:40].mean((0,1)))
orange = (im[...,0] - im[...,2]) > 60
rgb = np.where(cv2.GaussianBlur(orange.astype(np.float32),(0,0),1.2)[...,None] > .5, np.array([226,120,34],np.float32), np.array([250,250,250],np.float32))
save('midas', rgb, a)
# Lithium Lend: near-black L + blue square on cream. Black disappears in the dark vault, so the L goes to the page's off-white
im = load('lithium lend logo.jpg'); bg = im[:40,:40].mean((0,1)); a = key(im, bg, 50, 110)
blue = (im[...,2] - im[...,0]) > 40
rgb = np.where(cv2.GaussianBlur(blue.astype(np.float32),(0,0),1.2)[...,None] > .5, np.array([58,104,176],np.float32), np.array([246,246,245],np.float32))
save('lithium', rgb, a)
# Lester Labs: illustration cut-out
from rembg import remove
src = Image.open(f'{D}/lester labs logo.jpg').convert('RGB').resize((1024,1024), Image.LANCZOS)
out = np.array(remove(src)).astype(np.float32)
Image.fromarray(out.astype(np.uint8)).save('work/logos/lester-full.png')
# Lester: head, flask and collar read at crystal size; the bust is cut off by the image edge, so it dissolves into the crystal at the bottom
h = out.shape[0]; ramp = np.clip((h*.8 - np.arange(h)) / (h*.2), 0, 1); ramp = ramp*ramp*(3-2*ramp)
out[...,3] *= ramp[:,None]
save('lester', out[...,:3], out[...,3]/255)
