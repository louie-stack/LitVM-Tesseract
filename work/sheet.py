from PIL import Image
n = ['h', 'e1', 'e2', 'm', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 't1', 't2', 't3', 'n', 'c', 'tm', 'ap']
W, H = 640, 360
for k, chunk in enumerate([n[:9], n[9:]]):
    s = Image.new('RGB', (W * 3, H * 3))
    for i, x in enumerate(chunk):
        s.paste(Image.open(f'work/s/{x}.jpg').resize((W, H)), ((i % 3) * W, (i // 3) * H))
    s.save(f'work/s/sheet{k}.jpg', quality=86)
