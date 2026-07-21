import { useSyncExternalStore } from "react";
import { getDailyFeature } from "./dailyFeaturePromo";

export const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";
export const FRIDAY_TRIPLE_PROMO_DATE_KEY = "2026-03-27";
export const FRIDAY_TRIPLE_PROMO_OFFER_ID = "friday_triple_same_as_double";
export const FRIDAY_TRIPLE_PROMO_BADGE_TEXT = "TRIPLE = DOBLE";
export const DAILY_FEATURE_PROMO_OFFER_ID = "daily_feature";

const MANUAL_STORE_STATUS_DATE = null;
export const FORCE_OPEN = false; // override manual: forzar apertura fuera de horario
export const FORCE_CLOSED = false; // override manual: cierre manual, ignora el horario. Poner en true para cerrar la web entera.

// Mensaje de aviso especial cuando cerramos antes por falta de stock.
// null = mensaje genérico "Estamos cerrados. Abrimos...".
export const SOLD_OUT_NOTICE = null;

// Feriados nacionales Argentina 2026 (formato YYYY-MM-DD, hora Argentina)
const FERIADOS_2026 = new Set([
  "2026-01-01", // Año Nuevo
  "2026-02-16", // Carnaval
  "2026-02-17", // Carnaval
  "2026-03-24", // Día de la Memoria
  "2026-04-02", // Malvinas
  "2026-04-03", // Viernes Santo
  "2026-05-01", // Día del Trabajador
  "2026-05-25", // Revolución de Mayo
  "2026-06-15", // Paso a la Inmortalidad de Güemes
  "2026-06-20", // Paso a la Inmortalidad de Belgrano
  "2026-07-09", // Independencia
  "2026-08-17", // Paso a la Inmortalidad de San Martín
  "2026-10-12", // Día del Respeto a la Diversidad Cultural
  "2026-11-23", // Día de la Soberanía Nacional
  "2026-12-08", // Inmaculada Concepción de María
  "2026-12-25", // Navidad
]);
const WEEKDAY_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const argentinaDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ARGENTINA_TIME_ZONE,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const subscribers = new Set();
let tickTimeoutId = null;
let hasBrowserListeners = false;
let currentSnapshot = null;
let currentSnapshotKey = "";

function getNowDate() {
  return MANUAL_STORE_STATUS_DATE
    ? new Date(MANUAL_STORE_STATUS_DATE)
    : new Date();
}

function emitChange() {
  subscribers.forEach((listener) => listener());
}

function getSnapshotKeyFromStatus(status) {
  return `${status.dateKey}:${status.minutes}`;
}

function refreshSnapshot(date = null) {
  const nextSnapshot = getStoreStatus(date);
  const nextKey = getSnapshotKeyFromStatus(nextSnapshot);

  if (currentSnapshot && currentSnapshotKey === nextKey) {
    return false;
  }

  currentSnapshot = nextSnapshot;
  currentSnapshotKey = nextKey;
  return true;
}

function syncSnapshotAndEmit(date = null) {
  if (refreshSnapshot(date)) {
    emitChange();
  }
}

function handleVisibilityChange() {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "visible") {
    syncSnapshotAndEmit();
  }
}

function startClock() {
  if (typeof window === "undefined" || tickTimeoutId != null) return;

  const scheduleNextTick = () => {
    const now = Date.now();
    const msUntilNextMinute = 60_000 - (now % 60_000);
    tickTimeoutId = window.setTimeout(() => {
      tickTimeoutId = null;
      syncSnapshotAndEmit();
      scheduleNextTick();
    }, msUntilNextMinute + 50);
  };

  scheduleNextTick();
}

function stopClock() {
  if (typeof window !== "undefined" && tickTimeoutId != null) {
    window.clearTimeout(tickTimeoutId);
  }
  tickTimeoutId = null;
}

function addBrowserListeners() {
  if (typeof window === "undefined" || hasBrowserListeners) return;

  window.addEventListener("focus", syncSnapshotAndEmit);
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
  hasBrowserListeners = true;
}

function removeBrowserListeners() {
  if (typeof window === "undefined" || !hasBrowserListeners) return;

  window.removeEventListener("focus", syncSnapshotAndEmit);
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
  hasBrowserListeners = false;
}

