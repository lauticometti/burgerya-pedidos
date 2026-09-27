import { readSessionId, createSessionId, buildSessionCookie, getClientIp, hashIp } from "../_lib/session.js";
import { registerNewSession, registerRetrieve } from "../_lib/rateLimit.js";
import { limitedBody, logLimit } from "../_lib/limitResponse.js";
import { retrieve, isConfigured, GooglePlacesError } from "../_lib/googleLocation.js";
import { isProductionWithoutRedis } from "../_lib/rateLimitStore.js";

const SAFE_UNAVAILABLE_MESSAGE = "No pudimos buscar direcciones en este momento. Escribinos por WhatsApp.";

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

  const { id, sessionToken } = req.body || {};
  if (!id || typeof id !== "string" || !sessionToken || typeof sessionToken !== "string") {
    res.status(400).json({ error: "missing_params" });
    return;
  }

  const ipHash = hashIp(getClientIp(req));
  let cookieToSet = null;
  let sessionId = readSessionId(req);

  if (!sessionId) {
    // Pedir el detalle de un lugar sin haber buscado antes (sin cookie de
    // sesion) es un patron anomalo: se trata como una sesion nueva, con el
    // mismo fusible global y limite por IP, antes de tocar al proveedor.
    const decision = await registerNewSession(ipHash);
    if (!decision.allowed) {
      logLimit("new_session", null, decision);
      res.status(429).json(limitedBody("search", decision));
      return;
    }
    sessionId = createSessionId();
    cookieToSet = buildSessionCookie(sessionId);
  }

  // Elegir una direccion de la lista tiene su PROPIO contador: que la persona
  // haya buscado mucho no le impide resolver la direccion que ya eligio.
  const decision = await registerRetrieve(sessionId);
  if (!decision.allowed) {
    logLimit("retrieve", sessionId, decision);
    sendJson(res, 429, limitedBody("search", decision), cookieToSet);
    return;
  }

  if (!isConfigured()) {
    sendJson(res, 503, { error: "not_configured", message: SAFE_UNAVAILABLE_MESSAGE }, cookieToSet);
    return;
  }

  try {
    console.log(`[location/retrieve] calling Google... sesion=${sessionId}`);
    const place = await retrieve(id, sessionToken);
    if (!place) {
      sendJson(res, 404, { error: "not_found", message: "No pudimos ubicar esa direccion. Probá con otra o marcala en el mapa." }, cookieToSet);
      return;
    }
    sendJson(res, 200, place, cookieToSet);
  } catch (err) {
    if (err instanceof GooglePlacesError && err.status === 429) {
      console.error("[location/retrieve] Google rate limit/cuota (429) — sin reintentos");
      sendJson(res, 503, { error: "provider_quota_exhausted", message: SAFE_UNAVAILABLE_MESSAGE }, cookieToSet);
      return;
    }
    const detail = err instanceof GooglePlacesError ? `status ${err.status}: ${String(err.body).slice(0, 300)}` : err;
    console.error("[location/retrieve] Google error:", detail);
    sendJson(res, 502, { error: "upstream_error", message: SAFE_UNAVAILABLE_MESSAGE }, cookieToSet);
  }
}
