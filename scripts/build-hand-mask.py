"""Derives the hand silhouette from the public-domain dorsum ink drawing.

Input : e2e/screens/hand-raster.png — the drawing rasterised on white at 1028×1396
        (`npx playwright screenshot` of a page that only shows the SVG at that size).
Output: src/app/assets/hand-mask.png — white silhouette on transparent, same size.

The drawing's contour has small gaps (and the wrist runs off the bottom), so the
ink is dilated by R before flood-filling the exterior from the top corners; the
silhouette is then eroded back by R so it hugs the real outline.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src = sys.argv[1] if len(sys.argv) > 1 else 'e2e/screens/hand-raster.png'
out = sys.argv[2] if len(sys.argv) > 2 else 'src/app/assets/hand-mask.png'
R = int(sys.argv[3]) if len(sys.argv) > 3 else 18       # closes the contour gaps (palm)
R_FINE = int(sys.argv[4]) if len(sys.argv) > 4 else 8   # keeps the slits between fingers open
FINGER_ZONE = int(sys.argv[5]) if len(sys.argv) > 5 else 660  # px from the top where finger slits live

a = np.array(Image.open(src).convert('L'))
ink = a < 140
h, w = ink.shape


def exterior_of(radius):
    """Exterior region after fattening the ink by `radius` (scanline flood fill from the corners)."""
    wall = np.array(Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * radius + 1))) > 0
    wall[h - 3 :, :] = True  # the wrist is open at the bottom
    ext = np.zeros_like(wall)
    stack = [(0, 0), (0, w - 1), (h // 2, 0), (h // 2, w - 1)]
    while stack:
        y, x = stack.pop()
        if ext[y, x] or wall[y, x]:
            continue
        x0 = x
        while x0 > 0 and not wall[y, x0 - 1] and not ext[y, x0 - 1]:
            x0 -= 1
        x1 = x
        while x1 < w - 1 and not wall[y, x1 + 1] and not ext[y, x1 + 1]:
            x1 += 1
        ext[y, x0 : x1 + 1] = True
        for ny in (y - 1, y + 1):
            if 0 <= ny < h:
                xs = np.flatnonzero(~wall[ny, x0 : x1 + 1] & ~ext[ny, x0 : x1 + 1])
                prev = -2
                for xi in xs:
                    if xi != prev + 1:
                        stack.append((ny, x0 + int(xi)))
                    prev = xi
    return ext


# Coarse pass: big radius closes every gap in the contour, so the palm fills.
exterior_full = exterior_of(R)
inside = ~exterior_full
sil = np.array(Image.fromarray((inside * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(2 * R + 1))) > 0
sil[h - R - 3 :, :] = inside[h - R - 3 :, :]  # the artificial bottom wall ate the wrist band
# Slits between fingers: inside narrow bands drawn along each slit (coordinates on the
# drawing's 257×349 grid, scaled ×4), paper between two ink edges that are close together.
# Pockets between a finger edge and a crease stroke are squat, so a vertical opening
# (keep only vertical runs ≥ MIN_TALL) leaves just the slits.
from PIL import ImageDraw

SLITS = [((125, 140), (122, 12)), ((170, 145), (175, 18)), ((215, 154), (223, 58))]
BAND = 9  # half-width in grid units
MAX_RUN = 72
MIN_TALL = 48
band_img = Image.new('L', (w, h), 0)
draw = ImageDraw.Draw(band_img)
scale = w / 257
for (x0, y0), (x1, y1) in SLITS:
    draw.line([(x0 * scale, y0 * scale), (x1 * scale, y1 * scale)], fill=255, width=int(2 * BAND * scale))
band = np.array(band_img) > 0
cand = np.zeros_like(sil)
for y in range(h):
    if not band[y].any():
        continue
    xs = np.flatnonzero(ink[y])
    for a_, b_ in zip(xs[:-1], xs[1:]):
        if 1 < b_ - a_ <= MAX_RUN:
            cand[y, a_ + 1 : b_] = True
cand &= band
# vertical opening: drop candidate pixels not part of a vertical run of MIN_TALL
keep = np.zeros_like(cand)
for x in range(w):
    col = cand[:, x]
    if not col.any():
        continue
    ys = np.flatnonzero(col)
    start_y = ys[0]
    prev = ys[0]
    for yv in list(ys[1:]) + [None]:
        if yv is None or yv != prev + 1:
            if prev - start_y + 1 >= MIN_TALL:
                keep[start_y : prev + 1, x] = True
            if yv is not None:
                start_y = yv
        if yv is not None:
            prev = yv
sil &= ~keep
sil |= ink  # the ink itself is always part of the hand

coverage = float(sil.mean())
rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[..., :3] = 255
rgba[..., 3] = (sil * 255).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(out, optimize=True)
print('wrote', out, (w, h), 'coverage', round(coverage, 3), '(a full hand is roughly 0.35–0.45)')
