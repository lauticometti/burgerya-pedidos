/**
 * Hook para guardar acciones cuando la tienda está cerrada
 * Consolida el patrón repetido en 10+ lugares
 *
 * Uso:
 * const { isBlocked, canProceed } = useGuardClosedStore("STORE_CLOSED_PAPAS");
 *
 * if (!canProceed()) return;
 * // ... ejecutar acción
 */

import { useCallback } from "react";
import { toast } from "../utils/toast";
import { useStoreStatus } from "../utils/storeClosedMode";

export function useGuardClosedStore(toastKey) {
  const { closedToastText, isClosed } = useStoreStatus();

  const canProceed = useCallback(() => {
    if (isClosed) {
      toast.error(closedToastText, { key: toastKey });
      return false;
    }
    return true;
  }, [isClosed, toastKey, closedToastText]);

  return {
    isBlocked: isClosed,
    canProceed,
  };
}
