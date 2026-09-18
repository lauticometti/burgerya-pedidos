// Cheeseburger Day — config aislada del evento. No toca menu.js ni precios normales.
//
// Para apagar el evento y volver al sitio normal: CHEESEBURGER_DAY_ENABLED = false.
// También se apaga solo si la fecha (America/Argentina/Buenos_Aires) no coincide.
export const CHEESEBURGER_DAY_ENABLED = true;
export const CHEESEBURGER_DAY_DATE = "2026-09-18";

// Precio exclusivo del evento. El precio normal de Cheese vive en src/data/menu.js
// y no se toca.
export const CHEESEBURGER_DAY_PRICE = 10000;

// Cambiar a true para cerrar ventas del evento de inmediato (bloquea PEDIR AHORA).
export const CHEESEBURGER_DAY_SOLD_OUT = false;

export const CHEESEBURGER_DAY_MIN_DELIVERY_QTY = 2;

export const CHEESEBURGER_DAY_DIP_ID = "dip_mil_islas";
