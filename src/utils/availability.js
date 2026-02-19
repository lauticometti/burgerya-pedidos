export const UNAVAILABLE_REASON_DEFAULT = "no disponible por hoy";

export function isItemUnavailable(item) {
  const flag = item?.isAvailable;
  return flag === 0 || flag === false;
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
