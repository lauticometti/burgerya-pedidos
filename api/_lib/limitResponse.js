import { RATE_LIMITED } from "./rateLimit.js";

// Respuesta y log de un limite. Regla: un limite NUNCA se hace pasar por un
// error del proveedor. El endpoint responde 429 con un estado explicito
// (`rate_limited` / `suspicious_activity`) y un mensaje que el frontend muestra
// tal cual; ademas cada rechazo deja una linea de log que dice QUE limite fue.

function wait(retryAfterSeconds) {
  return retryAfterSeconds != null && retryAfterSeconds > 90 ? "unos minutos" : "unos segundos";
}

const BUSY_MESSAGE = "Hay mucha demanda en este momento. Elegí tu ubicación en el mapa o escribí tu dirección.";

function messageFor(scope, decision) {
  if (decision.reason === "global_limit") return BUSY_MESSAGE;
  const espera = wait(decision.retryAfterSeconds);
  if (scope === "reverse") {
    return `Estás consultando muchas direcciones seguidas. Esperá ${espera} o escribí la calle vos: el pin y el precio de envío siguen funcionando.`;
  }
  return `Estás haciendo muchas búsquedas seguidas. Esperá ${espera} o elegí tu ubicación en el mapa.`;
}

/** Cuerpo JSON (para un 429) de una decision de limite. */
export function limitedBody(scope, decision) {
  return {
    error: decision.state ?? RATE_LIMITED,
    reason: decision.reason ?? null,
    retryAfterSeconds: decision.retryAfterSeconds ?? null,
    message: messageFor(scope, decision),
  };
}

/** Deja en el log QUE limite (funcion + motivo) corto la request. */
export function logLimit(scope, sessionId, decision) {
  console.warn(
    `[rate-limit] ${decision.state ?? RATE_LIMITED} scope=${scope} reason=${decision.reason ?? "?"} sesion=${sessionId ?? "-"} retryAfter=${decision.retryAfterSeconds ?? "?"}s — no se llama a Google`,
  );
}

/** Uso alto (permitido, pero registrado). */
export function logHighUsage(scope, sessionId, distinctCount) {
  console.warn(`[rate-limit] HIGH_USAGE scope=${scope} sesion=${sessionId} busquedasDistintas=${distinctCount} — permitido`);
}
