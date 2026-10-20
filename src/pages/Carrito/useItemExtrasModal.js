import React from "react";
import { toast } from "../../utils/toast";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";
import {
  getPapasUpgradePrice,
} from "../../utils/papasPricing";
import { EXTRA_MEAT_ID, getMaxExtraMeat } from "../../utils/extraMeat";

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

  const papasContext = React.useMemo(() => {
    if (!modalItem || modalMode !== "papas") return null;
    return { size: modalItem.meta?.size };
  }, [modalItem, modalMode]);

  const modalItems = React.useMemo(() => {
    if (modalMode === "papas") {
      return papasMejoras.map((item) => ({
        ...item,
        price: getPapasUpgradePrice(item, papasContext),
      }));
    }
    return extraItems;
  }, [modalMode, papasMejoras, extraItems, papasContext]);

  // Tope de "Carne c/cheddar" segun el talle de la burger (o del pick, en una
  // promo). Vacio en modo papas: ese id no aparece en esa lista.
  const quantityCaps = React.useMemo(() => {
    if (modalMode === "papas" || !modalItem) return {};
    const size =
      modalTarget === "pick"
        ? modalItem.meta?.picks?.[modalPickIndex]?.size
        : modalItem.meta?.size;
    return { [EXTRA_MEAT_ID]: getMaxExtraMeat(size) };
  }, [modalMode, modalItem, modalTarget, modalPickIndex]);

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

      setModalSelectedIds((prev) => {
        if (modalMode === "papas") {
          // Solo una mejora de papas a la vez.
          return prev.includes(id) ? [] : [id];
        }
        return prev.includes(id)
          ? prev.filter((itemId) => itemId !== id)
          : [...prev, id];
      });
    },
    [modalItems, modalMode],
  );

  // Para agregados con tope (ej. "Carne c/cheddar"): suma o saca UNA unidad,
  // a diferencia de toggleModalSelection que prende/apaga del todo.
  const adjustQuantity = React.useCallback(
    (id, delta) => {
      setModalSelectedIds((prev) => {
        if (delta > 0) {
          const count = prev.filter((x) => x === id).length;
          if (count >= (quantityCaps[id] ?? 0)) return prev;
          return [...prev, id];
        }
        const idx = prev.lastIndexOf(id);
        if (idx === -1) return prev;
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
    },
    [quantityCaps],
  );

  const applyModalSelection = React.useCallback(() => {
    if (!modalItem) return;

    // .map sobre modalSelectedIds (no .filter del catalogo) para conservar
    // agregados repetidos, ej. varias "Carne c/cheddar".
    const selectedExtras = modalSelectedIds
      .map((id) => modalItems.find((item) => item.id === id))
      .filter((item) => item && !isItemUnavailable(item));

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
  const clearLabel = modalMode === "papas" ? "Quitar mejoras" : "Quitar agregados";
  const title = modalMode === "papas" ? "Mejorar papas" : "Agregados";
  const description =
    modalMode === "papas" ? "" : "Agrega extras a este producto.";
  const clearHandler = hasClearSelection ? clearModalSelectionAndApply : undefined;

  return {
    modalItem,
    modalMode,
    modalItems,
    modalSelectedIds,
    quantityCaps,
    openExtrasModal,
    toggleModalSelection,
    adjustQuantity,
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
