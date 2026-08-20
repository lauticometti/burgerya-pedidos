/**
 * Mejora de las papas INCLUIDAS con una burger ("Mejorar papas").
 *
 * ESTE ES EL UNICO LUGAR donde se define la mejora: que incluye, cuanto sale,
 * como se llama en el carrito y como sale impresa en la comanda. Nada de esto
 * debe duplicarse en componentes.
 *
 * La mejora NO es un producto aparte: viaja adentro de la variante de la burger
 * (item.papas / meta.papasIds), asi que entra sola en la clave de linea que
 * arma utils/cartKeys.js y por lo tanto en el split, el merge y la comanda.
 */

// ─────────────────────────────────────────────────────────────────────────────
// PRECIO — cambiar SOLO este numero para que la mejora deje de ser gratis.
//
// Hoy vale $0 (promo del dia). El precio NO se congela en el carrito: se
// resuelve siempre desde aca via utils/papasPricing.js, asi que si mañana lo
// ponés en 1500 tambien se re-cotizan los carritos ya guardados en localStorage.
// ─────────────────────────────────────────────────────────────────────────────
export const FRIES_UPGRADE_UNIT_PRICE = 0;

/** Id de la mejora dentro de item.papas. Forma parte de la identidad de variante. */
export const FRIES_UPGRADE_ID = "papas_cheddar_bacon";

/** Que lleva la mejora, para textos largos (modal). */
export const FRIES_UPGRADE_INCLUDES = ["Cheddar líquido", "Bacon"];

/** Texto corto que se usa en el carrito: "Papas mejoradas: Cheddar + Bacon". */
export const FRIES_UPGRADE_SHORT_LABEL = "Cheddar + Bacon";

export const FRIES_UPGRADE_LABELS = {
  /** Boton al lado de "Personalizar burger", sin mejora aplicada. */
  idle: "Mejorar papas",
  /** Mismo boton, ya con la mejora aplicada. */
  active: "Papas mejoradas",
  /** Prefijo de la linea del carrito. */
  cartLine: "Papas mejoradas",
  /** Titulo del modal de cantidad, segun para donde va el cambio. */
  askUpgrade: "¿Cuántas papas querés mejorar?",
  askDowngrade: "¿A cuántas les querés sacar la mejora?",
};

/**
 * Linea de la comanda. Va en MAYUSCULA porque es la unica linea en mayuscula
 * debajo de una burger: en cocina tiene que saltar a la vista cual de las
 * variantes lleva las papas especiales sin tener que leer el pedido entero.
 */
export const FRIES_UPGRADE_TICKET_LINE = "PAPAS: CHEDDAR + BACON";

/**
 * Burgers que NO traen papas incluidas: no hay nada para mejorar.
 * cheese_promo es "Cheese simple sin papas"; cuando el cliente le suma papas,
 * entran como item suelto tipo "papas" (papas sueltas/extra), que tampoco
 * admite la mejora.
 */
const BURGERS_WITHOUT_FRIES = new Set(["cheese_promo"]);

/** Precio unitario vigente de la mejora. */
export function getFriesUpgradeUnitPrice() {
  return FRIES_UPGRADE_UNIT_PRICE;
}

/** Entrada que se guarda en item.papas cuando la variante lleva la mejora. */
export function createFriesUpgradeEntry() {
  return {
    id: FRIES_UPGRADE_ID,
    name: FRIES_UPGRADE_SHORT_LABEL,
    price: FRIES_UPGRADE_UNIT_PRICE,
  };
}

/** ¿Esta entrada de item.papas es la mejora de papas? */
export function isFriesUpgradeEntry(entry) {
  return entry?.id === FRIES_UPGRADE_ID;
}

/** ¿Esta variante del carrito lleva las papas mejoradas? */
export function hasFriesUpgrade(item) {
  return (item?.papas || []).some(isFriesUpgradeEntry);
}

/** ¿La burger trae papas incluidas? */
export function burgerIncludesFries(burgerId) {
  return Boolean(burgerId) && !BURGERS_WITHOUT_FRIES.has(burgerId);
}

/**
 * ¿Se le puede ofrecer "Mejorar papas" a este item del carrito?
 * Solo burgers con papas incluidas, editables y que no sean parte de un combo
 * bloqueado ni una promo con picks (esas lineas no se pueden splitear).
 */
export function canUpgradeFries(item) {
  if (!item) return false;
  if (item.meta?.type !== "burger") return false;
  if (item.meta?.locked) return false;
  if (item.meta?.picks?.length) return false;
  return burgerIncludesFries(item.meta?.burgerId);
}
