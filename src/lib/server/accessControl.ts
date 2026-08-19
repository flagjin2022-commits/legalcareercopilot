export const BETA_ACCESS_COOKIE = "lcc_beta_access";
export const ADMIN_ACCESS_COOKIE = "lcc_beta_admin";

const TOKEN_LIFETIME_SECONDS = 14 * 24 * 60 * 60;

export function isBetaAccessConfigured() {
  return Boolean(process.env.BETA_ACCESS_CODE?.trim() && process.env.BETA_SESSION_SECRET?.trim());
}

export function isAdminAccessConfigured() {
  return Boolean(process.env.BETA_ADMIN_PASSWORD?.trim() && process.env.BETA_SESSION_SECRET?.trim());
}

export async function createAccessToken(purpose: "beta" | "admin") {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS;
  const payload = `${purpose}.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAccessToken(token: string | undefined, purpose: "beta" | "admin") {
  if (!token) return false;
  const [tokenPurpose, expiresAtText, signature, extra] = token.split(".");
  if (extra || tokenPurpose !== purpose || !expiresAtText || !signature) return false;
  const expiresAt = Number(expiresAtText);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  const expected = await sign(`${tokenPurpose}.${expiresAtText}`);
  return constantTimeEqual(signature, expected);
}

export async function verifyAccessCode(provided: string, purpose: "beta" | "admin") {
  const expected = purpose === "beta" ? process.env.BETA_ACCESS_CODE : process.env.BETA_ADMIN_PASSWORD;
  if (!expected?.trim() || !provided) return false;
  const [providedHash, expectedHash] = await Promise.all([digest(provided), digest(expected)]);
  return constantTimeEqual(providedHash, expectedHash);
}

export function getAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_LIFETIME_SECONDS,
  };
}

async function sign(payload: string) {
  const secret = process.env.BETA_SESSION_SECRET;
  if (!secret) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(new Uint8Array(signature));
}

async function digest(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(hash));
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
