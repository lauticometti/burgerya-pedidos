import { getArgentinaTimeParts } from "./storeClosedMode";

export const CHEDDAR_BLACKOUT_END_DATE_KEY = "2026-05-01";
export const CHEDDAR_BLACKOUT_REASON = "Vuelve el sábado";

const BLOCKED_IDS = new Set([
  "cheddar_liq",
  "papas_bacon",
  "porcion_grande_cheddar",
  "porcion_grande_cheddar_bacon",
  "dip_cheddar",
]);

export function isCheddarBlackoutActive(parts = getArgentinaTimeParts()) {
  return parts.dateKey <= CHEDDAR_BLACKOUT_END_DATE_KEY;
}

export function applyCheddarBlackout(items) {
  if (!isCheddarBlackoutActive()) return items;
  return items.map((item) =>
    BLOCKED_IDS.has(item.id)
      ? { ...item, isAvailable: 0, unavailableReason: CHEDDAR_BLACKOUT_REASON }
      : item,
  );
}
