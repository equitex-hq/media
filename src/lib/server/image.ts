import sharp from "sharp";

import type { ImagePath, Transformation } from "@/schemas/image";

async function fetchImage(url: ImagePath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch source image");
  }

  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  return inputBuffer;
}

export async function transformImage(
  url: ImagePath,
  params: Transformation,
): Promise<Buffer<ArrayBufferLike>> {
  const sourceImage = await fetchImage(url);
  let pipeline = sharp(sourceImage).resize({ width: params.w });

  if (params.format === "webp") {
    pipeline = pipeline.webp({ quality: 75 });
  }

  return pipeline.toBuffer();
}
