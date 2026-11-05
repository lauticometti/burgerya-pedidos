// Códigos de premio del sorteo. Lista fija y manual: no hay generación
// automática ni backend. Cuando Lautaro confirma que un ganador ya usó su
// código, lo borra de esta lista a mano.
export const giveawayCoupons = [
  { code: "DELFI-TCJF4T", owner: "Delfi" },
  { code: "ESTEBAN-8NYKJ7", owner: "Esteban" },
  { code: "JOAQUIN-M32522", owner: "Joaquín" },
];

// Vencimiento de los códigos de premio: sábado. Para cambiar la fecha,
// editar solo esta constante (año, mes 0-indexado, día, hora, minuto).
export const GIVEAWAY_COUPON_EXPIRY_TS = new Date(
  2026,
  10,
  7,
  23,
  59,
  0,
).getTime(); // sábado 07/11/2026 23:59 (BA)
