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

// Para cortes puntuales con hora exacta (ej: "sin cebolla hasta las 22:10"),
// cuando el turno completo es demasiado largo. Agregar en menu.js:
//   unavailableUntil: "2026-07-16T22:10:00-03:00"   (fecha+hora exacta, con
//                                                     el offset de Buenos
//                                                     Aires: -03:00)
// Para un aviso (burger.notice) que también deba autoborrarse a esa hora:
//   noticeUntil: "2026-07-16T22:10:00-03:00"
function isBeforeExactDeadline(until) {
  const deadline = Date.parse(until);
  if (Number.isNaN(deadline)) return true; // fecha mal escrita, no se puede auto-reponer
  return Date.now() < deadline;
}

export function isItemUnavailable(item) {
  const flag = item?.isAvailable;
  const flaggedUnavailable = flag === 0 || flag === false;
  if (!flaggedUnavailable) return false;
  if (item?.unavailableUntil) return isBeforeExactDeadline(item.unavailableUntil);
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
  if (item?.noticeUntil) {
    return isBeforeExactDeadline(item.noticeUntil) ? item.notice : null;
  }
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

// Ingredientes que se quitan sí o sí (sin stock), con vencimiento opcional:
//   forcedRemovals: [{ id: "pickles", label: "Pepinos agridulces" }],
//   forcedRemovalsUntil: "2026-11-10T04:00:00-03:00"
// Pasada esa hora se ignoran solos y el ingrediente vuelve a ser opcional.
export function getEffectiveForcedRemovals(item) {
  const removals = item?.forcedRemovals || [];
  if (!removals.length) return removals;
  if (item?.forcedRemovalsUntil && !isBeforeExactDeadline(item.forcedRemovalsUntil)) return [];
  return removals;
}
