/**
 * Hook para verificar disponibilidad de items
 * Consolida lógica: isClosed || isItemUnavailable(item)
 *
 * Uso:
 * const { isUnavailable, reason } = useItemAvailability(item);
 *
 * if (isUnavailable) {
 *   toast.error(reason);
 *   return;
 * }
 */

import { useMemo } from "react";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../utils/availability";
import { useStoreStatus } from "../utils/storeClosedMode";

export function useItemAvailability(item) {
  const { isClosed, reopenText } = useStoreStatus();

  return useMemo(() => {
    const unavailable = isClosed || isItemUnavailable(item);
    const reason = isClosed ? reopenText : getUnavailableReason(item);

    return {
      isUnavailable: unavailable,
      reason,
    };
  }, [item, isClosed, reopenText]);
}
