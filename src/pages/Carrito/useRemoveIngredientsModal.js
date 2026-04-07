import React from "react";

export default function useRemoveIngredientsModal({ cart, burgersById }) {
  const [modalItemKey, setModalItemKey] = React.useState(null);
  const [modalPickIndex, setModalPickIndex] = React.useState(null);
  const [selectedIds, setSelectedIds] = React.useState([]);

  const modalItem = React.useMemo(
    () => cart.items.find((it) => it.key === modalItemKey) || null,
    [cart.items, modalItemKey],
  );

  const modalBurgerId = React.useMemo(() => {
    if (!modalItem) return null;
    if (modalPickIndex == null) return modalItem.meta?.burgerId;
    return modalItem.meta?.picks?.[modalPickIndex]?.id || null;
  }, [modalItem, modalPickIndex]);

  const modalIngredients = React.useMemo(() => {
    if (!modalBurgerId) return [];
    return burgersById[modalBurgerId]?.removableIngredients || [];
  }, [modalBurgerId, burgersById]);

  const title = React.useMemo(() => {
    if (!modalItem) return "";
    if (modalPickIndex == null) return `Quitar a ${modalItem.name}`;
    const pick = modalItem.meta?.picks?.[modalPickIndex];
    return `Quitar a ${pick?.name || pick?.id || "burger"}`;
  }, [modalItem, modalPickIndex]);

  const openRemoveModal = React.useCallback((item, pickIndex = null) => {
    setModalItemKey(item.key);
    setModalPickIndex(pickIndex);
    if (pickIndex == null) {
      setSelectedIds((item.removedIngredients || []).map((ing) => ing.id));
    } else {
      const pick = item.meta?.picks?.[pickIndex];
      setSelectedIds((pick?.removedIngredients || []).map((ing) => ing.id));
    }
  }, []);

  const toggleSelection = React.useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedIds([]);
  }, []);

  const reset = React.useCallback(() => {
    setModalItemKey(null);
    setModalPickIndex(null);
    setSelectedIds([]);
  }, []);

  const applySelection = React.useCallback(() => {
    if (!modalItem) return;
    const selected = modalIngredients.filter((ing) => selectedIds.includes(ing.id));

    if (modalPickIndex == null) {
      cart.setRemovedIngredients(modalItem.key, selected);
    } else {
      const picks = (modalItem.meta?.picks || []).map((pick, idx) =>
        idx === modalPickIndex ? { ...pick, removedIngredients: selected } : pick,
      );
      cart.setPromoPicks(modalItem.key, picks);
    }
    reset();
  }, [modalItem, modalIngredients, selectedIds, modalPickIndex, cart, reset]);

  return {
    modalItem,
    modalIngredients,
    modalSelectedIds: selectedIds,
    title,
    openRemoveModal,
    toggleSelection,
    clearSelection,
    applySelection,
    closeRemoveModal: reset,
  };
}
