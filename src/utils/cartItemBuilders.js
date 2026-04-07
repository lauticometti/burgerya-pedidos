/**
 * Factory functions for creating cart items
 * Consolidates duplicated cart.add() patterns
 */

/**
 * Create a bebida (drink) cart item
 * @param {Object} bebida - Bebida data with id, name, price
 * @param {number} qty - Quantity
 * @returns {Object} - Cart item
 */
export function createBebidaItem(bebida, qty = 1) {
  return {
    key: `bebida:${bebida.id}`,
    name: bebida.name,
    qty,
    unitPrice: bebida.price,
    meta: { type: "bebida" },
  };
}

/**
 * Create a papas (potatoes) cart item
 * @param {Object} papas - Papas data with id, name, price
 * @param {number} qty - Quantity
 * @returns {Object} - Cart item
 */
export function createPapasItem(papas, qty = 1) {
  return {
    key: `papas:${papas.id}`,
    name: papas.name,
    qty,
    unitPrice: papas.price,
    meta: { type: "papas" },
  };
}

/**
 * Create an extras (sides) cart item
 * @param {Object} extras - Extras data with id, name, price
 * @param {number} qty - Quantity
 * @returns {Object} - Cart item
 */
export function createExtrasItem(extras, qty = 1) {
  return {
    key: `extras:${extras.id}`,
    name: extras.name,
    qty,
    unitPrice: extras.price,
    meta: { type: "extras" },
  };
}

/**
 * Create a combo cart item
 * @param {Object} combo - Combo data with id, name, price
 * @param {number} qty - Quantity
 * @returns {Object} - Cart item
 */
export function createComboItem(combo, qty = 1) {
  return {
    key: `combo:${combo.id}`,
    name: combo.name,
    qty,
    unitPrice: combo.price,
    meta: { type: "combo" },
  };
}
