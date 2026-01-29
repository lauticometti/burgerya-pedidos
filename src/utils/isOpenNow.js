// Mie(3) a Dom(0) en JS: 0=Dom,1=Lun,...6=Sab
export function isOpenNow(date = new Date()) {
  const day = date.getDay(); // 0..6
  const openDays =
    day === 0 || day === 3 || day === 4 || day === 5 || day === 6; // Dom, Mie, Jue, Vie, Sab
  if (!openDays) return false;

  const h = date.getHours();
  const m = date.getMinutes();
  const mins = h * 60 + m;

  const start = 19 * 60; // 19:00
  const end = 24 * 60; // 24:00 == 00:00

  return mins >= start && mins < end;
}

// útil para texto en UI
export function nextOpenText(date = new Date()) {
  // simple: siempre decimos el horario fijo
  return "Abrimos 20 a 00 (Mié a Dom)";
}
