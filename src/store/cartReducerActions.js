/**
 * Cart reducer helper functions
 * Extracted from CartProvider to reduce duplication and complexity
 */

/**
 * Mutate a single item property in items object
 * @param {Object} items - Items mapping
 * @param {string} key - Item key
 * @param {Object} updates - Properties to update
 * @returns {Object} - New items object
 */
export function mutateItem(items, key, updates) {
  if (!items[key]) return items;
  return {
    ...items,
    [key]: { ...items[key], ...updates },
  };
}

/**
 * Delete items by keys
 * @param {Object} items - Items mapping
 * @param {string[]} keys - Keys to delete
 * @returns {Object} - New items object
 */
export function removeItems(items, keys) {
  const next = { ...items };
  for (const k of keys) {
    delete next[k];
  }
  return next;
}

/**
 * Delete items matching a key prefix
 * @param {Object} items - Items mapping
 * @param {string} prefix - Key prefix to match
 * @returns {Object} - New items object
 */
export function removeItemsByPrefix(items, prefix) {
  const next = { ...items };
  for (const k of Object.keys(next)) {
    if (k.startsWith(prefix)) delete next[k];
  }
  return next;
}

/**
 * Handle burger split: create line item variant while decrementing base qty
 * @param {Object} items - Items mapping
 * @param {string} baseKey - Original burger key
 * @param {Object} lineItem - New line item with custom modifications
 * @returns {Object} - New items object
 */
export function splitBurgerLine(items, baseKey, lineItem) {
  const base = items[baseKey];
  if (!base || base.qty <= 0) return items;

  const next = { ...items };

  // Decrement base or remove if qty was 1
  if (base.qty === 1) {
    delete next[baseKey];
  } else {
    next[baseKey] = { ...base, qty: base.qty - 1 };
  }

  // Add custom line item
  next[lineItem.key] = { ...lineItem, qty: 1 };

  return next;
}

/**
 * Set papas upgrade for a burger line (only one per line)
 * @param {Object} items - Items mapping
 * @param {string} lineId - Burger line ID
 * @param {Object|null} item - Upgrade item or null to clear
 * @returns {Object} - New items object
 */
export function setPapasUpgrade(items, lineId, item) {
  // Remove any existing upgrade for this line
  const next = removeItemsByPrefix(items, `papasup:${lineId}:`);

  // Add new upgrade if provided
  if (item) {
    next[item.key] = { ...item, qty: 1 };
  }

  return next;
}
