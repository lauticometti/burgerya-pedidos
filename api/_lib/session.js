import crypto from "node:crypto";

const COOKIE_NAME = "bya_sid";

// Secreto de firma. En produccion DEBE venir de env var (SESSION_SIGNING_SECRET
// en Vercel, nunca commiteado). En dev local, si no esta configurado, se usa
// un secreto fijo de desarrollo — esto NUNCA debe pasar en produccion real,
// por eso se loguea un warning bien visible.
const SECRET =
  process.env.SESSION_SIGNING_SECRET ||
  (process.env.VERCEL_ENV === "production"
    ? null
    : "dev-only-insecure-secret-do-not-use-in-production");

if (!SECRET) {
  // No tiramos un throw a nivel de modulo para no romper el build; cada
  // endpoint chequea esto explicitamente antes de operar (ver requireSecret).
  console.error(
    "[session] SESSION_SIGNING_SECRET no esta configurada en produccion.",
  );
}

export function requireSecretConfigured() {
  return Boolean(SECRET);
}

function sign(value) {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

/**
 * Lee y valida la cookie de sesion firmada de la request.
 * Devuelve el sessionId si es valida, o null si falta / esta corrupta /
 * fue forjada (firma no coincide).
 */
export function readSessionId(req) {
  if (!SECRET) return null;
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;
  const dotIdx = raw.lastIndexOf(".");
  if (dotIdx === -1) return null;
  const sessionId = raw.slice(0, dotIdx);
  const signature = raw.slice(dotIdx + 1);
  const expected = sign(sessionId);
  if (!timingSafeEqual(signature, expected)) return null;
  return sessionId;
}

/** Crea un sessionId nuevo (random, sin ningun dato personal adentro). */
export function createSessionId() {
  return crypto.randomBytes(18).toString("base64url");
}

/** Arma el header Set-Cookie para una sesion firmada, httpOnly, SameSite=Lax. */
export function buildSessionCookie(sessionId, maxAgeSeconds = 60 * 60 * 24) {
  const signature = sign(sessionId);
  const value = `${sessionId}.${signature}`;
  const isProd = process.env.VERCEL_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

/** Hash corto de la IP para usar como clave, sin guardar la IP en claro. */
export function hashIp(ip) {
  return crypto.createHash("sha256").update(String(ip || "unknown")).digest("hex").slice(0, 24);
}

/** IP del cliente: primer valor de X-Forwarded-For (Vercel), o el socket local en dev. */
export function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}
