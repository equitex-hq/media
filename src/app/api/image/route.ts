import { NextRequest, NextResponse } from "next/server";

import {
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
    const { src, transformation } = validateImageParams(searchParams);

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
        await redis.set(`img:org:meta:${hash(src)}`, etag);
      }

      await redis.set(`recent-access:${hash(src, 8)}`, src, {
        ex: SECONDS_IN_MINUTE * 5,
      });
    }

    if (modified) {
      const newImage = await fetchImage(src);
      const base64Image = newImage.toString("base64");
      await redis.set(`img:org:data:${hash(src)}`, base64Image);
    }

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
