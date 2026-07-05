import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.DATA_ENCRYPTION_KEY!, "hex"); // 32 bytes
const IV_LENGTH = 12;

const ENCRYPTED_PAYLOAD_REGEX = /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i;

function isLikelyEncryptedPayload(payload: string): boolean {
  if (!payload || !payload.includes(":")) {
    return false;
  }

  if (!ENCRYPTED_PAYLOAD_REGEX.test(payload)) {
    return false;
  }

  const [ivHex, authTagHex, encrypted] = payload.split(":");
  if (!ivHex || !authTagHex || !encrypted || !(encrypted.length)) {
    return false;
  }
  return ivHex.length === IV_LENGTH * 2 && authTagHex.length === 32 && encrypted.length > 0;
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(payload: string): string {
  if (!isLikelyEncryptedPayload(payload)) {
    return payload; // Return as-is if not encrypted
  }

  const parts = payload.split(":");
  if (parts.length !== 3) {
    return payload; // Invalid format, return as-is
  }

  const [ivHex, authTagHex, encrypted] = parts;

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      KEY,
      Buffer.from(ivHex!, "hex")
    );

    decipher.setAuthTag(Buffer.from(authTagHex!, "hex"));

    let decrypted: string = decipher.update(encrypted!, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return payload; // Return original if decryption fails
  }
}
