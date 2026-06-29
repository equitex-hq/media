import { NextRequest, NextResponse } from "next/server";

import {
  cacheImage,
  fetchCachedImage,
  fetchImage,
  isModified,
  isRecentlyAccessed,
  transformImage,
  validateImageParams,
} from "@/lib/server/image";
import { redis } from "@/lib/server/redis";
import { SECONDS_IN_MINUTE } from "@/lib/shared/constants";
import { NotFoundError } from "@/lib/shared/errors";
import { hash } from "@/lib/shared/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { src, transformation, ttl } = validateImageParams(searchParams);

    const srcHash = hash(src);
    const tHash = `${srcHash}-${transformation.width ? transformation.width : ""}${transformation.quality ? transformation.quality : ""}${transformation.format}`;

    // Check recent access
    const recentAccess = await isRecentlyAccessed(src);

    let modified = false;
    if (!recentAccess) {
      const response = await fetch(src, { method: "HEAD", cache: "no-store" });
      if (!response.ok) {
        throw new NotFoundError("Source image not found");
      }

      const etag = response.headers.get("etag");
      modified = etag ? await isModified(src, etag) : true;

      if (modified) {
        await redis.set(`img:org:meta:${srcHash}`, etag);
      }

      await redis.set(`recent-access:${hash(src, 8)}`, src, {
        ex: SECONDS_IN_MINUTE * 5,
      });
    }

    if (modified) {
      const newImage = await fetchImage(src);
      await cacheImage(srcHash, "org", newImage);
    }

    // Return cached transformation if possible
    const cachedTransformation = await fetchCachedImage("var", tHash);
    if (cachedTransformation) {
      return new Response(new Uint8Array(cachedTransformation), {
        status: 200,
        headers: {
          "Content-Type": `image/${transformation.format}`,
          "Cache-Control": `public, max-age=${ttl}`,
        },
      });
    }

    // Cached original
    const cachedOriginal = await fetchCachedImage("org", srcHash);
    if (cachedOriginal) {
      const transformed = await transformImage(cachedOriginal, {
        width: transformation.width,
        quality: transformation.quality,
        format: transformation.format,
      });

      // Cache transformation
      await cacheImage(tHash, "var", transformed);

      return new Response(new Uint8Array(transformed), {
        status: 200,
        headers: {
          "Content-Type": `image/${transformation.format}`,
          "Cache-Control": `public, max-age=${ttl}`,
        },
      });
    }

    const image = await fetchImage(src);
    await cacheImage(srcHash, "org", image);

    const transformed = await transformImage(image, {
      width: transformation.width,
      quality: transformation.quality,
      format: transformation.format,
    });
    await cacheImage(tHash, "var", transformed);

    return new Response(new Uint8Array(transformed), {
      status: 200,
      headers: {
        "Content-Type": `image/${transformation.format}`,
        "Cache-Control": `public, max-age=${ttl}`,
      },
    });
  } catch (error) {
    console.error(error);

    // Not Found Error
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Internal Server Error
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
