/**
 * Generic indexing utilities for creating lookup objects
 * Consolidates duplicated reduce patterns used throughout the app
 */

/**
 * Create an object index where keys are item IDs
 * @param {Array} items - Items to index
 * @returns {Object} - Object with id as key and item as value
 */
export function indexById(items) {
  return items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

/**
 * Alias for indexById with semantic naming
 */
export const createIdIndex = indexById;
