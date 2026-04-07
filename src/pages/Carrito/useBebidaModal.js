import React from "react";
import { toast } from "../../utils/toast";
import { isItemUnavailable } from "../../utils/availability";
import { createBebidaItem } from "../../utils/cartItemBuilders";
import { buildBebidaQuantitiesInitial } from "./carritoUtils";
import { useStoreStatus } from "../../utils/storeClosedMode";
import { TOAST_KEYS } from "../../constants/toastKeys";

export default function useBebidaModal({ cart, bebidaItems }) {
  const { closedToastText, isClosed } = useStoreStatus();
  const [bebidaOpen, setBebidaOpen] = React.useState(false);
  const [bebidaQuantities, setBebidaQuantities] = React.useState({});

  const closeBebidaModal = React.useCallback(() => {
    setBebidaOpen(false);
    setBebidaQuantities({});
  }, []);

  const openBebidaModal = React.useCallback(() => {
    setBebidaQuantities(buildBebidaQuantitiesInitial(bebidaItems));
    setBebidaOpen(true);
  }, [bebidaItems]);

  const adjustBebidaQty = React.useCallback((id, delta) => {
    setBebidaQuantities((prev) => {
      const current = prev[id] || 0;
      const nextQty = Math.max(current + delta, 0);
      return { ...prev, [id]: nextQty };
    });
  }, []);

  const applyBebidaSelection = React.useCallback(() => {
    if (isClosed) {
      toast.error(closedToastText, {
        key: TOAST_KEYS.STORE_CLOSED_BEBIDAS_MODAL,
      });
      return;
    }
    const selected = bebidaItems.filter(
      (item) => !isItemUnavailable(item) && (bebidaQuantities[item.id] || 0) > 0,
    );
    if (!selected.length) return;

    selected.forEach((item) => {
      const qty = bebidaQuantities[item.id] || 0;
      cart.add(createBebidaItem(item, qty));
    });

    toast.success(
      selected.length === 1 ? `+ ${selected[0].name}` : "Bebidas agregadas.",
    );

    closeBebidaModal();
  }, [bebidaItems, bebidaQuantities, cart, closeBebidaModal, closedToastText, isClosed]);

  return {
    bebidaOpen,
    bebidaQuantities,
    openBebidaModal,
    closeBebidaModal,
    adjustBebidaQty,
    applyBebidaSelection,
  };
}
