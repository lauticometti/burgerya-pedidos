import React from "react";
import { createBebidaItem } from "../../utils/cartItemBuilders";
import { createCokePromoEntry, decrementCokePromoStock, incrementCokePromoStock, isCokePromoAvailable, canOfferCokePromo } from "../../utils/cokePromo";

/**
 * Hook para manejar incrementos/decrementos de triples elegibles con Coca gratis.
 * Detecta cuando una triple elegible cambia de cantidad y:
 * - En incremento: abre modal para elegir Coca
 * - En decremento: elimina Coca asociada
 */
export default function useTripleQtyManager(cart, burgersById) {
  const [pendingQtyChange, setPendingQtyChange] = React.useState(null);
  const [qtyModalOpen, setQtyModalOpen] = React.useState(false);
  const [selectedCokeVariety, setSelectedCokeVariety] = React.useState(null);

  const openQtyModal = React.useCallback((item, newQty) => {
    setPendingQtyChange({ item, newQty });
    setSelectedCokeVariety(null);
    setQtyModalOpen(true);
  }, []);

  const cancelQtyChange = React.useCallback(() => {
    setQtyModalOpen(false);
    setPendingQtyChange(null);
    setSelectedCokeVariety(null);
  }, []);

  const confirmQtyChange = React.useCallback(
    (selectedVariety) => {
      if (!pendingQtyChange) return false;

      const { item, newQty } = pendingQtyChange;
      const oldQty = item.qty || 1;
      const qtyDiff = newQty - oldQty;

      // Aplicar el cambio de cantidad
      if (newQty <= 0) {
        cart.remove(item.key);
        // Eliminar todas las Cocas asociadas a esta triple
        const relatedCokes = cart.items.filter(
          (i) => i.meta?.linkedTripleKey === item.key && i.meta?.isCokePromo
        );
        relatedCokes.forEach((coke) => {
          cart.remove(coke.key);
          incrementCokePromoStock(coke.key.replace("bebida:", ""));
        });
      } else {
        cart.setQty(item.key, newQty);

        // Si es incremento de triple elegible, agregar Cocas correspondientes
        if (qtyDiff > 0 && selectedVariety) {
          for (let i = 0; i < qtyDiff; i++) {
            const cokeEntry = createCokePromoEntry(selectedVariety);
            const bebidaItem = createBebidaItem(
              {
                id: selectedVariety,
                name: cokeEntry.name,
                orderName: cokeEntry.name,
                price: 0,
              },
              1
            );

            bebidaItem.meta = {
              ...bebidaItem.meta,
              isCokePromo: true,
              cokePromoLabel: cokeEntry.ticketLabel,
              linkedTripleKey: item.key,
            };

            cart.add(bebidaItem);
            decrementCokePromoStock(selectedVariety);
          }
        }
        // Si es decremento, eliminar Cocas asociadas
        else if (qtyDiff < 0) {
          const relatedCokes = cart.items.filter(
            (i) => i.meta?.linkedTripleKey === item.key && i.meta?.isCokePromo
          );
          // Eliminar las últimas -qtyDiff Cocas
          for (let i = 0; i < Math.abs(qtyDiff) && relatedCokes.length > 0; i++) {
            const cokeToRemove = relatedCokes.pop();
            cart.remove(cokeToRemove.key);
            const varietyId = cokeToRemove.key.replace("bebida:", "");
            incrementCokePromoStock(varietyId);
          }
        }
      }

      cancelQtyChange();
      return true;
    },
    [pendingQtyChange, cart, cancelQtyChange]
  );

  /**
   * Manejar cambio de cantidad en una triple elegible.
   * Si es incremento: abrir modal.
   * Si es decremento: aplicar directamente.
   */
  const handleTripleQtyChange = React.useCallback(
    (item, newQty) => {
      if (!isCokePromoAvailable() || !canOfferCokePromo(item)) {
        // No es triple elegible: cambiar cantidad normalmente
        if (newQty <= 0) {
          cart.remove(item.key);
        } else {
          cart.setQty(item.key, newQty);
        }
        return;
      }

      const oldQty = item.qty || 1;

      if (newQty > oldQty) {
        // Incremento: abrir modal
        openQtyModal(item, newQty);
      } else if (newQty < oldQty) {
        // Decremento: eliminar directamente sin modal
        confirmQtyChange(null);
      } else if (newQty <= 0) {
        // Eliminar: eliminar directamente
        confirmQtyChange(null);
      }
    },
    [cart, openQtyModal, confirmQtyChange, isCokePromoAvailable, canOfferCokePromo]
  );

  return {
    qtyModalOpen,
    selectedCokeVariety,
    pendingNewQty: pendingQtyChange?.newQty,
    setSelectedCokeVariety,
    handleTripleQtyChange,
    confirmQtyChange: () => confirmQtyChange(selectedCokeVariety),
    cancelQtyChange,
  };
}
