import React from "react";
import { toast } from "../../utils/toast";
import { isItemUnavailable } from "../../utils/availability";
import { buildBebidaQuantitiesInitial } from "./carritoUtils";

export default function useBebidaModal({ cart, bebidaItems }) {
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
    const selected = bebidaItems.filter(
      (item) => !isItemUnavailable(item) && (bebidaQuantities[item.id] || 0) > 0,
    );
    if (!selected.length) return;

    selected.forEach((item) => {
      const qty = bebidaQuantities[item.id] || 0;
      cart.add({
        key: `bebida:${item.id}`,
        name: item.name,
        qty,
        unitPrice: item.price,
        meta: { type: "bebida" },
      });
    });

    toast.success(
      selected.length === 1 ? `+ ${selected[0].name}` : "Bebidas agregadas.",
    );

    closeBebidaModal();
  }, [bebidaItems, bebidaQuantities, cart, closeBebidaModal]);

  return {
    bebidaOpen,
    bebidaQuantities,
    openBebidaModal,
    closeBebidaModal,
    adjustBebidaQty,
    applyBebidaSelection,
  };
}
