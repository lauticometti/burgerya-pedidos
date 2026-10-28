import { getArgentinaTimeParts } from "../../utils/storeClosedMode";

// Tema de Halloween (solo estetica: no cambia precios, productos ni stock).
// Se apaga SOLO despues del ultimo dia (hora Argentina), aunque nadie toque nada.
// Para apagarlo ya mismo: HALLOWEEN_ENABLED = false.
export const HALLOWEEN_ENABLED = true;
export const HALLOWEEN_LAST_DAY = "2026-11-01"; // inclusive

export function isHalloweenActive(parts = getArgentinaTimeParts()) {
  return HALLOWEEN_ENABLED && parts.dateKey <= HALLOWEEN_LAST_DAY;
}
