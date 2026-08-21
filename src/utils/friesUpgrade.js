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

import { buildBurgerVariantDraft } from "./cartKeys";

// ─────────────────────────────────────────────────────────────────────────────
// INTERRUPTOR — poner en true para volver a ofrecer la mejora.
//
// Apagada (false): el boton "Mejorar papas" no se renderiza en ningun item del
// carrito y no hay forma de agregar la mejora. Ademas, los carritos que quedaron
// guardados en localStorage con la mejora puesta la pierden al cargar la pagina
// (ver stripDisabledFriesUpgrades), asi nadie la pide despues de darla de baja.
//
// El resto del codigo queda intacto: prender esta flag alcanza para reactivar
// todo (boton, modal de cantidad, linea del carrito y linea de la comanda).
// ─────────────────────────────────────────────────────────────────────────────
export const FRIES_UPGRADE_ENABLED = false;

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
 * Saca la mejora de los items que la traigan cuando la mejora esta dada de baja.
 *
 * Hace falta porque el carrito vive en localStorage: sin esto, alguien que la
 * agrego antes de apagar la flag seguiria viendo "Papas mejoradas" y esas papas
 * seguirian saliendo impresas en la comanda.
 *
 * La linea vuelve a su variante normal, lo que implica re-calcular su clave (la
 * mejora forma parte de la identidad de variante) y fusionarla con la linea
 * normal equivalente si ya existe, para no dejar dos lineas de lo mismo.
 *
 * @param {Object} items - Mapping key -> item tal como sale de localStorage
 * @returns {{ items: Object, changed: boolean }}
 */
export function stripDisabledFriesUpgrades(items) {
  if (FRIES_UPGRADE_ENABLED) return { items, changed: false };

  const next = {};
  let changed = false;

  const put = (key, item) => {
    const existing = next[key];
    next[key] = existing
      ? { ...existing, qty: (existing.qty || 0) + (item.qty || 0) }
      : item;
  };

  for (const [key, item] of Object.entries(items)) {
    if (!hasFriesUpgrade(item)) {
      put(key, item);
      continue;
    }

    changed = true;
    const draft = buildBurgerVariantDraft(item, {
      extras: item.extras || [],
      removedIngredients: item.removedIngredients || [],
      papas: (item.papas || []).filter((entry) => !isFriesUpgradeEntry(entry)),
      note: item.note || "",
    });
    put(draft.key, { ...item, ...draft });
  }

  return { items: next, changed };
}

/**
 * ¿Se le puede ofrecer "Mejorar papas" a este item del carrito?
 * Solo burgers con papas incluidas, editables y que no sean parte de un combo
 * bloqueado ni una promo con picks (esas lineas no se pueden splitear).
 */
export function canUpgradeFries(item) {
  if (!FRIES_UPGRADE_ENABLED) return false;
  if (!item) return false;
  if (item.meta?.type !== "burger") return false;
  if (item.meta?.locked) return false;
  if (item.meta?.picks?.length) return false;
  return burgerIncludesFries(item.meta?.burgerId);
}
