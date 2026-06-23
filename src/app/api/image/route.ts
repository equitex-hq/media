import { NextRequest } from "next/server";

import { transformImage, validateImageParams } from "@/lib/server/image";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { src, transformation } = validateImageParams(searchParams);

    const output = await transformImage(src, {
      width: transformation.width,
      quality: transformation.quality,
      format: transformation.format,
    });

    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": `image/${transformation.format}`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
