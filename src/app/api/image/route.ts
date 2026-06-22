import { NextRequest } from "next/server";
import path from "node:path";

import { transformImage } from "@/lib/server/image";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const src = searchParams.get("src");
    if (!src) {
      throw new Error("Missing src parameter");
    }

    const width = Number(searchParams.get("w"));

    const filePath = path.join(
      process.cwd(),
      "public",
      src.replace(/^\/+/, ""),
    );

    const output = await transformImage(filePath, {
      w: width,
      format: "webp",
    });

    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
