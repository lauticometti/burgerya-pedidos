/**
 * Generic hook for listing pages (Papas, Extras, Combos)
 * Consolidates common patterns: closed store guard, availability checks, toasts
 *
 * Uso:
 * const { canAddItem, showUnavailableError, handleAddItem } = useListingPageActions();
 *
 * function addItem(item) {
 *   if (!canAddItem()) return;
 *   // ... procesar item
 * }
 */

import { useCallback } from "react";
import { toast } from "../utils/toast";
import { getUnavailableReason, isItemUnavailable } from "../utils/availability";
import { useStoreStatus } from "../utils/storeClosedMode";

/**
 * Hook for managing actions on listing pages
 * @param {Object} config - Configuration
 * @param {string} config.toastKey - Toast key when store is closed
 * @returns {Object} - { canAddItem, showUnavailableError, handleAddItem }
 */
export function useListingPageActions({ toastKey = "store-closed" } = {}) {
  const { closedToastText, isClosed } = useStoreStatus();

  const canAddItem = useCallback(() => {
    if (isClosed) {
      toast.error(closedToastText, { key: toastKey });
      return false;
    }
    return true;
  }, [isClosed, toastKey, closedToastText]);

  const showUnavailableError = useCallback(
    (item, errorToastKey) => {
      if (!isItemUnavailable(item)) return false;
      const reason = getUnavailableReason(item);
      toast.error(`${item.name}: ${reason}`, {
        key: errorToastKey,
      });
      return true;
    },
    [],
  );

  return {
    canAddItem,
    showUnavailableError,
  };
}
