import { getShiftOrdinal, getNamedShiftOrdinal } from "./storeClosedMode";

export const UNAVAILABLE_REASON_DEFAULT = "no disponible este turno";

// Si algo quedó marcado (sin stock, o con un aviso tipo "Sin lechuga") en un
// turno anterior al que está corriendo ahora, se considera repuesto
// automáticamente: lo normal es reponer antes del próximo turno, así que el
// badge no debe sobrevivir a un cambio de turno sin que alguien lo revierta
// a mano.
//
// Para marcar un item sin stock, agregar en menu.js:
//   unavailableSince: "2026-07-16"   (fecha en que se marcó, hoy)
//   unavailableShift: "mediodia"     ("mediodia" o "noche", el turno en que se marcó)
//
// Para un aviso (burger.notice) que también deba autoborrarse, agregar:
//   noticeSince: "2026-07-16"
//   noticeShift: "noche"
function isStillWithinMarkedShift(since, shiftName) {
  if (!since || !shiftName) return true; // sin datos, no se puede auto-reponer

  const markedShift = getNamedShiftOrdinal(since, shiftName);
  if (markedShift == null) return true;

  return markedShift >= getShiftOrdinal();
}

export function isItemUnavailable(item) {
  const flag = item?.isAvailable;
  const flaggedUnavailable = flag === 0 || flag === false;
  if (!flaggedUnavailable) return false;
  return isStillWithinMarkedShift(item?.unavailableSince, item?.unavailableShift);
}

export function isItemAvailable(item) {
  return !isItemUnavailable(item);
}

export function getUnavailableReason(item) {
  return item?.unavailableReason || UNAVAILABLE_REASON_DEFAULT;
}

// Devuelve el texto del badge (burger.notice) solo si todavía está vigente:
// si se marcó con noticeSince/noticeShift y ya cambió de turno, se considera
// vencido y desaparece solo, sin que nadie tenga que sacarlo a mano.
export function getEffectiveNotice(item) {
  if (!item?.notice) return null;
  if (!isStillWithinMarkedShift(item?.noticeSince, item?.noticeShift)) return null;
  return item.notice;
}

export function withAvailabilityDefaults(items) {
  return items.map((item) => ({
    ...item,
    isAvailable: item.isAvailable ?? 1,
    unavailableReason: item.unavailableReason ?? UNAVAILABLE_REASON_DEFAULT,
  }));
}
