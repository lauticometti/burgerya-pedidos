/**
 * Hook para verificar disponibilidad de items por stock/producto.
 * El local cerrado ya NO afecta esta disponibilidad — solo el stock real
 * del item (isItemUnavailable) lo bloquea.
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

export function useItemAvailability(item) {
  return useMemo(() => {
    return {
      isUnavailable: isItemUnavailable(item),
      reason: getUnavailableReason(item),
    };
  }, [item]);
}
