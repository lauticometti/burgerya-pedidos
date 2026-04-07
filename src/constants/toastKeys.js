/**
 * Centralized toast notification keys
 * Ensures consistency across the app and prevents duplicate toast messages
 */

export const TOAST_KEYS = {
  // Store closed
  STORE_CLOSED_BURGERS: "store-closed-burgers",
  STORE_CLOSED_PAPAS: "store-closed-papas",
  STORE_CLOSED_PAPAS_DIP: "store-closed-papas-dip",
  STORE_CLOSED_EXTRAS: "store-closed-extras",
  STORE_CLOSED_COMBOS: "store-closed-combos",
  STORE_CLOSED_BEBIDAS: "store-closed-bebidas",
  STORE_CLOSED_BEBIDAS_MODAL: "store-closed-bebidas-modal",
  STORE_CLOSED_CARRITO: "store-closed-carrito",

  // Item unavailable
  ITEM_UNAVAILABLE_PAPAS: (id) => `papas-unavailable:${id}`,
  ITEM_UNAVAILABLE_PAPAS_DIP: (id) => `papas-dip-unavailable:${id}`,
  ITEM_UNAVAILABLE_BURGERS: (id) => `burger-unavailable:${id}`,
  ITEM_UNAVAILABLE_EXTRAS: (id) => `extras-unavailable:${id}`,
  ITEM_UNAVAILABLE_COMBOS: (id) => `combo-unavailable:${id}`,
  ITEM_UNAVAILABLE_BEBIDAS: (id) => `bebida-unavailable:${id}`,

  // Papas options
  PAPAS_OPTION_UNAVAILABLE: (size, id) => `papas-option-unavailable:${size}:${id}`,

  // Cart operations
  ITEM_REMOVED_UNDO: "item-removed-undo",
  CHECKOUT_SUCCESS: "checkout-success",

  // Promos
  PROMO_INVALID: "promo-invalid",
};

/**
 * Helper to get a toast key function or string value
 * @param {string|function} key - Toast key or key function
 * @param {...args} args - Arguments to pass if key is a function
 * @returns {string} - Toast key string
 */
export function getToastKey(key, ...args) {
  return typeof key === "function" ? key(...args) : key;
}
