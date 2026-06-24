import sharp from "sharp";

import { redis } from "@/lib/server/redis";
import { hash } from "@/lib/shared/utils";
import {
  imagePathSchema,
  transformationSchema,
  type ImagePath,
  type Transformation,
} from "@/schemas/image";

/**
 * Fetches image from URL.
 * @param url Image URL
 * @returns Buffer containing the image data
 */
export async function fetchImage(url: ImagePath): Promise<Buffer<ArrayBuffer>> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch source image");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function transformImage(
  url: ImagePath,
  params: Transformation,
): Promise<Buffer<ArrayBufferLike>> {
  const sourceImage = await fetchImage(url);
  let pipeline = sharp(sourceImage).resize({
    width: params.width,
  });

  if (params.format === "webp") {
    pipeline = pipeline.webp({ quality: params.quality });
  } else if (params.format === "jpeg") {
    pipeline = pipeline.jpeg({ quality: params.quality });
  } else if (params.format === "png") {
    pipeline = pipeline.png({ quality: params.quality });
  }

  return pipeline.toBuffer();
}

/**
 * Validates and parses image parameters.
 * @param params URLSearchParams containing the image parameters
 * @returns Object containing the validated src and transformation parameters
 */
export function validateImageParams(params: URLSearchParams): {
  src: ImagePath;
  transformation: Transformation;
} {
  const src = params.get("src");
  if (!src) {
    throw new Error("Missing src parameter");
  }

  const parsedSrc = imagePathSchema.safeParse(src);
  if (!parsedSrc.success) {
    throw new Error("Invalid format of src parameter", parsedSrc.error);
  }

  const width = params.get("w");
  const quality = params.get("q");
  const format = params.get("f");
  const transformation = {
    ...(width && { width }),
    ...(quality && { quality }),
    ...(format && { format }),
  };

  const parsedTransformation = transformationSchema.safeParse(transformation);
  if (!parsedTransformation.success) {
    throw new Error(
      "Invalid format of transformation parameters",
      parsedTransformation.error,
    );
  }

  return { src: parsedSrc.data, transformation: parsedTransformation.data };
}

/**
 * Checks if the image URL has been accessed recently.
 * @param url Image URL
 * @returns Boolean whether the image URL has been accessed recently
 */
export async function isRecentlyAccessed(url: ImagePath): Promise<boolean> {
  const cached = await redis.get<string>(`recent-access:${hash(url, 8)}`);
  return !!cached;
}
