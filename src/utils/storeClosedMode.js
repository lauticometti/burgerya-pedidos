import { useSyncExternalStore } from "react";

export const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";
export const STORE_OPEN_DAYS_TEXT = "Vie a Dom";
export const STORE_OPEN_HOURS_TEXT = "20:00 a 00:00";
export const STORE_SCHEDULE_TEXT = `${STORE_OPEN_HOURS_TEXT} (${STORE_OPEN_DAYS_TEXT})`;

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

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ARGENTINA_TIME_ZONE,
  weekday: "short",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ARGENTINA_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const subscribers = new Set();
let tickTimeoutId = null;
let hasBrowserListeners = false;
let currentSnapshot = null;
let currentSnapshotKey = "";

function emitChange() {
  subscribers.forEach((listener) => listener());
}

function getSnapshotKeyFromStatus(status) {
  return `${status.day}:${status.minutes}`;
}

function refreshSnapshot(date = new Date()) {
  const nextSnapshot = getStoreStatus(date);
  const nextKey = getSnapshotKeyFromStatus(nextSnapshot);

  if (currentSnapshot && currentSnapshotKey === nextKey) {
    return false;
  }

  currentSnapshot = nextSnapshot;
  currentSnapshotKey = nextKey;
  return true;
}

function syncSnapshotAndEmit(date = new Date()) {
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

export function getArgentinaTimeParts(date = new Date()) {
  const weekdayKey = weekdayFormatter.format(date);
  const day = WEEKDAY_INDEX[weekdayKey];
  const [hourPart, minutePart] = timeFormatter.format(date).split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  return {
    day,
    hour,
    minute,
    minutes: hour * 60 + minute,
  };
}

function buildClosedState({
  bannerTitle,
  bannerSubtitle,
  reopenText,
  inlineTitle,
  inlineSubtext,
  statusTone = "closed",
  closedActionLabel = "Cerrado hoy",
  closedToastPrefix = "Cerrado hoy",
}) {
  return {
    isOpenNow: false,
    isClosed: true,
    showBanner: true,
    showInlineNotice: true,
    statusTone,
    bannerTitle,
    bannerSubtitle,
    inlineTitle,
    inlineSubtext,
    reopenText,
    closedActionLabel,
    closedToastText: `${closedToastPrefix} \u00b7 ${reopenText}`,
    scheduleText: STORE_SCHEDULE_TEXT,
  };
}

function buildOpenState() {
  return {
    isOpenNow: true,
    isClosed: false,
    showBanner: true,
    showInlineNotice: false,
    statusTone: "open",
    bannerTitle: "YA ESTAMOS ABIERTOS",
    bannerSubtitle: "Tomamos pedidos hasta las 00:00",
    inlineTitle: "",
    inlineSubtext: "",
    reopenText: "Abiertos hasta las 00:00",
    closedActionLabel: "",
    closedToastText: "",
    scheduleText: STORE_SCHEDULE_TEXT,
  };
}

export function getStoreStatus(date = new Date()) {
  const { day, minutes } = getArgentinaTimeParts(date);
  const isOpenDay = OPEN_DAYS.has(day);
  const isBeforeOpening = isOpenDay && minutes < OPEN_MINUTES;
  const isOpenNow = isOpenDay && minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;

  if (isOpenNow) {
    return {
      day,
      minutes,
      isBeforeOpening: false,
      ...buildOpenState(),
    };
  }

  if (day === 3) {
    return {
      day,
      minutes,
      isBeforeOpening: false,
      ...buildClosedState({
        bannerTitle: "HOY Y MA\u00d1ANA NO ABRIMOS",
        bannerSubtitle: "Volvemos viernes 20:00",
        reopenText: "Volvemos viernes 20:00",
        inlineTitle: "Hoy y ma\u00f1ana no abrimos",
        inlineSubtext: "Volvemos viernes 20:00",
      }),
    };
  }

  if (day === 4) {
    return {
      day,
      minutes,
      isBeforeOpening: false,
      ...buildClosedState({
        bannerTitle: "HOY NO ABRIMOS",
        bannerSubtitle: "Volvemos ma\u00f1ana 20:00",
        reopenText: "Volvemos ma\u00f1ana 20:00",
        inlineTitle: "Hoy no abrimos",
        inlineSubtext: "Volvemos ma\u00f1ana 20:00",
      }),
    };
  }

  if (isBeforeOpening) {
    return {
      day,
      minutes,
      isBeforeOpening: true,
      ...buildClosedState({
        bannerTitle: "HOY ABRIMOS DESDE LAS 20:00",
        bannerSubtitle: "Tomamos pedidos desde las 20:00",
        reopenText: "Abrimos hoy 20:00",
        inlineTitle: "Hoy abrimos desde las 20:00",
        inlineSubtext: "Tomamos pedidos desde las 20:00",
        statusTone: "soon",
        closedActionLabel: "Cerrado ahora",
        closedToastPrefix: "Cerrado ahora",
      }),
    };
  }

  return {
    day,
    minutes,
    isBeforeOpening: false,
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