function subscribe(listener) {
  subscribers.add(listener);

  if (subscribers.size === 1) {
    refreshSnapshot();
    addBrowserListeners();
    startClock();
  }

  return () => {
    subscribers.delete(listener);

    if (subscribers.size === 0) {
      stopClock();
      removeBrowserListeners();
    }
  };
}

export function getArgentinaTimeParts(date = null) {
  const resolvedDate = date instanceof Date ? date : getNowDate();
  const parts = argentinaDateTimeFormatter
    .formatToParts(resolvedDate)
    .reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});
  const day = WEEKDAY_INDEX[parts.weekday];
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);

  return {
    day,
    dayOfMonth: Number(parts.day),
    month: Number(parts.month),
    year: Number(parts.year),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour,
    minute,
    minutes: hour * 60 + minute,
  };
}

function buildStatusState(overrides = {}) {
  return {
    stateId: "alwaysOpen",
    isOpenNow: true,
    isClosed: false,
    isBeforeOpening: false,
    showBanner: false,
    showInlineNotice: false,
    statusTone: "open",
    bannerTitle: "",
    bannerSubtitle: "",
    inlineTitle: "",
    inlineSubtext: "",
    reopenText: "",
    closedActionLabel: "",
    closedToastText: "",
    canPreviewMenu: true,
    isTriplePromoVisible: false,
    isTriplePromoLive: false,
    isTriplePromoPricingActive: false,
    isDailyFeaturePromoActive: false,
    dailyFeatureBurgerId: null,
    dailyFeatureWeekdayLabel: "",
    dailyFeatureEyebrow: null,
    showPromoHero: false,
    promoHeroKicker: "",
    promoHeroTitle: "",
    promoHeroSubtitle: "",
    promoHeroFootnote: "",
    promoHeroCtaLabel: "",
    promoHeroTargetId: "bacon",
    ...overrides,
  };
}

function getFridayPromoStatus(parts) {
  if (parts.dateKey !== FRIDAY_TRIPLE_PROMO_DATE_KEY) {
    return null;
  }

  return buildStatusState({
    stateId: "fridayOpenPromo",
    showBanner: true,
    statusTone: "promoLive",
    bannerTitle: "Triples al precio de dobles",
    bannerSubtitle: "Solo hoy viernes",
    isTriplePromoVisible: true,
    isTriplePromoLive: true,
    isTriplePromoPricingActive: true,
    showPromoHero: true,
    promoHeroTitle: "TRIPLES AL PRECIO DE DOBLES",
    promoHeroSubtitle: "Solo hoy",
    promoHeroCtaLabel: "Pedi ahora",
  });
}

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

// Turnos de apertura: cada entrada define días habilitados y rango horario (en minutos desde medianoche)
// day indices: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
const SHIFTS = [
  {
    days: new Set([0, 1, 2, 3, 4, 5, 6]),
    open: 20 * 60,
    close: 24 * 60,
    label: "20:00",
  }, // Todos los días, solo turno noche (sin mediodía)
];

function isFeriado(dateKey) {
  return FERIADOS_2026.has(dateKey);
}

const FERIADO_SHIFTS = [
  { open: 20 * 60, close: 24 * 60, label: "20:00" },
];

// Excepciones puntuales de horario para una fecha específica (formato
// YYYY-MM-DD, hora Argentina). Reemplazan por completo los turnos de ese
// día sin afectar el horario habitual de otros días con el mismo nombre.
const SPECIAL_DAY_SHIFTS = {
  // Horario especial sábado noche: web abre 18:30 (en vez de 19:30) y cocina
  // arranca 19:00 (en vez de 20:00). El resto del día (mediodía) queda igual.
  "2026-07-11": [
    { open: 11 * 60 + 30, close: 15 * 60, label: "11:30" }, // mediodía habitual
    { open: 18 * 60 + 30, close: 24 * 60, label: "18:30" }, // noche especial
  ],
  // Cierre manual del mediodía de hoy (sin turno de mediodía). La noche
  // queda con su horario habitual (19:30-24:00) y abre sola.
  "2026-07-18": [
    { open: 19 * 60 + 30, close: 24 * 60, label: "19:30" }, // noche habitual
  ],
  // Excepción de esta noche: abre 21hs en vez del habitual 19:30 (pedidos y
  // cocina juntos, sin ventana de pre-pedido), cierra 00hs. Ya comunicado.
  "2026-07-19": [
    {
      open: 21 * 60,
      close: 24 * 60,
      label: "21:00",
      cookingStart: 21 * 60,
    },
  ],
  // Día del Amigo: hoy lunes no abrimos al mediodía (sin turno habitual de
  // 12-15hs), solo noche 20:00-00:00.
  "2026-07-20": [
    {
      open: 19 * 60 + 30,
      close: 24 * 60,
      label: "19:30",
      cookingStart: 20 * 60,
    },
  ],
};

