import { useSyncExternalStore } from "react";

export const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";
export const STORE_OPEN_DAYS_TEXT = "Vie a Dom";
export const STORE_OPEN_HOURS_TEXT = "20:00 a 00:00";
export const STORE_SCHEDULE_TEXT = `${STORE_OPEN_HOURS_TEXT} (${STORE_OPEN_DAYS_TEXT})`;
export const FRIDAY_TRIPLE_PROMO_DATE_KEY = "2026-03-27";
export const FRIDAY_TRIPLE_PROMO_PREVIEW_START_MINUTES = 23 * 60 + 45;
export const FRIDAY_TRIPLE_PROMO_OPEN_MINUTES = 20 * 60;
export const FRIDAY_TRIPLE_PROMO_END_MINUTES = 15;
export const FRIDAY_TRIPLE_PROMO_OFFER_ID = "friday_triple_same_as_double";
export const FRIDAY_TRIPLE_PROMO_BADGE_TEXT = "TRIPLE = DOBLE";
const MANUAL_STORE_STATUS_DATE = null;
export const STORE_STATUS_IDS = {
  CLOSED_THURSDAY: "closedThursday",
  FRIDAY_PREOPEN_PROMO: "fridayPreOpenPromo",
  FRIDAY_OPEN_PROMO: "fridayOpenPromo",
  PROMO_INACTIVE: "promoInactive",
};

const OPEN_DAYS = new Set([0, 5, 6]);
const OPEN_MINUTES = 20 * 60;
const CLOSE_MINUTES = 24 * 60;
const WEEKDAY_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
const FRIDAY_TRIPLE_PROMO_PREVIEW_DATE_KEY = shiftDateKey(
  FRIDAY_TRIPLE_PROMO_DATE_KEY,
  -1,
);
const FRIDAY_TRIPLE_PROMO_END_DATE_KEY = shiftDateKey(
  FRIDAY_TRIPLE_PROMO_DATE_KEY,
  1,
);

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

