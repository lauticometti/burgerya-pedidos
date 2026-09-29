import React from "react";
import { getDeliveryZone, listDeliveryZones } from "../utils/deliveryZones";

// Extrae "Zona 2" del name guardado en el GeoJSON ("Zona 2 - $1500").
function zoneNumberLabel(zoneId) {
  const zone = listDeliveryZones().find((z) => z.id === zoneId);
  if (!zone) return null;
  const m = /^(Zona\s+\d+)/.exec(zone.name || "");
  return m ? m[1] : zone.name;
}

/**
 * Logica pura (sin hooks) para poder testearla directo. Resuelve zona/precio
 * de envio a partir de coordenadas.
 *
 * Estados: "idle" (sin direccion resuelta todavia), "covered" (hay zona y
 * precio) o "uncovered" (getDeliveryZone devolvio covered:false). No hay
 * estado "resolving" real porque getDeliveryZone es sincronico — se deja
 * listo el nombre del estado por si mas adelante se agrega geocoding async.
 */
export function computeDeliveryQuote(coords, deliveryMode) {
  if (deliveryMode !== "Delivery" || !coords) {
    return {
      status: "idle",
      covered: null,
      zoneId: null,
      zoneLabel: null,
      deliveryPrice: null,
    };
  }

  const result = getDeliveryZone(coords.lat, coords.lng);
  if (!result.covered) {
    return {
      status: "uncovered",
      covered: false,
      zoneId: null,
      zoneLabel: null,
      deliveryPrice: null,
    };
  }

  return {
    status: "covered",
    covered: true,
    zoneId: result.zoneId,
    zoneLabel: zoneNumberLabel(result.zoneId),
    deliveryPrice: result.deliveryPrice,
  };
}

// Vive en utils/checkoutTotals (fuente unica de los montos); se re-exporta
// aca para no romper a quien ya lo importaba desde el hook.
export { deliveryPriceFor } from "../utils/checkoutTotals";

export default function useDeliveryQuote(coords, deliveryMode) {
  return React.useMemo(
    () => computeDeliveryQuote(coords, deliveryMode),
    [coords, deliveryMode],
  );
}
