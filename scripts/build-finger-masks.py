"""Splits the hand silhouette into one mask per finger, for the active-finger tint.

Input : src/app/assets/hand-mask.png (from build-hand-mask.py), 1028×1396, white on transparent.
Output: src/app/assets/finger-{T,I,M,R,P}.png — same size, white on transparent.

Method
1. Cut the silhouette at the knuckles: one segment per finger, from the bottom of the slit on
   one side to the bottom of the slit (or the outer edge) on the other. The slit bottoms were
   measured on the mask itself (the last row where the slit is still open), so each segment
   starts and ends outside the hand and the cut closes the finger off.
2. Flood-fill each finger from a seed in its middle: the region is exactly the silhouette's
   finger, so the tint follows its outline and tilt.
3. Fade the tint out over the last FEATHER pixels before the cut, so it doesn't end in a hard
   line across the back of the hand.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt

src = sys.argv[1] if len(sys.argv) > 1 else 'src/app/assets/hand-mask.png'
out = sys.argv[2] if len(sys.argv) > 2 else 'src/app/assets/finger-{}.png'
FEATHER = 56

hand = np.array(Image.open(src))[..., 3] > 127
h, w = hand.shape

# Knuckle cuts (mask pixels, 4× the 257×349 drawing). Slit bottoms: thumb|index (319,740),
# index|middle (505,530), middle|ring (667,540), ring|pinky (798,600).
CUTS = {
    'T': [(319, 730), (180, 905)],
    'I': [(318, 628), (505, 526)],
    'M': [(505, 526), (667, 536)],
    'R': [(667, 536), (798, 596)],
    'P': [(798, 596), (935, 712)],
}
SEEDS = {'T': (230, 620), 'I': (415, 300), 'M': (595, 300), 'R': (775, 300), 'P': (920, 400)}

cut_img = Image.new('L', (w, h), 0)
draw = ImageDraw.Draw(cut_img)
for seg in CUTS.values():
    draw.line(seg, fill=255, width=5)
cut = np.array(cut_img) > 0


def region(seed):
    # .copy(): floodfill silently does nothing on images that still share numpy's buffer
    img = Image.fromarray(((~hand | cut) * 255).astype(np.uint8)).copy()  # 255 = blocked
    ImageDraw.floodfill(img, seed, 128)
    return np.array(img) == 128


dist = distance_transform_edt(~cut)
for fid, seed in SEEDS.items():
    finger = region(seed)
    share = float(finger.sum() / hand.sum())
    assert 0.02 < share < 0.2, f'{fid}: the cut leaked or missed the finger ({share:.3f} of the hand)'
    alpha = np.where(finger, np.clip(dist / FEATHER, 0, 1), 0)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = (alpha * 255).astype(np.uint8)
    path = out.format(fid)
    Image.fromarray(rgba, 'RGBA').save(path, optimize=True)
    print('wrote', path, 'share', round(share, 3))
