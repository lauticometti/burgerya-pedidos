function pad2(n) {
  return String(n).padStart(2, "0");
}

function buildTimeSlots() {
  const start = 20 * 60 + 30; // 20:30
  const end = 24 * 60; // 24:00 => 00:00
  const out = [];
  for (let m = start; m <= end; m += 15) out.push(m);
  return out;
}

function roundUpTo15(mins) {
  return Math.ceil(mins / 15) * 15;
}

export function minutesToHHMM(m) {
  const hh = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

export function getAvailableSlotsMin30(date = new Date()) {
  const slots = buildTimeSlots();
  const nowMins = date.getHours() * 60 + date.getMinutes();

  const opening = 20 * 60 + 30;
  if (nowMins < opening) return slots;

  const minAllowed = roundUpTo15(nowMins + 30);
  return slots.filter((m) => m >= minAllowed);
}

