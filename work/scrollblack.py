# Reads the frames from scrollblack.js: prints brightness per frame and builds a contact sheet at work/s/sb.jpg
import glob
import numpy as np
from PIL import Image
fs = sorted(glob.glob('work/s/sb/*.jpg')); low = []
tw, th = 240, int(240 * Image.open(fs[0]).height / Image.open(fs[0]).width); cols = 7
W = Image.new('RGB', (tw * cols, th * ((len(fs) + cols - 1) // cols)))
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB'); m = float(np.array(im).mean())
    # look at the canvas only: the DOM text and nav stay lit even when the WebGL frame dies
    if m < 18: low.append(i)
    print(f'{i:02d} {m:.1f}', end='   ')
    W.paste(im.resize((tw, th)), (i % cols * tw, i // cols * th))
W.save('work/s/sb.jpg', quality=85)
print('\nBLACK FRAMES:', low or 'none')
