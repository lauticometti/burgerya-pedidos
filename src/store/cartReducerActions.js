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
 * Mueve N unidades de una linea de burger a otra variante (split) y las fusiona
 * con la linea destino si esa variante ya existe (merge).
 *
 * Es el UNICO motor de split/merge de burgers: lo usan tanto "Personalizar
 * burger" (scope una / todas) como "Mejorar papas" (cantidad elegida). Al ser
 * uno solo, cualquier atributo que entre en buildBurgerLineKey() participa
 * automaticamente del split y del merge, sin comparaciones sueltas repartidas
 * por los componentes.
 *
 * @param {Object} items - Items mapping
 * @param {string} baseKey - Clave de la linea original
 * @param {Object} draft - { key, extras, removedIngredients, papas, note, meta }
 * @param {number} count - Unidades a mover (se acota a [1, qty de la linea])
 * @returns {Object} - New items object
 */
export function updateBurgerLineUnits(items, baseKey, draft, count) {
  const base = items[baseKey];
  if (!base || base.qty <= 0) return items;

  const requested = Math.floor(Number(count));
  const moving = Math.min(
    Math.max(Number.isFinite(requested) ? requested : base.qty, 1),
    base.qty,
  );

  const next = { ...items };

  // 1. Sacar de la linea original las unidades que se mueven. Si se mueven
  //    todas, la linea desaparece: nunca queda una linea en qty 0.
  const remaining = base.qty - moving;
  if (remaining > 0) next[baseKey] = { ...base, qty: remaining };
  else delete next[baseKey];

  // 2. Mergear en la variante destino si ya existe; si no, crearla.
  //    Si draft.key === baseKey el cambio es un no-op y la cuenta cierra sola:
  //    las unidades vuelven a la misma linea sin perderse.
  const existing = next[draft.key];
  if (existing) {
    next[draft.key] = { ...existing, qty: existing.qty + moving };
  } else {
    next[draft.key] = { ...base, ...draft, qty: moving };
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
