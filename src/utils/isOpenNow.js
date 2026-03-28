import { getStoreStatus } from "./storeClosedMode";

export function isOpenNow(date = new Date()) {
  return getStoreStatus(date).isOpenNow;
}

export function nextOpenText(date = new Date()) {
  const status = getStoreStatus(date);
  return status.isOpenNow ? "Disponible ahora" : "";
}
