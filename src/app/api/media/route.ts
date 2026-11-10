import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireAdmin } from "@/lib/adminAuth";
import { isGithubConfigured, commitFiles, GitHubError } from "@/lib/github";
import { slugify } from "@/lib/contentStore";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
// SVG is intentionally excluded: it can carry scripts.
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please choose an image file to upload." },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, GIF, or AVIF images are allowed." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image is too large. Maximum size is 5 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    /**
     * GitHub mode (always true in production): the upload is committed
     * straight to public/images/uploads/ so it ships with the next
     * deployment and can never disappear from a rebuilt one.
     */
    if (isGithubConfigured()) {
      const ext = EXTENSIONS[file.type] ?? "jpg";
      const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "upload";
      const filename = `u-${Date.now().toString(36)}-${base}.${ext}`;
      const repoPath = `public/images/uploads/${filename}`;
      try {
        await commitFiles(
          `Upload image ${filename} via admin dashboard`,
          [{ path: repoPath, base64: buffer.toString("base64") }]
        );
        return NextResponse.json(
          { url: `/images/uploads/${filename}`, id: null },
          { status: 201 }
        );
      } catch (error) {
        console.error("[media] GitHub upload failed:", error);
        const message =
          error instanceof GitHubError
            ? `GitHub upload failed: ${error.message}`
            : "Image upload failed. Please try again.";
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }

    /**
     * Local fallback (no GitHub token): mirror the legacy database upload.
     */
    await ensureSeeded();
    const [asset] = await db
      .insert(mediaAssets)
      .values({
        filename: file.name.slice(0, 200) || "upload",
        mimeType: file.type,
        sizeBytes: file.size,
        data: buffer.toString("base64"),
      })
      .returning({ id: mediaAssets.id });

    return NextResponse.json(
      { url: `/api/media/${asset.id}`, id: asset.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/media error:", error);
    return NextResponse.json(
      { error: "Image upload failed. Please try again." },
      { status: 500 }
    );
  }
}
