// Mié(3) a Dom(0) en JS: 0=Dom,1=Lun,...6=Sab
export const STORE_OPEN_DAYS_TEXT = "Mié a Dom";
export const STORE_OPEN_HOURS_TEXT = "19 a 00";
export const STORE_SCHEDULE_TEXT = `${STORE_OPEN_HOURS_TEXT} (${STORE_OPEN_DAYS_TEXT})`;

export function isOpenNow(date = new Date()) {
  const day = date.getDay(); // 0..6
  const openDays =
    day === 0 || day === 3 || day === 4 || day === 5 || day === 6; // Dom, Mié, Jue, Vie, Sab
  if (!openDays) return false;

  const h = date.getHours();
  const m = date.getMinutes();
  const mins = h * 60 + m;

  const start = 19 * 60; // 19:00
  const end = 24 * 60; // 24:00 == 00:00

  return mins >= start && mins < end;
}

// util para texto en UI
export function nextOpenText() {
  // simple: siempre decimos el horario fijo
  return `Abrimos ${STORE_SCHEDULE_TEXT}`;
}
