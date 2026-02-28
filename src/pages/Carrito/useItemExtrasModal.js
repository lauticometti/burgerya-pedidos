import React from "react";
import { toast } from "../../utils/toast";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";

export default function useItemExtrasModal({ cart, papasMejoras, extraItems }) {
  const [modalItemKey, setModalItemKey] = React.useState(null);
  const [modalMode, setModalMode] = React.useState(null);
  const [modalTarget, setModalTarget] = React.useState("item");
  const [modalPickIndex, setModalPickIndex] = React.useState(null);
  const [modalSelectedIds, setModalSelectedIds] = React.useState([]);

  const modalItem = React.useMemo(
    () => cart.items.find((item) => item.key === modalItemKey) || null,
    [cart.items, modalItemKey],
  );

  const modalItems = React.useMemo(() => {
    if (modalMode === "papas") return papasMejoras;
    return extraItems;
  }, [modalMode, papasMejoras, extraItems]);

  const resetModalState = React.useCallback(() => {
    setModalItemKey(null);
    setModalMode(null);
    setModalTarget("item");
    setModalPickIndex(null);
    setModalSelectedIds([]);
  }, []);

  const openExtrasModal = React.useCallback((item, mode, pickIndex = null) => {
    setModalItemKey(item.key);
    setModalMode(mode);

    if (pickIndex == null) {
      setModalTarget("item");
      setModalPickIndex(null);
      const selected = mode === "papas" ? item.papas || [] : item.extras || [];
      setModalSelectedIds(selected.map((extra) => extra.id));
      return;
    }

    const pick = item.meta?.picks?.[pickIndex];
    const pickExtras = mode === "papas" ? pick?.papas : pick?.extras;
    setModalTarget("pick");
    setModalPickIndex(pickIndex);
    setModalSelectedIds((pickExtras || []).map((extra) => extra.id));
  }, []);

  const toggleModalSelection = React.useCallback(
    (id) => {
      const selectedItem = modalItems.find((item) => item.id === id);
      if (isItemUnavailable(selectedItem)) {
        const reason = getUnavailableReason(selectedItem);
        toast.error(`${selectedItem.name}: ${reason}`, {
          key: `extra-unavailable:${selectedItem.id}`,
        });
        return;
      }

      setModalSelectedIds((prev) =>
        prev.includes(id)
          ? prev.filter((itemId) => itemId !== id)
          : [...prev, id],
      );
    },
    [modalItems],
  );

  const applyModalSelection = React.useCallback(() => {
    if (!modalItem) return;

    const selectedExtras = modalItems.filter(
      (item) => modalSelectedIds.includes(item.id) && !isItemUnavailable(item),
    );

    if (modalTarget === "item") {
      if (modalMode === "papas") {
        cart.setPapas(modalItem.key, selectedExtras);
      } else {
        cart.setExtras(modalItem.key, selectedExtras);
      }
      if (selectedExtras.length > 0) {
        toast.success(
          modalMode === "papas" ? "Papas mejoradas." : "Agregados aplicados.",
        );
      }
    } else {
      const picks = (modalItem.meta?.picks || []).map((pick, index) => {
        if (index !== modalPickIndex) return pick;
        if (modalMode === "papas") return { ...pick, papas: selectedExtras };
        return { ...pick, extras: selectedExtras };
      });
      cart.setPromoPicks(modalItem.key, picks);
      if (selectedExtras.length > 0) {
        toast.success(
          modalMode === "papas" ? "Papas mejoradas." : "Agregados aplicados.",
        );
      }
    }

    resetModalState();
  }, [
    modalItem,
    modalItems,
    modalSelectedIds,
    modalTarget,
    modalMode,
    modalPickIndex,
    cart,
    resetModalState,
  ]);

  const clearModalSelectionAndApply = React.useCallback(() => {
    if (!modalItem) return;

    if (modalTarget === "item") {
      if (modalMode === "papas") {
        cart.setPapas(modalItem.key, []);
        toast.success("Mejoras de papas quitadas.");
      } else {
        cart.setExtras(modalItem.key, []);
        toast.success("Agregados quitados.");
      }
    } else {
      const picks = (modalItem.meta?.picks || []).map((pick, index) => {
        if (index !== modalPickIndex) return pick;
        if (modalMode === "papas") return { ...pick, papas: [] };
        return { ...pick, extras: [] };
      });
      cart.setPromoPicks(modalItem.key, picks);
      toast.success(
        modalMode === "papas"
          ? "Mejoras de papas quitadas."
          : "Agregados quitados.",
      );
    }

    resetModalState();
  }, [modalItem, modalTarget, modalMode, modalPickIndex, cart, resetModalState]);

  const hasClearSelection = React.useMemo(() => {
    if (!modalItem) return false;
    if (modalTarget === "item") {
      return modalMode === "papas"
        ? !!modalItem.papas?.length
        : !!modalItem.extras?.length;
    }
    return modalMode === "papas"
      ? !!modalItem.meta?.picks?.[modalPickIndex]?.papas?.length
      : !!modalItem.meta?.picks?.[modalPickIndex]?.extras?.length;
  }, [modalItem, modalTarget, modalMode, modalPickIndex]);

  const disableApply = modalMode === "papas" && modalSelectedIds.length === 0;
  const applyLabel = modalMode === "papas" ? "Mejorar" : "Aplicar";
  const clearLabel = modalMode === "papas" ? "Quitar mejoras" : "Limpiar";
  const title = modalMode === "papas" ? "Mejorar papas" : "Agregados";
  const description = modalMode === "papas" ? "" : "Agrega extras a este producto.";
  const clearHandler = hasClearSelection ? clearModalSelectionAndApply : undefined;

  return {
    modalItem,
    modalMode,
    modalItems,
    modalSelectedIds,
    openExtrasModal,
    toggleModalSelection,
    applyModalSelection,
    closeExtrasModal: resetModalState,
    disableApply,
    applyLabel,
    clearLabel,
    clearHandler,
    title,
    description,
  };
}
