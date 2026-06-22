import { readFile } from "node:fs/promises";
import sharp from "sharp";

import type { ImagePath, Transformation } from "@/schemas/image";

export async function transformImage(
  src: ImagePath,
  params: Transformation,
): Promise<Buffer<ArrayBufferLike>> {
  const sourceImage = await readFile(src);

  let pipeline = sharp(sourceImage).resize({ width: params.w });

  if (params.format === "webp") {
    pipeline = pipeline.webp({ quality: 75 });
  }

  return pipeline.toBuffer();
}
