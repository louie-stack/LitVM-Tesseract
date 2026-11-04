import sys, glob
from PIL import Image
d, cols, W, H, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
fs = sorted(glob.glob(d + '/f*.jpg'))
rows = (len(fs) + cols - 1) // cols
s = Image.new('RGB', (cols * W, rows * H))
for i, f in enumerate(fs):
    s.paste(Image.open(f).resize((W, H)), ((i % cols) * W, (i // cols) * H))
s.save(out, quality=84)
print(len(fs), s.size)
