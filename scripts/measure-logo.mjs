import sharp from "sharp";

// Directly scan the rendered SVG bitmap for any non-transparent pixels
// and report the tight bounding box in viewBox units (1 rendered px = 1 unit).
const { data, info } = await sharp("logo.svg")
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H, channels } = info;
let minX = W, minY = H, maxX = -1, maxY = -1;
let opaqueCount = 0;

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const a = data[(y * W + x) * channels + 3];
    if (a > 2) {
      opaqueCount++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

console.log(
  JSON.stringify(
    {
      renderedSize: `${W}x${H}`,
      opaqueCount,
      minX,
      minY,
      maxX,
      maxY,
      boundsW: maxX - minX + 1,
      boundsH: maxY - minY + 1,
    },
    null,
    2
  )
);
