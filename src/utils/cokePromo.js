/**
 * Promoción: Todas las TRIPLES incluyen Coca gratis
 *
 * Desde 19:30 (hora de Buenos Aires), cada hamburguesa TRIPLE incluye
 * una Coca-Cola 600ml gratis (Original o Zero), hasta agotar stock.
 *
 * ESTE ES EL UNICO LUGAR donde se define:
 * - si la promo está activa
 * - horario de inicio
 * - stock disponible
 * - qué se agrega, cuanto cuesta, como sale impreso
 *
 * La Coca gratis NO es un producto aparte: viaja asociada a la triple
 * en item.meta.cokePromo, asi que entra en la comanda correctamente.
 */

/**
 * Interruptor: poner en true para activar la promo.
 * Poner en false para desactivarla completamente.
 */
export const COKE_PROMO_ENABLED = false;

/**
 * Hora de inicio: 19:30 hora de Buenos Aires.
 * Se chequea en el componente Menu usando el horario local del usuario.
 */
export const COKE_PROMO_START_TIME = "19:30"; // HH:mm en timezone America/Argentina/Buenos_Aires

/**
 * Stock disponible de cada variedad.
 * Cuando llega a 0, esa variedad se deshabilita en el modal.
 * Si ambas están en 0, no se muestra el modal.
 *
 * Cambiar estos números para controlar el stock manualmente.
 */
export const COKE_PROMO_STOCK = {
  coca_600: 50, // Original 600ml
  coca_zero_600: 50, // Zero 600ml
};

/**
 * Validar que el stock sea consistente.
 */
function validateStock() {
  for (const variety of ["coca_600", "coca_zero_600"]) {
    if (!(variety in COKE_PROMO_STOCK)) {
      console.warn(`[cokePromo] Falta stock para ${variety}`);
    }
  }
}
validateStock();

/**
 * Bebidas que participan en la promo (gratis cuando se agrega un triple).
 * Incluye id, nombre para mostrar en modal, y label para impresión.
 */
export const COKE_PROMO_VARIETIES = {
  coca_600: {
    id: "coca_600",
    name: "Coca-Cola Original 600 ml",
    ticketLabel: "COCA 600ML (REGALO)",
  },
  coca_zero_600: {
    id: "coca_zero_600",
    name: "Coca-Cola Zero 600 ml",
    ticketLabel: "COCA ZERO 600ML (REGALO)",
  },
};

/** ¿La promo está totalmente habilitada en el sistema? */
export function isCokePromoEnabled() {
  return COKE_PROMO_ENABLED;
}

/**
 * ¿Hay stock disponible de al menos una variedad?
 * Si ambas están en 0, la promo no se ofrece.
 * Función independiente sin check de COKE_PROMO_ENABLED.
 */
export function hasCokePromoStock() {
  const totalStock = Object.values(COKE_PROMO_STOCK).reduce((sum, qty) => sum + qty, 0);
  return totalStock > 0;
}

/**
 * ¿Hay stock disponible de una variedad específica?
 * @param {string} varietyId - "coca_600" o "coca_zero_600"
 * Función independiente sin check de COKE_PROMO_ENABLED.
 */
export function hasCokePromoVarietyStock(varietyId) {
  return COKE_PROMO_STOCK[varietyId] > 0;
}

/**
 * Generar entrada de Coca gratis para item.meta.cokePromo.
 * Asegura que siempre tenga los datos necesarios.
 * @param {string} varietyId - "coca_600" o "coca_zero_600"
 */
export function createCokePromoEntry(varietyId) {
  const variety = COKE_PROMO_VARIETIES[varietyId];
  if (!variety) return null;
  return {
    varietyId,
    name: variety.name,
    ticketLabel: variety.ticketLabel,
    price: 0,
  };
}

/**
 * ¿Este item lleva una Coca de promo?
 * @param {Object} item - Item del carrito
 */
export function hasCokePromo(item) {
  return Boolean(item?.meta?.cokePromo);
}

/**
 * Obtener la Coca gratis asociada a una triple (si la tiene).
 * @param {Object} item - Item del carrito
 */
export function getCokePromoEntry(item) {
  return item?.meta?.cokePromo || null;
}

/**
 * ¿Se puede ofrecer la promo a este item?
 * Solo para burgers tamaño "triple" sin bloqueos.
 */
export function canOfferCokePromo(item) {
  if (!isCokePromoEnabled()) return false;
  if (!hasCokePromoStock()) return false;
  if (!item) return false;
  if (item.meta?.type !== "burger") return false;
  if (item.meta?.size !== "triple") return false;
  if (item.meta?.locked) return false;
  // Ya tiene Coca de promo (aunque no debería pasar, pero por seguridad)
  if (hasCokePromo(item)) return false;
  return true;
}

/**
 * Disminuir el stock de una variedad.
 * NOTA: Esta función solo modifica la const. Para persistencia real,
 * se necesaría un backend. Como no lo hay, cada recarga reinicia el stock.
 */
export function decrementCokePromoStock(varietyId) {
  if (COKE_PROMO_STOCK[varietyId] > 0) {
    COKE_PROMO_STOCK[varietyId]--;
  }
}

/**
 * Incrementar el stock (cuando se elimina una triple con Coca de promo).
 */
export function incrementCokePromoStock(varietyId) {
  COKE_PROMO_STOCK[varietyId]++;
}

/**
 * ¿Ya pasó el horario de inicio (19:30 Argentina)?
 * Función de tiempo independiente, sin checks de COKE_PROMO_ENABLED.
 */
function isPromoTimeWindow() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const formatted = formatter.format(now);
  const [hour, minute] = formatted.split(":").map(Number);
  const currentMinutes = hour * 60 + minute;

  const [startHour, startMinute] = COKE_PROMO_START_TIME.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;

  return currentMinutes >= startMinutes;
}

/**
 * ¿La hora actual (Argentina) ya pasó el horario de inicio de la promo?
 * Chequea si es >= 19:30 (o la hora configurada en COKE_PROMO_START_TIME).
 */
export function isCokePromoTimeActive() {
  if (!isCokePromoEnabled()) return false;
  return isPromoTimeWindow();
}

/**
 * ¿La promo está completamente activa? (habilitada + pasó la hora + hay stock)
 */
export function isCokePromoAvailable() {
  return isCokePromoEnabled() && isCokePromoTimeActive() && hasCokePromoStock();
}

/**
 * PROMO LAUTIBOOM TRIPLE (solo hoy domingo)
 * Usa el mismo mecanismo de Coca gratis pero solo para lautiboom cuando es burger del día.
 */
export const LAUTIBOOM_TRIPLE_PROMO_ENABLED = false;

/**
 * ¿La promo de lautiboom triple está activa?
 * Solo hoy (domingo) y en horario de promo (19:30+)
 */
export function isLautiboomboomPromoActive() {
  if (!LAUTIBOOM_TRIPLE_PROMO_ENABLED) return false;
  if (!isPromoTimeWindow()) return false;

  const now = new Date();
  const today = now.getDay();
  const isSunday = today === 0;

  return isSunday;
}

/**
 * ¿Se puede ofrecer la promo de lautiboom a este item?
 * Solo para "lautiboom" tamaño "triple" en domingo.
 */
export function canOfferLautiboomboomPromo(item, burgerId) {
  if (!isLautiboomboomPromoActive()) return false;
  if (!hasCokePromoStock()) return false;
  if (!item) return false;
  if (item.meta?.type !== "burger") return false;
  if (item.meta?.size !== "triple") return false;
  if (item.meta?.locked) return false;
  if (burgerId !== "lautiboom") return false;
  return true;
}
