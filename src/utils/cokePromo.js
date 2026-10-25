/**
 * Promoción: DOBLES y TRIPLES + Coca-Cola 600 ml de regalo.
 *
 * Domingo 2026-10-25, desde que se publica hasta las 21:00 (hora de Buenos
 * Aires). Cada burger doble o triple que participa suma una Coca 600 de
 * regalo (Original o Zero, a elección), a $0 y con el precio habitual de la
 * burger. Las simples no participan. Otro día no hace nada: se apaga sola.
 *
 * ESTE ES EL UNICO LUGAR donde se define:
 * - si la promo está activa (día, hora de fin, tamaños)
 * - qué variedades se ofrecen y cómo salen impresas
 * - cómo se reparten los regalos entre las burgers del carrito
 *
 * Cómo viaja el regalo: cada línea de burger guarda en meta.cokeGifts la
 * variedad elegida para cada unidad (["coca_600", "coca_zero_600", ...]).
 * Las líneas "Coca de regalo" del carrito se derivan de ahí (ver
 * syncCokeGiftItems), así que borrar o modificar una burger nunca le quita
 * el regalo a otra, y nunca hay más regalos que burgers participantes.
 */
import { bebidas } from "../data/menu";
import { isItemUnavailable } from "./availability";
import { getArgentinaTimeParts, getStoreNow } from "./storeClosedMode";

/** Interruptor general. false = promo apagada aunque sea el día. */
export const COKE_PROMO_ENABLED = true;

/** Día de la promo (hora Buenos Aires). Otro día no se activa. */
export const COKE_PROMO_DATE = "2026-10-25";

/** Ventana en minutos del día (hora Buenos Aires): desde 00:00 hasta 21:00 exclusive. */
export const COKE_PROMO_START_MINUTES = 0;
export const COKE_PROMO_END_MINUTES = 21 * 60;

/** Tamaños que participan. */
export const COKE_PROMO_SIZES = ["doble", "triple"];

/**
 * Bebidas que se ofrecen de regalo. El stock es el mismo del menú: para
 * marcar una variedad agotada, ponerle isAvailable: 0 en src/data/menu.js
 * (igual que cualquier producto). En el selector aparece como "Agotada".
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

const COKE_GIFT_KEY_SUFFIX = ":promo";

export function getCokeGiftKey(varietyId) {
  return `bebida:${varietyId}${COKE_GIFT_KEY_SUFFIX}`;
}

/** ¿La promo está totalmente habilitada en el sistema? */
export function isCokePromoEnabled() {
  return COKE_PROMO_ENABLED;
}

/** ¿Este tamaño participa? */
export function isCokePromoEligibleSize(size) {
  return COKE_PROMO_SIZES.includes(size);
}

/**
 * ¿La ventana está abierta para estas partes de fecha/hora (Buenos Aires)?
 * Pura: la usa getStoreStatus para suspender la recomendada del día.
 */
export function isCokePromoWindowActive(parts) {
  if (!COKE_PROMO_ENABLED || !parts) return false;
  return (
    parts.dateKey === COKE_PROMO_DATE &&
    parts.minutes >= COKE_PROMO_START_MINUTES &&
    parts.minutes < COKE_PROMO_END_MINUTES
  );
}

/** ¿Hay stock de esta variedad? Lee la disponibilidad del menú. */
export function hasCokePromoVarietyStock(varietyId) {
  if (!COKE_PROMO_VARIETIES[varietyId]) return false;
  const bebida = bebidas.find((b) => b.id === varietyId);
  return Boolean(bebida) && !isItemUnavailable(bebida);
}

/** ¿Hay stock de al menos una variedad? */
export function hasCokePromoStock() {
  return Object.keys(COKE_PROMO_VARIETIES).some(hasCokePromoVarietyStock);
}

/** Datos de la Coca de regalo para una variedad. */
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

/** Línea de carrito "Coca de regalo" para una variedad, a $0. */
export function createCokeGiftItem(varietyId, qty) {
  const entry = createCokePromoEntry(varietyId);
  if (!entry) return null;
  return {
    key: getCokeGiftKey(varietyId),
    name: entry.name,
    qty,
    unitPrice: 0,
    meta: {
      type: "bebida",
      isCokePromo: true,
      cokePromoLabel: entry.ticketLabel,
    },
  };
}

/**
 * ¿Se puede ofrecer la promo a este item?
 * Burgers doble/triple sin bloqueos y sin otra oferta de precio.
 */
export function canOfferCokePromo(item) {
  if (!isCokePromoEnabled()) return false;
  if (!hasCokePromoStock()) return false;
  if (!item) return false;
  if (item.meta?.type !== "burger") return false;
  if (!isCokePromoEligibleSize(item.meta?.size)) return false;
  if (item.meta?.locked) return false;
  // No se combina con la promo del dia (ni ninguna otra oferta de precio).
  if (item.meta?.offerId) return false;
  return true;
}

