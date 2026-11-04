import sys, torch, numpy as np
from PIL import Image, ImageFilter
from transformers import pipeline
pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Large-hf", device=0)
for src, out in zip(sys.argv[1::2], sys.argv[2::2]):
    im = Image.open(src).convert('RGB')
    w,h = im.size; s = 1536/max(w,h); small = im.resize((int(w*s),int(h*s)), Image.LANCZOS)
    d = pipe(small)['predicted_depth'].squeeze().cpu().numpy().astype('float32')
    d = (d-d.min())/(d.max()-d.min())
    r = Image.fromarray((d*255).astype('uint8')).resize((1024,int(1024*h/w)), Image.BICUBIC)
    r = r.filter(ImageFilter.GaussianBlur(1.2)); r.save(out, quality=90); print(out, r.size)
