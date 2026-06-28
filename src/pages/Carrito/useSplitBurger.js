import { useState, useCallback } from "react";
import { extras as allExtras } from "../../data/menu";
import { buildBurgerCartItem } from "../Burgers/burgersUtils";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";

export default function useSplitBurger(cart, burgersById) {
  const [state, setState] = useState({
    open: false,
    item: null,
    removedIds: [],
    extrasIds: [],
  });

  const openSplit = useCallback((item) => {
    setState({
      open: true,
      item,
      removedIds: [...(item.meta?.removedIngredientIds || [])],
      extrasIds: [...(item.meta?.extrasIds || [])],
    });
  }, []);

  const closeSplit = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const toggleRemoved = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      removedIds: prev.removedIds.includes(id)
        ? prev.removedIds.filter((x) => x !== id)
        : [...prev.removedIds, id],
    }));
  }, []);

  const toggleExtra = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      extrasIds: prev.extrasIds.includes(id)
        ? prev.extrasIds.filter((x) => x !== id)
        : [...prev.extrasIds, id],
    }));
  }, []);

  const clearExtras = useCallback(() => {
    setState((prev) => ({ ...prev, extrasIds: [] }));
  }, []);

  const clearRemoved = useCallback(() => {
    setState((prev) => ({ ...prev, removedIds: [] }));
  }, []);

  const confirmSplit = useCallback(() => {
    const { item, removedIds, extrasIds } = state;
    if (!item) return;

    const burger = burgersById[item.meta?.burgerId];
    if (!burger) return;

    const size = item.meta?.size;
    const priceInfo = getBurgerPriceInfo(burger, size);
    const removableIngredients = burger.removableIngredients || [];
    const removedIngredients = removableIngredients.filter((ing) =>
      removedIds.includes(ing.id),
    );
    const selectedExtras = allExtras.filter((ex) => extrasIds.includes(ex.id));

    const newLineItem = buildBurgerCartItem(
      burger,
      size,
      priceInfo,
      removedIngredients,
      selectedExtras,
      [],
    );

    cart.splitBurger(item.key, newLineItem);
    closeSplit();
  }, [state, burgersById, cart, closeSplit]);

  const burger = state.item ? burgersById[state.item.meta?.burgerId] : null;

  return {
    open: state.open,
    item: state.item,
    burger,
    removedIds: state.removedIds,
    extrasIds: state.extrasIds,
    openSplit,
    closeSplit,
    toggleRemoved,
    toggleExtra,
    clearExtras,
    clearRemoved,
    confirmSplit,
  };
}
