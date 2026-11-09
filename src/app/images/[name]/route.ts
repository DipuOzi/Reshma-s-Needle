import { EMBEDDED_IMAGES } from "@/lib/embeddedImages";

// Safety net for the built-in pictures.
//
// Next.js serves files from public/images first. This route is only reached when
// the file is NOT on disk (for example the public folder was lost in a zip or a
// copy), and then answers with the copy embedded in the source code.

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;

  const entry = Object.prototype.hasOwnProperty.call(EMBEDDED_IMAGES, name)
    ? EMBEDDED_IMAGES[name]
    : undefined;

  if (!entry) {
    return new Response("Image not found", { status: 404 });
  }

  const module = await entry.load();
  return new Response(new Uint8Array(Buffer.from(module.default, "base64")), {
    headers: {
      "Content-Type": entry.type,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
