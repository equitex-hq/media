import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

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

    const input = await readFile(filePath);
    const output = await sharp(input)
      .resize({ width })
      .webp({ quality: 75 })
      .toBuffer();

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
