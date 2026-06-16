import { bebidas, cervezas, extras } from "../../data/menu";
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

  const allDrinks = [
    ...bebidas.map((b) => ({ ...b, _itemType: "bebida" })),
    ...cervezas.map((c) => ({ ...c, _itemType: "cerveza" })),
  ];

  const bebidaModal = useBebidaModal({
    cart,
    bebidaItems: allDrinks,
  });

  return {
    extrasModal,
    removeModal,
    bebidaModal,
  };
}
