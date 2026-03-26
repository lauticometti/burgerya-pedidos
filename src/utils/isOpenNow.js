import {
  STORE_OPEN_DAYS_TEXT,
  STORE_OPEN_HOURS_TEXT,
  STORE_SCHEDULE_TEXT,
  getStoreStatus,
} from "./storeClosedMode";

export { STORE_OPEN_DAYS_TEXT, STORE_OPEN_HOURS_TEXT, STORE_SCHEDULE_TEXT };

export function isOpenNow(date = new Date()) {
  return getStoreStatus(date).isOpenNow;
}

export function nextOpenText(date = new Date()) {
  const status = getStoreStatus(date);
  return status.isOpenNow ? "Ya estamos abiertos" : status.reopenText;
}
