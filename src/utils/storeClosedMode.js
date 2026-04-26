import { useSyncExternalStore } from "react";

export const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";
export const FRIDAY_TRIPLE_PROMO_DATE_KEY = "2026-03-27";
export const FRIDAY_TRIPLE_PROMO_OFFER_ID = "friday_triple_same_as_double";
export const FRIDAY_TRIPLE_PROMO_BADGE_TEXT = "TRIPLE = DOBLE";
export const SUNDAY_FEATURE_PROMO_OFFER_ID = "sunday_lautiboom_feature";

const MANUAL_STORE_STATUS_DATE = null;
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
    isSundayFeaturePromoActive: false,
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

export function getStoreStatus(date = null) {
  const resolvedDate = date instanceof Date ? date : getNowDate();
  const parts = getArgentinaTimeParts(resolvedDate);
  const promoStatus = getFridayPromoStatus(parts);
  const isSundayFeaturePromoActive = parts.day === WEEKDAY_INDEX.Sun;

  return {
    ...parts,
    ...(promoStatus || buildStatusState()),
    isSundayFeaturePromoActive,
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
