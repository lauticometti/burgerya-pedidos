import { readSessionId, createSessionId, buildSessionCookie, getClientIp, hashIp, requireSecretConfigured } from "../_lib/session.js";
import { registerNewSession, registerSearch } from "../_lib/rateLimit.js";
import { limitedBody, logLimit, logHighUsage } from "../_lib/limitResponse.js";
import { suggest, isConfigured, GooglePlacesError } from "../_lib/googleLocation.js";
import { isProductionWithoutRedis } from "../_lib/rateLimitStore.js";

// Endpoint neutral de proveedor: el frontend solo conoce /api/location/*.
// Hoy detras hay Google Places; cambiar de proveedor no toca al cliente.
//
// Orden fijo (nada de esto se reordena sin pensar en costos): metodo ->
// almacen persistente -> sesion (fusible global + limite por IP si es nueva)
// -> largo minimo -> limites de busqueda (bloqueo vigente, ritmo, rafaga,
// busquedas distintas) -> recien ahi, configuracion y llamada al proveedor.
// Un limite responde 429 con estado explicito (rate_limited /
// suspicious_activity) y un mensaje para el cliente: nunca parece un error del
// proveedor.

const MIN_QUERY_LENGTH = 4;
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

  // Sin almacenamiento persistente en produccion no podemos garantizar los
  // limites: fallamos cerrado (no llamamos al proveedor) en vez de degradar.
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

  const { input, sessionToken } = req.body || {};
  if (!sessionToken || typeof sessionToken !== "string") {
    res.status(400).json({ error: "missing_session_token" });
    return;
  }

  const ipHash = hashIp(getClientIp(req));
  let cookieToSet = null;
  let sessionId = readSessionId(req);

  if (!sessionId) {
    const decision = await registerNewSession(ipHash);
    if (!decision.allowed) {
      logLimit("new_session", null, decision);
      res.status(429).json(limitedBody("search", decision));
      return;
    }
    sessionId = createSessionId();
    cookieToSet = buildSessionCookie(sessionId);
  }

  const trimmed = (input || "").trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    // Todavia no hay suficiente texto: no cuenta como busqueda, no se llama al proveedor.
    sendJson(res, 200, { suggestions: [] }, cookieToSet);
    return;
  }

  const searchResult = await registerSearch(sessionId, sessionToken);
  if (searchResult.blocked) {
    logLimit("search", sessionId, searchResult);
    sendJson(res, 429, limitedBody("search", searchResult), cookieToSet);
    return;
  }
  if (searchResult.usage === "high") logHighUsage("search", sessionId, searchResult.distinctCount);

  // La configuracion se chequea DESPUES de todo el rate limiting a proposito:
  // asi el pipeline completo (sesion, IP, fusible global, conteo, bloqueo al
  // #10) se puede probar en local aunque todavia no haya token cargado.
  if (!isConfigured()) {
    sendJson(res, 503, { error: "not_configured", message: SAFE_UNAVAILABLE_MESSAGE }, cookieToSet);
    return;
  }

  try {
    console.log(
      `[location/autocomplete] calling Google... sesion=${sessionId} busquedasDistintas=${searchResult.distinctCount}`,
    );
    const suggestions = await suggest(trimmed, sessionToken);
    sendJson(res, 200, { suggestions: suggestions.slice(0, 5), usage: searchResult.usage }, cookieToSet);
  } catch (err) {
    if (err instanceof GooglePlacesError && err.status === 429) {
      console.error("[location/autocomplete] Google rate limit/cuota (429) — sin reintentos");
      sendJson(res, 503, { error: "provider_quota_exhausted", message: SAFE_UNAVAILABLE_MESSAGE }, cookieToSet);
      return;
    }
    const detail = err instanceof GooglePlacesError ? `status ${err.status}: ${String(err.body).slice(0, 300)}` : err;
    console.error("[location/autocomplete] Google error:", detail);
    sendJson(res, 502, { error: "upstream_error", message: SAFE_UNAVAILABLE_MESSAGE }, cookieToSet);
  }
}
