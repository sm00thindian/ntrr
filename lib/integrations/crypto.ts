import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!secret) {
    return null;
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptJson(value: unknown): string {
  const key = getKey();
  const plaintext = JSON.stringify(value);

  if (!key) {
    return `plain:${Buffer.from(plaintext).toString("base64url")}`;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:${Buffer.concat([iv, tag, encrypted]).toString("base64url")}`;
}

export function decryptJson<T>(payload: string): T {
  if (payload.startsWith("plain:")) {
    return JSON.parse(Buffer.from(payload.slice(6), "base64url").toString("utf8")) as T;
  }

  if (!payload.startsWith("enc:")) {
    throw new Error("Invalid encrypted payload.");
  }

  const key = getKey();
  if (!key) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY is required to decrypt tokens.");
  }

  const data = Buffer.from(payload.slice(4), "base64url");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return JSON.parse(decrypted.toString("utf8")) as T;
}