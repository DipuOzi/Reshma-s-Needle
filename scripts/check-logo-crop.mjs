import sharp from "sharp";

// Verify the cropped public/logo.svg: no artwork should touch the edges.
const { data, info } = await sharp("public/logo.svg")
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H, channels } = info;
let minX = W, minY = H, maxX = -1, maxY = -1;

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const a = data[(y * W + x) * channels + 3];
    if (a > 2) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

const pad = Math.min(minX, minY, W - 1 - maxX, H - 1 - maxY);
console.log(
  JSON.stringify({
    rendered: `${info.width}x${info.height}`,
    minX, minY, maxX, maxY,
    edgePaddingPx: pad,
    clipped: pad <= 1,
  }, null, 2)
);
