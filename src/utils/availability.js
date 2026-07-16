import { getShiftOrdinal, getNamedShiftOrdinal } from "./storeClosedMode";

export const UNAVAILABLE_REASON_DEFAULT = "no disponible este turno";

// Si el item quedó marcado como no disponible en un turno anterior al que
// está corriendo ahora, se considera repuesto automáticamente: lo normal es
// reponer antes del próximo turno, así que el badge no debe sobrevivir a un
// cambio de turno sin que alguien lo revierta a mano.
//
// Para marcar un item, agregar en menu.js:
//   unavailableSince: "2026-07-16"   (fecha en que se marcó, hoy)
//   unavailableShift: "mediodia"     ("mediodia" o "noche", el turno en que se marcó)
function isStillWithinMarkedShift(item) {
  const since = item?.unavailableSince;
  const shiftName = item?.unavailableShift;
  if (!since || !shiftName) return true; // sin datos, no se puede auto-reponer

  const markedShift = getNamedShiftOrdinal(since, shiftName);
  if (markedShift == null) return true;

  return markedShift >= getShiftOrdinal();
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
