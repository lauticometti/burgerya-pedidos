import React from "react";
import { bebidas, extras } from "../../data/menu";
import useItemExtrasModal from "./useItemExtrasModal";
import useRemoveIngredientsModal from "./useRemoveIngredientsModal";
import useBebidaModal from "./useBebidaModal";

export default function useCarritoModals(cart, burgersById, papasMejoras) {
  const extrasModal = useItemExtrasModal({
    cart,
    papasMejoras,
    extraItems: extras,
  });

  const removeModal = useRemoveIngredientsModal({
    cart,
    burgersById,
  });

  const bebidaModal = useBebidaModal({
    cart,
    bebidaItems: bebidas,
  });

  return {
    extrasModal,
    removeModal,
    bebidaModal,
  };
}
