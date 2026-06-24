import { createHash } from "crypto";

/**
 * Creates a hash using SHA-256.
 * @param s String to hash
 * @param len Length of the hash
 * @returns Hashed string
 */
export function hash(s: string, len: number = 64): string {
  return createHash("sha256").update(s).digest("hex").slice(0, len);
}