function getSpecialShifts(dateKey) {
  return SPECIAL_DAY_SHIFTS[dateKey] ?? null;
}

function getShiftsForDay(day, dateKey) {
  const special = getSpecialShifts(dateKey);
  if (special) return special;
  if (isFeriado(dateKey)) return FERIADO_SHIFTS;
  return SHIFTS.filter((s) => s.days.has(day));
}

function getActiveShift(day, minutes, dateKey = "") {
  const shifts = getShiftsForDay(day, dateKey);
  return shifts.find((s) => minutes >= s.open && minutes < s.close) ?? null;
}

// Número ordinal y creciente del turno "actual": cuenta cuántos turnos
// (mediodía/noche, contando también los especiales) ya CERRARON desde una
// fecha ancla fija. Solo avanza cuando un turno termina (no cuando arranca),
// así que un item marcado no disponible durante un turno sigue así mientras
// ese turno esté corriendo, y se repone apenas cierra (no recién cuando abre
// el siguiente). Se usa para saber si ya "cambió de turno" respecto a un
// momento anterior (ver isItemUnavailable en utils/availability.js), sin
// depender de horas exactas.
const SHIFT_EPOCH_MS = Date.UTC(2026, 0, 1);

// Turnos máximos por día (para que el ordinal sea estrictamente creciente
// entre días distintos, independientemente de cuántos turnos tenga cada uno).
const MAX_SHIFTS_PER_DAY = 4;

function getDaysSinceEpoch(parts) {
  return Math.floor(
    (Date.UTC(parts.year, parts.month - 1, parts.dayOfMonth) - SHIFT_EPOCH_MS) /
      86_400_000,
  );
}

export function getShiftOrdinal(date = null) {
  const resolvedDate = date instanceof Date ? date : getNowDate();
  const parts = getArgentinaTimeParts(resolvedDate);
  const daysSinceEpoch = getDaysSinceEpoch(parts);

  const shiftsToday = [...getShiftsForDay(parts.day, parts.dateKey)].sort(
    (a, b) => a.open - b.open,
  );
  // Cuántos turnos de hoy ya cerraron (>= su hora de cierre).
  const shiftsClosedToday = shiftsToday.filter(
    (s) => parts.minutes >= s.close,
  ).length;

  return daysSinceEpoch * MAX_SHIFTS_PER_DAY + shiftsClosedToday;
}

// Ordinal del turno "mediodia" o "noche" de una fecha dada (formato
// "YYYY-MM-DD"), para poder registrar a mano en qué turno se marcó un item
// como no disponible sin tener que calcular el número manualmente. Busca,
// entre los turnos de ese día, el que abre más cerca de mediodía (12:00) o
// el que abre después de las 18:00, respectivamente.
export function getNamedShiftOrdinal(dateKey, shiftName) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const daysSinceEpoch = getDaysSinceEpoch({ year, month, dayOfMonth: day });

  // El weekday real solo importa para los turnos habituales (SHIFTS); los
  // especiales/feriados se resuelven por dateKey sin mirar el día.
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  const shiftsThatDay = [...getShiftsForDay(weekday, dateKey)].sort(
    (a, b) => a.open - b.open,
  );

  const target =
    shiftName === "noche"
      ? shiftsThatDay
          .filter((s) => s.open >= 18 * 60)
          .sort((a, b) => a.open - b.open)[0]
      : shiftsThatDay
          .filter((s) => s.open < 18 * 60)
          .sort(
            (a, b) => Math.abs(a.open - 12 * 60) - Math.abs(b.open - 12 * 60),
          )[0];

  if (!target) return null;

  // Turnos que ya cerraron antes que este (sin contar al propio target):
  // el item sigue no disponible mientras el turno marcado no haya cerrado.
  const shiftsClosedBefore = shiftsThatDay.filter(
    (s) => s.close < target.close,
  ).length;
  return daysSinceEpoch * MAX_SHIFTS_PER_DAY + shiftsClosedBefore;
}

