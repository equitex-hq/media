import sharp from "sharp";

import { redis } from "@/lib/server/redis";
import { hash } from "@/lib/shared/utils";
import {
  imagePathSchema,
  transformationSchema,
  type ImagePath,
  type Transformation,
} from "@/schemas/image";

export async function cacheImage(
  hash: string,
  type: string,
  image: Buffer<ArrayBufferLike>,
) {
  const image_string = image.toString("base64");
  await redis.set(`img:${type}:data:${hash}`, image_string);
}

export async function fetchCachedImage(
  type: string,
  hash: string,
): Promise<Buffer<ArrayBuffer> | null> {
  const key = `img:${type}:data:${hash}`;
  const cached = await redis.get<string>(key);
  return cached ? Buffer.from(cached, "base64") : null;
}

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

/**
 * Transforms image according to Transformation object.
 * @param image Image buffer
 * @param params Transformation parameters
 * @returns Buffer of transformed image
 */
export async function transformImage(
  image: Buffer<ArrayBuffer>,
  params: Transformation,
): Promise<Buffer<ArrayBufferLike>> {
  let pipeline = sharp(image).resize({
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

export async function isModified(
  url: ImagePath,
  etag: string,
): Promise<boolean> {
  etag = etag.replaceAll('"', ""); // Normalize etag
  const cachedEtag = await redis.get<string>(`img:org:meta:${hash(url)}`);
  return etag != cachedEtag;
}

export async function isCached(type: string, hash: string): Promise<boolean> {
  const key = `img:${type}:data:${hash}`;
  const cached = await redis.exists(key);
  return !!cached;
}
