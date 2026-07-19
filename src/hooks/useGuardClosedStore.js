/**
 * Hook para guardar acciones cuando la tienda está cerrada.
 * El local cerrado ya NO bloquea armar el carrito — solo el envío final por
 * WhatsApp (ver Carrito.jsx) debe depender de isClosed.
 *
 * Uso:
 * const { canProceed } = useGuardClosedStore();
 *
 * if (!canProceed()) return;
 * // ... ejecutar acción
 */

import { useCallback } from "react";

export function useGuardClosedStore() {
  const canProceed = useCallback(() => true, []);

  return {
    isBlocked: false,
    canProceed,
  };
}