/** ¿La ventana de hoy está abierta ahora mismo (reloj de la web)? */
export function isCokePromoTimeActive(date = null) {
  const resolved = date instanceof Date ? date : getStoreNow();
  return isCokePromoWindowActive(getArgentinaTimeParts(resolved));
}

/** ¿La promo está completamente activa? (habilitada + en horario + hay stock) */
export function isCokePromoAvailable(date = null) {
  return isCokePromoEnabled() && isCokePromoTimeActive(date) && hasCokePromoStock();
}

// ---------------------------------------------------------------------------
// Regalos por burger (meta.cokeGifts)
// ---------------------------------------------------------------------------

/**
 * Variedades de regalo de una línea de burger, una por unidad. Si la línea
 * tiene más unidades que elecciones (sumó con "+"), las nuevas repiten la
 * última variedad elegida; si tiene menos, se recorta desde el final.
 */
export function getLineCokeGifts(item) {
  const gifts = Array.isArray(item?.meta?.cokeGifts)
    ? item.meta.cokeGifts.filter((id) => COKE_PROMO_VARIETIES[id])
    : [];
  const qty = Math.max(0, Math.floor(item?.qty || 0));
  if (!gifts.length || qty === 0) return [];
  if (gifts.length >= qty) return gifts.slice(0, qty);
  const last = gifts[gifts.length - 1];
  return [...gifts, ...Array(qty - gifts.length).fill(last)];
}

/** Junta los regalos de una línea existente con los de una que se suma. */
export function mergeCokeGifts(existing, incoming) {
  const a = getLineCokeGifts(existing);
  const b = getLineCokeGifts(incoming);
  if (!a.length && !b.length) return undefined;
  return [...a, ...b];
}

/**
 * Parte los regalos de una línea al mover `moving` unidades a otra variante
 * (personalizar / mejorar papas): las unidades que se mueven se llevan las
 * últimas elecciones, las que quedan conservan las primeras.
 */
export function splitCokeGifts(item, moving) {
  const gifts = getLineCokeGifts(item);
  const keep = Math.max(0, (item?.qty || 0) - moving);
  return { kept: gifts.slice(0, keep), moved: gifts.slice(keep) };
}

/** ¿Esta línea de burger cuenta para regalos ahora? */
function lineParticipates(item) {
  return (
    item?.meta?.type === "burger" &&
    isCokePromoEligibleSize(item.meta?.size) &&
    !item.meta?.offerId &&
    !item.meta?.locked
  );
}

/** Cantidad de Cocas de regalo que corresponden, por variedad. */
export function getCokeGiftCounts(items, active) {
  const counts = {};
  if (!active) return counts;
  for (const item of Object.values(items || {})) {
    if (!lineParticipates(item)) continue;
    for (const varietyId of getLineCokeGifts(item)) {
      if (!hasCokePromoVarietyStock(varietyId)) continue;
      counts[varietyId] = (counts[varietyId] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Devuelve el mapa de items con las líneas "Coca de regalo" alineadas a las
 * burgers participantes (o sin ninguna si la promo no está activa). Si no
 * hay nada que cambiar devuelve el mismo objeto, para no re-renderizar.
 */
export function syncCokeGiftItems(items, active) {
  const counts = getCokeGiftCounts(items, active);
  let next = items;
  const ensureCopy = () => {
    if (next === items) next = { ...items };
  };

  for (const [key, item] of Object.entries(items)) {
    if (!item?.meta?.isCokePromo) continue;
    const varietyId = Object.keys(COKE_PROMO_VARIETIES).find(
      (id) => getCokeGiftKey(id) === key,
    );
    const wanted = varietyId ? counts[varietyId] || 0 : 0;
    if (wanted <= 0) {
      ensureCopy();
      delete next[key];
    } else if (item.qty !== wanted || item.unitPrice !== 0) {
      ensureCopy();
      next[key] = { ...item, qty: wanted, unitPrice: 0 };
    }
  }

  for (const [varietyId, qty] of Object.entries(counts)) {
    const key = getCokeGiftKey(varietyId);
    if (items[key]?.meta?.isCokePromo) continue;
    ensureCopy();
    next[key] = createCokeGiftItem(varietyId, qty);
  }

  return next;
}

/** ¿El carrito tiene Cocas de regalo? */
export function hasCokeGiftItems(items) {
  return (items || []).some((it) => it?.meta?.isCokePromo);
}

/**
 * PROMO LAUTIBOOM TRIPLE (histórica, apagada).
 * Se deja el switch para no romper imports; no se usa hoy.
 */
export const LAUTIBOOM_TRIPLE_PROMO_ENABLED = false;

export function isLautiboomboomPromoActive() {
  return false;
}

export function canOfferLautiboomboomPromo() {
  return false;
}
