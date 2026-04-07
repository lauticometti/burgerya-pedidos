/**
 * Item categorization and grouping utilities
 * Consolidated from carritoUtils.js and whatsapp.js
 */

export const CART_GROUP_ORDER = [
  { key: "promos", title: "PROMOS" },
  { key: "burgers", title: "BURGERS" },
  { key: "papas", title: "PAPAS" },
  { key: "dips", title: "DIPS" },
  { key: "bebidas", title: "BEBIDAS" },
];

/**
 * Determine the category of a cart item
 * @param {Object} item - Cart item with meta property
 * @returns {string} - Category key: "promos", "burgers", "papas", "dips", or "bebidas"
 */
export function getCategory(item) {
  if (item.meta?.type === "promo") return "promos";
  if (item.meta?.type === "bebida") return "bebidas";
  if (item.meta?.type === "papas" && item.key?.startsWith("papas:dip_")) {
    return "dips";
  }
  if (item.meta?.type === "papas") return "papas";
  return "burgers";
}

/**
 * Group items by category
 * @param {Array} items - Cart items to group
 * @returns {Object} - Object with category keys and arrays of items
 */
export function groupItemsByCategory(items = []) {
  const grouped = {
    promos: [],
    burgers: [],
    papas: [],
    dips: [],
    bebidas: [],
  };

  for (const item of items) {
    const category = getCategory(item);
    grouped[category].push(item);
  }

  return grouped;
}
