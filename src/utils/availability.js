import { getShiftOrdinal } from "./storeClosedMode";

export const UNAVAILABLE_REASON_DEFAULT = "no disponible este turno";

// Si el item quedó marcado como no disponible en un turno anterior al que
// está corriendo ahora, se considera repuesto automáticamente: lo normal es
// reponer antes del próximo turno, así que el badge no debe sobrevivir a un
// cambio de turno sin que alguien lo revierta a mano.
//
// unavailableSince (formato "YYYY-MM-DD") es la fecha en la que se marcó el
// item como no disponible. Se asume que fue marcado durante el turno que
// esté corriendo ahora en ese día (uso normal: se marca en el momento).
function isStillWithinMarkedShift(item) {
  const since = item?.unavailableSince;
  if (!since) return true; // sin fecha registrada, no se puede auto-reponer

  const [year, month, day] = since.split("-").map(Number);
  const sinceDate = new Date();
  sinceDate.setFullYear(year, month - 1, day);

  return getShiftOrdinal(sinceDate) >= getShiftOrdinal();
}

export function isItemUnavailable(item) {
  const flag = item?.isAvailable;
  const flaggedUnavailable = flag === 0 || flag === false;
  if (!flaggedUnavailable) return false;
  return isStillWithinMarkedShift(item);
}

export function isItemAvailable(item) {
  return !isItemUnavailable(item);
}

export function getUnavailableReason(item) {
  return item?.unavailableReason || UNAVAILABLE_REASON_DEFAULT;
}

export function withAvailabilityDefaults(items) {
  return items.map((item) => ({
    ...item,
    isAvailable: item.isAvailable ?? 1,
    unavailableReason: item.unavailableReason ?? UNAVAILABLE_REASON_DEFAULT,
  }));
}
