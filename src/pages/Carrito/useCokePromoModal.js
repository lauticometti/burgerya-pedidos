import React from "react";
import { createBebidaItem } from "../../utils/cartItemBuilders";
import { createCokePromoEntry } from "../../utils/cokePromo";

/**
 * Hook para manejar el modal de selección de Coca gratis en promo triple.
 *
 * Estado:
 * - modalOpen: boolean - si el modal está abierto
 * - pendingTriple: Object - la triple que espera confirmación de Coca
 * - selectedVariety: string - "coca_600" o "coca_zero_600" seleccionada
 *
 * Callbacks:
 * - openCokeModal(triple) - abrir modal con una triple pendiente
 * - selectVariety(varietyId) - seleccionar una variedad
 * - confirmAndAdd(cart) - agregar triple + Coca al carrito
 * - cancel() - cerrar sin agregar
 */
export default function useCokePromoModal() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [pendingTriple, setPendingTriple] = React.useState(null);
  const [selectedVariety, setSelectedVariety] = React.useState(null);

  const openCokeModal = React.useCallback((tripleItem) => {
    setPendingTriple(tripleItem);
    setSelectedVariety(null);
    setModalOpen(true);
  }, []);

  const selectVariety = React.useCallback((varietyId) => {
    setSelectedVariety(varietyId);
  }, []);

  const cancel = React.useCallback(() => {
    setModalOpen(false);
    setPendingTriple(null);
    setSelectedVariety(null);
  }, []);

  const confirmAndAdd = React.useCallback(
    (cart) => {
      if (!pendingTriple || !selectedVariety) return false;

      // Agregar la triple al carrito
      cart.add(pendingTriple);

      // Crear y agregar la Coca gratis
      const cokeEntry = createCokePromoEntry(selectedVariety);
      const bebidaItem = createBebidaItem(
        {
          id: selectedVariety,
          name: cokeEntry.name,
          orderName: cokeEntry.name,
          price: 0,
        },
        1,
      );

      // Marcar la Coca como regalo promo y vincularla a esta triple
      bebidaItem.meta = {
        ...bebidaItem.meta,
        isCokePromo: true,
        cokePromoLabel: cokeEntry.ticketLabel,
        linkedTripleKey: pendingTriple.key,
      };

      // Buscar si ya existe una Coca de promo del mismo tipo y agregar a su cantidad
      const existingCoke = cart.items.find(
        (i) => i.meta?.isCokePromo && i.key === bebidaItem.key
      );

      if (existingCoke) {
        // Incrementar cantidad
        cart.setQty(bebidaItem.key, (existingCoke.qty || 1) + 1);
      } else {
        // Agregar nueva
        cart.add(bebidaItem);
      }

      // Cerrar modal
      cancel();

      return true;
    },
    [pendingTriple, selectedVariety, cancel],
  );

  return {
    modalOpen,
    pendingTriple,
    selectedVariety,
    openCokeModal,
    selectVariety,
    confirmAndAdd,
    cancel,
  };
}
