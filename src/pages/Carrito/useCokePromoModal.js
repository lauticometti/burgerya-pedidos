import React from "react";
import {
  canOfferCokePromo,
  hasCokePromoVarietyStock,
  isCokePromoAvailable,
} from "../../utils/cokePromo";

/**
 * Hook para el selector de Coca de regalo (Original / Zero) al agregar una
 * burger doble o triple.
 *
 * La variedad elegida viaja en meta.cokeGifts de la burger: el carrito arma
 * la linea "Coca de regalo" a partir de ahi (ver syncCokeGiftItems).
 *
 * Al confirmar se revalida la promo con la hora de ese instante. Si ya
 * termino, NO se agrega nada: el modal pasa a "expired" y el cliente decide
 * si agrega la burger igual (sin regalo, precio habitual) o cancela.
 */
export default function useCokePromoModal() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [pendingBurger, setPendingBurger] = React.useState(null);
  const [selectedVariety, setSelectedVariety] = React.useState(null);
  const [expired, setExpired] = React.useState(false);

  const openCokeModal = React.useCallback((burgerItem) => {
    setPendingBurger(burgerItem);
    setSelectedVariety(null);
    setExpired(false);
    setModalOpen(true);
  }, []);

  const selectVariety = React.useCallback((varietyId) => {
    setSelectedVariety(varietyId);
  }, []);

  const cancel = React.useCallback(() => {
    setModalOpen(false);
    setPendingBurger(null);
    setSelectedVariety(null);
    setExpired(false);
  }, []);

  /** Agrega burger + regalo. Devuelve "added", "expired" o false. */
  const confirmAndAdd = React.useCallback(
    (cart) => {
      if (!pendingBurger || !selectedVariety) return false;

      if (
        !isCokePromoAvailable() ||
        !canOfferCokePromo(pendingBurger) ||
        !hasCokePromoVarietyStock(selectedVariety)
      ) {
        setExpired(true);
        return "expired";
      }

      cart.add({
        ...pendingBurger,
        meta: { ...pendingBurger.meta, cokeGifts: [selectedVariety] },
      });
      cancel();
      return "added";
    },
    [pendingBurger, selectedVariety, cancel],
  );

  /** Promo vencida: el cliente confirma la burger sola, sin regalo. */
  const addWithoutGift = React.useCallback(
    (cart) => {
      if (!pendingBurger) return false;
      cart.add(pendingBurger);
      cancel();
      return true;
    },
    [pendingBurger, cancel],
  );

  return {
    modalOpen,
    pendingBurger,
    selectedVariety,
    expired,
    openCokeModal,
    selectVariety,
    confirmAndAdd,
    addWithoutGift,
    cancel,
  };
}
