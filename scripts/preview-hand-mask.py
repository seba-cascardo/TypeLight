"""Overlay the mask on the ink raster for eyeballing: skin = mask, brown = ink, blue = outside."""
import sys
import numpy as np
from PIL import Image
mask = sys.argv[1] if len(sys.argv) > 1 else 'src/app/assets/hand-mask.png'
out = sys.argv[2] if len(sys.argv) > 2 else 'e2e/screens/hand-mask-preview.png'
crop = [int(v) for v in sys.argv[3].split(',')] if len(sys.argv) > 3 else None
im = Image.open(mask)
bg = Image.new('RGBA', im.size, (60, 80, 120, 255))
skin = Image.new('RGBA', im.size, (240, 210, 180, 255))
bg.paste(skin, (0, 0), im)
ink = np.array(Image.open('e2e/screens/hand-raster.png').convert('L')) < 140
a = np.array(bg.convert('RGB'))
a[ink] = [120, 60, 30]
img = Image.fromarray(a)
if crop:
    img = img.crop(tuple(crop))
img.save(out)
print('preview', out, img.size)
