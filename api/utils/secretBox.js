const crypto = require("crypto");

// AES-256-GCM for small secrets at rest (GitHub OAuth tokens). The key comes
// from SECRET_BOX_KEY, or is derived from the JWT secret when that isn't set.
const key = () =>
  crypto
    .createHash("sha256")
    .update(process.env.SECRET_BOX_KEY || `${process.env.ACCESS_TOKEN_SECERT}:secret-box`)
    .digest();

const seal = (plaintext) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
};

const open = (sealed) => {
  if (!sealed) return null;
  try {
    const [iv, tag, data] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
};

module.exports = { seal, open };
