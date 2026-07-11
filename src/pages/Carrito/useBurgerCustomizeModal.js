import React from "react";
import { toast } from "../../utils/toast";

export default function useBurgerCustomizeModal({ cart, burgersById, extraItems }) {
  const [scopeItemKey, setScopeItemKey] = React.useState(null);
  const [modalItemKey, setModalItemKey] = React.useState(null);
  const [scope, setScope] = React.useState(null);

  const scopeItem = React.useMemo(
    () => cart.items.find((it) => it.key === scopeItemKey) || null,
    [cart.items, scopeItemKey],
  );

  const modalItem = React.useMemo(
    () => cart.items.find((it) => it.key === modalItemKey) || null,
    [cart.items, modalItemKey],
  );

  const burgerConfig = React.useMemo(() => {
    const burgerId = modalItem?.meta?.burgerId || scopeItem?.meta?.burgerId;
    return burgerId ? burgersById[burgerId] : null;
  }, [modalItem, scopeItem, burgersById]);

  const openCustomize = React.useCallback((item) => {
    if (item.qty > 1) {
      setScopeItemKey(item.key);
      setModalItemKey(null);
      setScope(null);
    } else {
      setScopeItemKey(null);
      setModalItemKey(item.key);
      setScope("all");
    }
  }, []);

  const chooseScope = React.useCallback((chosenScope) => {
    if (!scopeItemKey) return;
    setModalItemKey(scopeItemKey);
    setScope(chosenScope);
    setScopeItemKey(null);
  }, [scopeItemKey]);

  const cancelScopeChoice = React.useCallback(() => {
    setScopeItemKey(null);
  }, []);

  const closeModal = React.useCallback(() => {
    setModalItemKey(null);
    setScope(null);
  }, []);

  const applyChanges = React.useCallback(
    (modifiers) => {
      if (!modalItem) return;
      cart.applyBurgerLineModifiers(modalItem, scope, modifiers);
      toast.success("Cambios aplicados.");
      closeModal();
    },
    [modalItem, scope, cart, closeModal],
  );

  return {
    scopeChoiceOpen: Boolean(scopeItem),
    scopeChoiceLabel: scopeItem?.name || "",
    chooseScope,
    cancelScopeChoice,
    modalOpen: Boolean(modalItem),
    modalItem,
    scope,
    extras: extraItems,
    removableIngredients: burgerConfig?.removableIngredients || [],
    openCustomize,
    applyChanges,
    closeModal,
  };
}