function getNextShift(day, minutes, dateKey = "") {
  // Busca el próximo turno dentro de los próximos 7 días (incluyendo hoy)
  for (let offset = 0; offset <= 7; offset++) {
    const checkDay = (day + offset) % 7;
    let shiftsToday;
    if (offset === 0) {
      shiftsToday = [...getShiftsForDay(checkDay, dateKey)].sort(
        (a, b) => a.open - b.open,
      );
    } else {
      shiftsToday = SHIFTS.filter((s) => s.days.has(checkDay)).sort(
        (a, b) => a.open - b.open,
      );
    }
    for (const shift of shiftsToday) {
      if (offset > 0 || minutes < shift.open) {
        return { shift, dayOffset: offset };
      }
    }
  }
  return null;
}

function getNextOpenText(parts) {
  if (FORCE_CLOSED) return "Volvemos pronto";

  const { day, minutes, dateKey } = parts;
  const next = getNextShift(day, minutes, dateKey);
  if (!next) return "Volvemos pronto";

  const { shift, dayOffset } = next;
  if (dayOffset === 0) return `Podés pedir desde las ${shift.label}`;
  if (dayOffset === 1) return `Podés pedir mañana desde las ${shift.label}`;
  return `Podés pedir el ${DAY_NAMES[(day + dayOffset) % 7]} desde las ${shift.label}`;
}

// Al abrir, hay una ventana de "pre-pedido" antes de que arranque la cocina
// ("ya podés hacer tu pedido, empezamos a cocinar a las X").
const PREORDER_WINDOW_MINUTES = 30;

