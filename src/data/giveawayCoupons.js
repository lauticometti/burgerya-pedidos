// Códigos de premio del sorteo. Lista fija y manual: no hay generación
// automática ni backend. Cuando Lautaro confirma que un ganador ya usó su
// código, lo borra de esta lista a mano.
export const giveawayCoupons = [
  { code: "SANTI-K7Q4XM", owner: "Santi" },
  { code: "CAMI-P9XW2L", owner: "Cami" },
  { code: "ERIK-M8RNC4", owner: "Erik" },
  { code: "ALEJO-X3LQ7V", owner: "Alejo" },
  { code: "FELIPE-T6HY9K", owner: "Felipe" },
  { code: "JUAMPI-B4NV8R", owner: "Juampi" },
  { code: "LUCIANA-W2FK6P", owner: "Luciana" },
];

// Vencimiento de los códigos de premio: sábado. Para cambiar la fecha,
// editar solo esta constante (año, mes 0-indexado, día, hora, minuto).
export const GIVEAWAY_COUPON_EXPIRY_TS = new Date(
  2026,
  6,
  18,
  23,
  59,
  0,
).getTime(); // sábado 18/07/2026 23:59 (BA)
