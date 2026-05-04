import { NextRequest, NextResponse } from "next/server";
import { getGuestSession } from "@/lib/session";
import { getPhotoStream } from "@/lib/storage";

const VALID_KEY = /^originals\/[\w-]+\.(jpe?g|png|webp)$/i;

export async function GET(request: NextRequest) {
  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key || !VALID_KEY.test(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  let result: Awaited<ReturnType<typeof getPhotoStream>>;
  try {
    result = await getPhotoStream(key);
  } catch (err) {
    console.error("[/api/photos/download] S3 error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filename = key.split("/").pop() ?? "photo.jpg";
  return new Response(result.body, {
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