function formatMinutesLabel(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Determina si el turno activo está en fase de pre-pedido (recién abrió,
// cocina todavía no arrancó) o de cocina (ya se puede cocinar y entregar).
function getRelevantShiftInfo(day, minutes, dateKey = "") {
  const shifts = getShiftsForDay(day, dateKey);

  for (const shift of shifts) {
    // TEMP ARGENTINA MATCH DAY: algunos turnos especiales definen su propio cookingStart
    // (ver SPECIAL_DAY_SHIFTS) en vez de usar PREORDER_WINDOW_MINUTES. Revertir: quitar `cookingStart` del shift.
    const cookingStart =
      shift.cookingStart ?? shift.open + PREORDER_WINDOW_MINUTES;
    if (minutes >= shift.open && minutes < cookingStart) {
      return { phase: "preorder", shift, cookingStart };
    }
    if (minutes >= cookingStart && minutes < shift.close) {
      return { phase: "cooking", shift, cookingStart };
    }
  }
  return null;
}

// Día del Amigo: prefijo breve en el banner de estado, sin tocar la lógica
// de horarios/fases. Solo activo el 2026-07-20; quitar este bloque (o la
// condición de dateKey) para revertir.
const FRIENDS_DAY_DATE_KEY = "2026-07-20";
const FRIENDS_DAY_BANNER_PREFIX = "DÍA DEL AMIGO 🍔 · ";

function applyFriendsDayPrefix(bannerState, dateKey) {
  if (dateKey !== FRIENDS_DAY_DATE_KEY) return bannerState;
  return {
    ...bannerState,
    message: `${FRIENDS_DAY_BANNER_PREFIX}${bannerState.message}`,
  };
}

function getBannerState(parts) {
  const { day, minutes, dateKey } = parts;

  if (FORCE_CLOSED) {
    return applyFriendsDayPrefix(
      {
        type: "closed",
        message: `Estamos cerrados. ${getNextOpenText(parts)}.`,
      },
      dateKey,
    );
  }

  const info = getRelevantShiftInfo(day, minutes, dateKey);

  if (info?.phase === "preorder") {
    const cookingLabel = formatMinutesLabel(info.cookingStart);
    return applyFriendsDayPrefix(
      {
        type: "preorder",
        message: `Ya podés hacer tu pedido. Empezamos a cocinar a las ${cookingLabel}.`,
      },
      dateKey,
    );
  }

  if (info?.phase === "cooking") {
    // TEMP ARGENTINA MATCH DAY: si el shift trae cookingMessage, se usa tal cual
    // (sin horario de cierre). Revertir: quitar `cookingMessage` del shift.
    if (info.shift.cookingMessage) {
      return applyFriendsDayPrefix(
        { type: "cooking", message: info.shift.cookingMessage },
        dateKey,
      );
    }
    const closeLabel = formatMinutesLabel(info.shift.close);
    return applyFriendsDayPrefix(
      {
        type: "cooking",
        message: `Estamos cocinando. Podés pedir hasta las ${closeLabel}.`,
      },
      dateKey,
    );
  }

  if (SOLD_OUT_NOTICE) {
    return applyFriendsDayPrefix(
      { type: "closed", message: SOLD_OUT_NOTICE },
      dateKey,
    );
  }

  return applyFriendsDayPrefix(
    {
      type: "closed",
      message: `Estamos cerrados. ${getNextOpenText(parts)}.`,
    },
    dateKey,
  );
}

export function getStoreStatus(date = null) {
  const resolvedDate = date instanceof Date ? date : getNowDate();
  const parts = getArgentinaTimeParts(resolvedDate);
  const promoStatus = getFridayPromoStatus(parts);
  const dailyFeature = getDailyFeature(resolvedDate);
  const nextOpenText = getNextOpenText(parts);
  const isOpenNow =
    !FORCE_CLOSED &&
    (FORCE_OPEN ||
      getActiveShift(parts.day, parts.minutes, parts.dateKey) !== null);

  const baseStatus = promoStatus || buildStatusState();
  const closedOverrides = isOpenNow
    ? {}
    : {
        isOpenNow: false,
        isClosed: true,
        canPreviewMenu: true,
        statusTone: "closed",
        closedToastText: "El local está cerrado ahora",
        reopenText: nextOpenText,
      };

  const bannerState = getBannerState(parts);

  return {
    ...parts,
    ...baseStatus,
    ...closedOverrides,
    isDailyFeaturePromoActive:
      dailyFeature !== null && dailyFeature.prices !== null,
    dailyFeatureBurgerId: dailyFeature?.burgerId || null,
    dailyFeatureWeekdayLabel: dailyFeature?.weekdayLabel || "",
    dailyFeatureEyebrow: dailyFeature?.eyebrow || null,
    nextOpenText,
    bannerState,
    showClosedBanner: bannerState.type === "closed",
  };
}

const DAY_ABBR = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

// Versión compacta de formatMinutesLabel: sin minutos cuando caen en :00
// (ej. "12"), con minutos cuando no (ej. "12:30"). Mismos valores que usa
// el banner, solo cambia cómo se muestran acá para que quede corto.
function formatCompactMinutesLabel(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  if (m === 0) return String(h).padStart(2, "0");
  return formatMinutesLabel(minutes);
}

// Horario completo de hoy, para mostrar debajo del banner de estado.
// Reutiliza los mismos turnos (SHIFTS/SPECIAL_DAY_SHIFTS/feriados) y los
// mismos valores (cookingStart, close) que usa el banner para sus
// mensajes de pre-pedido/cocina — así nunca queda desincronizado.
export function getTodaySchedule(date = null) {
  const parts = getArgentinaTimeParts(
    date instanceof Date ? date : getNowDate(),
  );
  const shifts = getShiftsForDay(parts.day, parts.dateKey);
  const dayLabel = DAY_ABBR[parts.day];

  if (shifts.length === 0) {
    return { dayLabel, ranges: [], isClosed: true };
  }

  const ranges = shifts.map((shift) => {
    const cookingStart =
      shift.cookingStart ?? shift.open + PREORDER_WINDOW_MINUTES;
    return `${formatCompactMinutesLabel(cookingStart)}–${formatCompactMinutesLabel(shift.close)}`;
  });

  return { dayLabel, ranges, isClosed: false };
}

function getSnapshot() {
  if (!currentSnapshot) {
    refreshSnapshot();
  }

  return currentSnapshot;
}

export function useStoreStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
