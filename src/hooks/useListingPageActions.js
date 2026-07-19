/**
 * Generic hook for listing pages (Papas, Extras, Combos)
 * Consolidates common patterns: availability checks, toasts.
 * El local cerrado ya NO bloquea armar el carrito — solo el envío final por
 * WhatsApp (ver Carrito.jsx) debe depender de isClosed.
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

/**
 * Hook for managing actions on listing pages
 * @returns {Object} - { canAddItem, showUnavailableError, handleAddItem }
 */
export function useListingPageActions() {
  const canAddItem = useCallback(() => true, []);

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
