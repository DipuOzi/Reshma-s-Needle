/**
 * Customer password handling for the GitHub-stored account file
 * (data/customers.json). Passwords are salted scrypt hashes, never stored
 * in plain text. Legacy plain-text rows (previously in the database seed)
 * are still verified, but any new account uses hashing.
 */

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function digest(value: string): Buffer {
  return createHmac("sha256", "rn-password-compare").update(value).digest();
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith("scrypt:")) {
    const [, salt, expectedHash] = stored.split(":");
    if (!salt || !expectedHash) return false;
    const actual = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
    const expected = Buffer.from(expectedHash, "hex");
    const received = Buffer.from(actual, "hex");
    return expected.length === received.length && timingSafeEqual(expected, received);
  }
  // Legacy plain-text rows from the previous database seed.
  return timingSafeEqual(digest(password), digest(stored));
}
