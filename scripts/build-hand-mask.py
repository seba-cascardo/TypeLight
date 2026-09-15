"""Derives the hand silhouette from the public-domain dorsum ink drawing.

Input : e2e/screens/hand-raster.png — the drawing rasterised on white at 1028×1396
        (`npx playwright screenshot` of a page that only shows the SVG at that size).
Output: src/app/assets/hand-mask.png — white silhouette on transparent, same size.

Method
1. Morphological closing of the ink (dilate then erode by R): bridges the small gaps in
   the contour, and turns double strokes and the narrow slits between fingers into solid
   "wall", so no colour can leak into them.
2. Flood-fill the exterior from the top corners over that wall (the wrist runs off the
   bottom, so the bottom rows are walled off first).
3. interior = not exterior and not wall.
4. Pockets enclosed by ink inside the hand (nail beds, creases) are wall pixels that the
   exterior cannot reach: flood over "everything that is not interior" from the corners;
   whatever wall is left unreached is a pocket, and becomes interior too.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src = sys.argv[1] if len(sys.argv) > 1 else 'e2e/screens/hand-raster.png'
out = sys.argv[2] if len(sys.argv) > 2 else 'src/app/assets/hand-mask.png'
R = int(sys.argv[3]) if len(sys.argv) > 3 else 20

a = np.array(Image.open(src).convert('L'))
ink = a < 140
h, w = ink.shape


def to_img(mask):
    # .copy(): floodfill silently does nothing on images that still share numpy's buffer
    return Image.fromarray((mask * 255).astype(np.uint8)).copy()


def flood(blocked, seeds):
    """Pixels reachable from `seeds` without crossing `blocked` (PIL's C flood fill)."""
    img = to_img(blocked)  # 255 = blocked, 0 = passable
    for xy in seeds:
        if img.getpixel(xy) == 0:
            ImageDraw.floodfill(img, xy, 128)
    return np.array(img) == 128


# 1 · closing
closed = np.array(to_img(ink).filter(ImageFilter.MaxFilter(2 * R + 1)).filter(ImageFilter.MinFilter(2 * R + 1))) > 0

# 2 · exterior (bottom rows walled so the open wrist does not leak)
wall = closed.copy()
wall[h - 2 :, :] = True
exterior = flood(wall, [(0, 0), (w - 1, 0), (0, h // 2), (w - 1, h // 2)])
# the bottom rows outside the wrist are exterior too
outside_bottom = exterior[h - 3]
exterior[h - 2 :, outside_bottom] = True

# 3 · interior
interior = ~exterior & ~closed

# 4 · enclosed pockets: wall that the closing added (not real ink) and that the exterior
#     cannot reach without crossing ink — crease bridges, nail beds — belongs to the hand.
#     Slits and bridged contour gaps stay out because they touch the exterior.
added = closed & ~ink
reachable = flood(~(exterior | added), [(0, 0), (w - 1, 0)])  # walk over exterior + added only
pockets = added & ~reachable
silhouette = interior | pockets | (ink & ~exterior)

coverage = float(silhouette.mean())
rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[..., :3] = 255
rgba[..., 3] = (silhouette * 255).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(out, optimize=True)
print('wrote', out, (w, h), 'coverage', round(coverage, 3))