function shiftDateKey(dateKey, days) {
  const anchor = new Date(`${dateKey}T00:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return anchor.toISOString().slice(0, 10);
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

function buildStatusState({
  stateId = STORE_STATUS_IDS.PROMO_INACTIVE,
  isOpenNow = false,
  isClosed = true,
  isBeforeOpening = false,
  showBanner = true,
  showInlineNotice = true,
  statusTone = "closed",
  bannerTitle = "",
  bannerSubtitle = "",
  inlineTitle = "",
  inlineSubtext = "",
  reopenText = "",
  closedActionLabel = "Cerrado hoy",
  closedToastText = "",
  scheduleText = STORE_SCHEDULE_TEXT,
  canPreviewMenu = false,
  isTriplePromoVisible = false,
  isTriplePromoLive = false,
  isTriplePromoPricingActive = false,
  promoHeroKicker = "",
  promoHeroTitle = "",
  promoHeroSubtitle = "",
  promoHeroFootnote = "",
  promoHeroCtaLabel = "",
  promoHeroTargetId = "bacon",
}) {
  return {
    stateId,
    isOpenNow,
    isClosed,
    isBeforeOpening,
    showBanner,
    showInlineNotice,
    statusTone,
    bannerTitle,
    bannerSubtitle,
    inlineTitle,
    inlineSubtext,
    reopenText,
    closedActionLabel,
    closedToastText,
    scheduleText,
    canPreviewMenu,
    isTriplePromoVisible,
    isTriplePromoLive,
    isTriplePromoPricingActive,
    showPromoHero: isTriplePromoVisible,
    promoHeroKicker,
    promoHeroTitle,
    promoHeroSubtitle,
    promoHeroFootnote,
    promoHeroCtaLabel,
    promoHeroTargetId,
  };
}

function buildClosedState({
  stateId = STORE_STATUS_IDS.PROMO_INACTIVE,
  bannerTitle,
  bannerSubtitle,
  reopenText,
  inlineTitle,
  inlineSubtext,
  statusTone = "closed",
  closedActionLabel = "Cerrado hoy",
  closedToastText = "",
  scheduleText = STORE_SCHEDULE_TEXT,
  canPreviewMenu = false,
  isBeforeOpening = false,
  isTriplePromoVisible = false,
  isTriplePromoLive = false,
  isTriplePromoPricingActive = false,
  promoHeroKicker = "",
  promoHeroTitle = "",
  promoHeroSubtitle = "",
  promoHeroFootnote = "",
  promoHeroCtaLabel = "",
}) {
  return buildStatusState({
    stateId,
    isOpenNow: false,
    isClosed: true,
    isBeforeOpening,
    showBanner: true,
    showInlineNotice: !isTriplePromoVisible,
    statusTone,
    bannerTitle,
    bannerSubtitle,
    inlineTitle,
    inlineSubtext,
    reopenText,
    closedActionLabel,
    closedToastText: closedToastText || `${closedActionLabel} \u00b7 ${reopenText}`,
    scheduleText,
    canPreviewMenu,
    isTriplePromoVisible,
    isTriplePromoLive,
    isTriplePromoPricingActive,
    promoHeroKicker,
    promoHeroTitle,
    promoHeroSubtitle,
    promoHeroFootnote,
    promoHeroCtaLabel,
  });
}

function buildOpenState({
  stateId = STORE_STATUS_IDS.PROMO_INACTIVE,
  bannerTitle = "YA ESTAMOS ABIERTOS",
  bannerSubtitle = "Tomamos pedidos hasta las 00:00",
  reopenText = "Abiertos hasta las 00:00",
  statusTone = "open",
  scheduleText = STORE_SCHEDULE_TEXT,
  isTriplePromoVisible = false,
  isTriplePromoLive = false,
  isTriplePromoPricingActive = false,
  promoHeroKicker = "",
  promoHeroTitle = "",
  promoHeroSubtitle = "",
  promoHeroFootnote = "",
  promoHeroCtaLabel = "",
}) {
  return buildStatusState({
    stateId,
    isOpenNow: true,
    isClosed: false,
    isBeforeOpening: false,
    showBanner: true,
    showInlineNotice: false,
    statusTone,
    bannerTitle,
    bannerSubtitle,
    inlineTitle: "",
    inlineSubtext: "",
    reopenText,
    closedActionLabel: "",
    closedToastText: "",
    scheduleText,
    canPreviewMenu: true,
    isTriplePromoVisible,
    isTriplePromoLive,
    isTriplePromoPricingActive,
    promoHeroKicker,
    promoHeroTitle,
    promoHeroSubtitle,
    promoHeroFootnote,
    promoHeroCtaLabel,
  });
}

function getFridayPromoStatus(parts) {
  if (parts.dateKey === FRIDAY_TRIPLE_PROMO_DATE_KEY) {
    return buildOpenState({
      stateId: STORE_STATUS_IDS.FRIDAY_OPEN_PROMO,
      bannerTitle: "Triples al precio de dobles",
      bannerSubtitle: "Solo hoy viernes",
      reopenText: "",
      statusTone: "promoLive",
      scheduleText: STORE_SCHEDULE_TEXT,
      isTriplePromoVisible: true,
      isTriplePromoLive: true,
      isTriplePromoPricingActive: true,
      promoHeroKicker: "",
      promoHeroTitle: "TRIPLES AL PRECIO DE DOBLES",
      promoHeroSubtitle: "Solo hoy",
      promoHeroFootnote: "",
      promoHeroCtaLabel: "Pedi ahora",
    });
  }

  return null;
}

export function getStoreStatus(date = null) {
  const resolvedDate = date instanceof Date ? date : getNowDate();
  const parts = getArgentinaTimeParts(resolvedDate);
  const promoStatus = getFridayPromoStatus(parts);

  if (promoStatus) {
    return {
      ...parts,
      ...promoStatus,
    };
  }

  const isOpenDay = OPEN_DAYS.has(parts.day);
  const isBeforeOpening = isOpenDay && parts.minutes < OPEN_MINUTES;
  const isOpenNow =
    isOpenDay && parts.minutes >= OPEN_MINUTES && parts.minutes < CLOSE_MINUTES;

  if (isOpenNow) {
    return {
      ...parts,
      ...buildOpenState(),
    };
  }

  if (parts.day === 3) {
    return {
      ...parts,
      ...buildClosedState({
        bannerTitle: "HOY Y MANANA NO ABRIMOS",
        bannerSubtitle: "Volvemos viernes 20:00",
        reopenText: "Volvemos viernes 20:00",
        inlineTitle: "Hoy y manana no abrimos",
        inlineSubtext: "Volvemos viernes 20:00",
      }),
    };
  }

  if (parts.day === 4) {
    return {
      ...parts,
      ...buildClosedState({
        stateId: STORE_STATUS_IDS.CLOSED_THURSDAY,
        bannerTitle: "HOY NO ABRIMOS",
        bannerSubtitle: "Volvemos manana 20:00",
        reopenText: "Volvemos manana 20:00",
        inlineTitle: "Hoy no abrimos",
        inlineSubtext: "Volvemos manana 20:00",
      }),
    };
  }

  if (isBeforeOpening) {
    return {
      ...parts,
      ...buildClosedState({
        bannerTitle: "HOY ABRIMOS DESDE LAS 20:00",
        bannerSubtitle: "Tomamos pedidos desde las 20:00",
        reopenText: "Abrimos hoy 20:00",
        inlineTitle: "Hoy abrimos desde las 20:00",
        inlineSubtext: "Tomamos pedidos desde las 20:00",
        statusTone: "soon",
        closedActionLabel: "Cerrado ahora",
        closedToastText: "Cerrado ahora \u00b7 Abrimos hoy 20:00",
        isBeforeOpening: true,
      }),
    };
  }

  return {
    ...parts,
    ...buildClosedState({
      bannerTitle: "HOY NO ABRIMOS",
      bannerSubtitle: "Volvemos viernes 20:00",
      reopenText: "Volvemos viernes 20:00",
      inlineTitle: "Hoy no abrimos",
      inlineSubtext: "Volvemos viernes 20:00",
    }),
  };
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
