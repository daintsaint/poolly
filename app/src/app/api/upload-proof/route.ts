import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/upload-proof
 *
 * Accepts a base64-encoded image and uploads it to ImgBB, returning a
 * permanent public URL suitable for on-chain storage.
 *
 * Body: { image: string (base64, no data: prefix), name?: string }
 * Response: { url: string } | { error: string }
 *
 * Requires IMGBB_API_KEY env var (free at https://api.imgbb.com/).
 */
export async function POST(req: NextRequest) {
  try {
    const { image, name } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "image (base64) required" }, { status: 400 });
    }

    if (!process.env.IMGBB_API_KEY) {
      return NextResponse.json({ error: "Image hosting not configured (IMGBB_API_KEY missing)" }, { status: 503 });
    }

    const form = new FormData();
    form.append("key", process.env.IMGBB_API_KEY);
    form.append("image", image);
    if (name) form.append("name", name);
    form.append("expiration", "0"); // 0 = never expires

    const res = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: form,
    });

    const json = await res.json();

    if (!json.success) {
      console.error("ImgBB upload error:", json);
      return NextResponse.json(
        { error: json.error?.message ?? "Upload failed" },
        { status: 500 }
      );
    }

    // Return the direct image URL (permanent)
    const url: string = json.data.display_url ?? json.data.url;
    return NextResponse.json({ url });
  } catch (err) {
    console.error("upload-proof error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
