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
 * Apply a full modifier draft (extras, removed ingredients, note) to exactly
 * one unit of a burger line, splitting it off from the rest of the qty.
 * If a line with the resulting configuration already exists, merges into it.
 * @param {Object} items - Items mapping
 * @param {string} baseKey - Original burger line key
 * @param {Object} draft - { key, extras, removedIngredients, note, meta }
 * @returns {Object} - New items object
 */
export function updateOneBurgerLine(items, baseKey, draft) {
  const base = items[baseKey];
  if (!base || base.qty <= 0) return items;

  const next = { ...items };

  if (base.qty === 1) {
    delete next[baseKey];
  } else {
    next[baseKey] = { ...base, qty: base.qty - 1 };
  }

  const existing = next[draft.key];
  if (existing && draft.key !== baseKey) {
    next[draft.key] = { ...existing, qty: existing.qty + 1 };
  } else {
    next[draft.key] = {
      ...base,
      ...draft,
      qty: 1,
    };
  }

  return next;
}

/**
 * Apply a full modifier draft (extras, removed ingredients, note) to every
 * unit of a burger line. If a line with the resulting configuration already
 * exists, merges the whole quantity into it.
 * @param {Object} items - Items mapping
 * @param {string} baseKey - Original burger line key
 * @param {Object} draft - { key, extras, removedIngredients, note, meta }
 * @returns {Object} - New items object
 */
export function updateAllBurgerLine(items, baseKey, draft) {
  const base = items[baseKey];
  if (!base || base.qty <= 0) return items;

  const next = { ...items };
  delete next[baseKey];

  const existing = draft.key !== baseKey ? next[draft.key] : null;
  if (existing) {
    next[draft.key] = { ...existing, qty: existing.qty + base.qty };
  } else {
    next[draft.key] = {
      ...base,
      ...draft,
      qty: base.qty,
    };
  }

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
