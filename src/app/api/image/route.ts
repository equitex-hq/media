import { NextRequest } from "next/server";

import {
  isRecentlyAccessed,
  transformImage,
  validateImageParams,
} from "@/lib/server/image";
import { redis } from "@/lib/server/redis";
import { SECONDS_IN_MINUTE } from "@/lib/shared/constants";
import { hash } from "@/lib/shared/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { src, transformation } = validateImageParams(searchParams);

    // Check recent access
    const recentAccess = await isRecentlyAccessed(src);

    if (!recentAccess) {
      await redis.set(`recent-access:${hash(src, 8)}`, src, {
        ex: SECONDS_IN_MINUTE * 5,
      });
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
    return new Response("Internal Server Error", { status: 500 });
  }
}
