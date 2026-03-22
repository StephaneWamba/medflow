/**
 * Symmetric encryption helpers for health record content (AES-256-GCM).
 * E2E message encryption keys are negotiated client-side via ECDH —
 * the server only stores ciphertext + IV, never plaintext or derived keys.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "../env.js";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");

export function encryptField(plaintext: string): {
  ciphertext: string;
  iv: string;
  authTag: string;
} {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptField(
  ciphertext: string,
  iv: string,
  authTag: string,
): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Serialise encrypted field to a single storable string.
 * Format: base64(ciphertext):base64(iv):base64(authTag)
 */
export function encryptToString(plaintext: string): string {
  const { ciphertext, iv, authTag } = encryptField(plaintext);
  return `${ciphertext}:${iv}:${authTag}`;
}

export function decryptFromString(encoded: string): string {
  const [ciphertext, iv, authTag] = encoded.split(":");
  if (!ciphertext || !iv || !authTag) throw new Error("Invalid encrypted data");
  return decryptField(ciphertext, iv, authTag);
}
