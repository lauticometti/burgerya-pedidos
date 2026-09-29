import { readSessionId, createSessionId, buildSessionCookie, getClientIp, hashIp, requireSecretConfigured } from "../_lib/session.js";
import { registerNewSession, registerReverse } from "../_lib/rateLimit.js";
import { limitedBody, logLimit } from "../_lib/limitResponse.js";
import { reverse, isConfigured, GooglePlacesError } from "../_lib/googleLocation.js";
import { isInsideSearchArea } from "../_lib/searchArea.js";
import { isProductionWithoutRedis } from "../_lib/rateLimitStore.js";

// Pin -> direccion legible. Se llama recien cuando el pin "se asienta"
// (debounce en el cliente), nunca por cada movimiento. Mismo orden que el
// resto: todos los controles de costo ANTES de tocar al proveedor.

const SAFE_UNAVAILABLE_MESSAGE = "No pudimos obtener la direccion en este momento.";

function sendJson(res, status, body, cookie) {
  if (cookie) res.setHeader("Set-Cookie", cookie);
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (isProductionWithoutRedis()) {
    res.status(503).json({ error: "service_unavailable", message: SAFE_UNAVAILABLE_MESSAGE });
    return;
  }

  // Sin SESSION_SIGNING_SECRET en produccion no se pueden firmar sesiones
  // (crypto tiraria una excepcion -> 500): fallamos cerrado con un 503 seguro.
  if (!requireSecretConfigured()) {
    res.status(503).json({ error: "service_unavailable", message: SAFE_UNAVAILABLE_MESSAGE });
    return;
  }

  const { lat, lng } = req.body || {};
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: "invalid_coordinates" });
    return;
  }

  const ipHash = hashIp(getClientIp(req));
  let cookieToSet = null;
  let sessionId = readSessionId(req);

  if (!sessionId) {
    const decision = await registerNewSession(ipHash);
    if (!decision.allowed) {
      logLimit("new_session", null, decision);
      res.status(429).json(limitedBody("reverse", decision));
      return;
    }
    sessionId = createSessionId();
    cookieToSet = buildSessionCookie(sessionId);
  }

  // Un pin lejos de la zona no tiene reparto posible: no vale la pena gastar
  // una consulta (y evita usarnos como geocodificador gratis del mundo).
  if (!isInsideSearchArea(lat, lng)) {
    sendJson(res, 200, { address: null, reason: "outside_area" }, cookieToSet);
    return;
  }

  const decision = await registerReverse(sessionId);
  if (!decision.allowed) {
    logLimit("reverse", sessionId, decision);
    sendJson(res, 429, limitedBody("reverse", decision), cookieToSet);
    return;
  }

  if (!isConfigured()) {
    sendJson(res, 503, { error: "not_configured", message: SAFE_UNAVAILABLE_MESSAGE }, cookieToSet);
    return;
  }

  try {
    console.log(`[location/reverse] calling Google... sesion=${sessionId}`);
    const result = await reverse(lat, lng);
    sendJson(res, 200, result || { address: null, reason: "no_result" }, cookieToSet);
  } catch (err) {
    if (err instanceof GooglePlacesError && err.status === 429) {
      console.error("[location/reverse] Google rate limit/cuota (429) — sin reintentos");
      sendJson(res, 503, { error: "provider_quota_exhausted", message: SAFE_UNAVAILABLE_MESSAGE }, cookieToSet);
      return;
    }
    const detail = err instanceof GooglePlacesError ? `status ${err.status}: ${String(err.body).slice(0, 300)}` : err;
    console.error("[location/reverse] Google error:", detail);
    sendJson(res, 502, { error: "upstream_error", message: SAFE_UNAVAILABLE_MESSAGE }, cookieToSet);
  }
}
