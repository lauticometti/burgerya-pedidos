// Como interpreta el cliente la respuesta de /api/location/*. Un limite de uso
// (rate_limited / suspicious_activity) es un estado propio, NUNCA se muestra
// como "el servicio esta roto": tiene su mensaje y deja intacto lo que la
// persona ya tenia (direccion elegida, pin, cotizacion). Solo informa.

export const LIMITED_STATES = ["rate_limited", "suspicious_activity"];

const FALLBACK_LIMITED_MESSAGE =
  "Estás haciendo muchas búsquedas seguidas. Esperá unos segundos o elegí tu ubicación en el mapa.";
const FALLBACK_UNAVAILABLE_MESSAGE = "No pudimos buscar direcciones en este momento. Elegí tu ubicación en el mapa.";

/**
 * @param {{ok:boolean, status:number, data:any}} response  respuesta ya parseada
 * @returns {{kind:"ok"} | {kind:"limited", message:string, retryAfterSeconds:number|null}
 *           | {kind:"unavailable", message:string}}
 */
export function classifyLocationResponse(response) {
  const { ok, status, data } = response || {};
  if (ok) return { kind: "ok" };

  if (status === 429 && LIMITED_STATES.includes(data?.error)) {
    return {
      kind: "limited",
      message: data?.message || FALLBACK_LIMITED_MESSAGE,
      retryAfterSeconds: Number.isFinite(data?.retryAfterSeconds) ? data.retryAfterSeconds : null,
    };
  }

  return { kind: "unavailable", message: data?.message || FALLBACK_UNAVAILABLE_MESSAGE };
}
