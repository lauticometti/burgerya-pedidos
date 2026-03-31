import { getArgentinaTimeParts } from "./storeClosedMode";

const SLOT_INTERVAL = 30; // minutos
const SLOT_LEAD = 30;     // mínimo de anticipación
const LAST_SLOT = 23 * 60 + 30; // 23:30

export function minutesToHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getAvailableSlotsMin30(date = null) {
  const { minutes } = getArgentinaTimeParts(date);
  const earliest = minutes + SLOT_LEAD;
  const firstSlot = Math.ceil(earliest / SLOT_INTERVAL) * SLOT_INTERVAL;

  const slots = [];
  for (let slot = firstSlot; slot <= LAST_SLOT; slot += SLOT_INTERVAL) {
    slots.push(slot);
  }
  return slots;
}
