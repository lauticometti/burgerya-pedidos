import React from "react";
import { createBebidaItem } from "../../utils/cartItemBuilders";
import { createCokePromoEntry } from "../../utils/cokePromo";

/**
 * Hook para manejar la elección entre:
 * - Mantener precio del día SIN Coca
 * - Pagar precio normal CON Coca gratis
 */
export default function useCokePromoChoice() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [pendingTriple, setPendingTriple] = React.useState(null);
  const [selectedVariety, setSelectedVariety] = React.useState(null);
  const [priceInfo, setPriceInfo] = React.useState({ daily: 0, normal: 0 });

  const openChoiceModal = React.useCallback((tripleItem, { dailyPrice, normalPrice }) => {
    setPendingTriple(tripleItem);
    setPriceInfo({ daily: dailyPrice, normal: normalPrice });
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

  // Opción 1: Mantener precio del día (sin Coca)
  const chooseDiscountedPrice = React.useCallback(
    (cart) => {
      if (!pendingTriple) return false;
      cart.add(pendingTriple);
      cancel();
      return true;
    },
    [pendingTriple, cancel],
  );

  // Opción 2: Pagar precio normal y agregar Coca gratis
  const chooseNormalPriceWithCoke = React.useCallback(
    (cart, tripleNormalPrice) => {
      if (!pendingTriple || !selectedVariety) return false;

      // Ajustar el precio del item a precio normal (remover descuento del día)
      const adjustedTriple = {
        ...pendingTriple,
        unitPrice: tripleNormalPrice,
        meta: {
          ...pendingTriple.meta,
          basePrice: tripleNormalPrice,
          discountAmount: 0,
          offerId: null,
          offerLabel: null,
        },
      };

      // Agregar la triple al carrito con precio normal
      cart.add(adjustedTriple);

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
        linkedTripleKey: adjustedTriple.key,
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
    priceInfo,
    openChoiceModal,
    selectVariety,
    chooseDiscountedPrice,
    chooseNormalPriceWithCoke,
    cancel,
  };
}
