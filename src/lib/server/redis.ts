import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Initialized Redis client using environment variables.
 */
export const redis = Redis.fromEnv();
