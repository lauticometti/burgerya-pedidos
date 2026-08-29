import React from "react";
import { incrementCokePromoStock } from "../../utils/cokePromo";

export default function useCartUndo(cart) {
  const [undoItem, setUndoItem] = React.useState(null);
  const undoTimerRef = React.useRef(null);

  const clearUndoTimer = React.useCallback(() => {
    if (!undoTimerRef.current) return;
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
  }, []);

  React.useEffect(() => {
    return () => {
      clearUndoTimer();
    };
  }, [clearUndoTimer]);

  const handleRemove = React.useCallback(
    (item, groupKey, index) => {
      // Si se elimina una Coca de promo, restaurar el stock
      if (item.meta?.isCokePromo) {
        const varietyId = item.key.replace("bebida:", "");
        incrementCokePromoStock(varietyId);
      }

      // Si se elimina una triple, eliminar también sus Cocas de promo asociadas
      if (item.meta?.type === "burger" && item.meta?.size === "triple") {
        const linkedCokes = cart.items.filter(
          (i) => i.meta?.linkedTripleKey === item.key && i.meta?.isCokePromo
        );
        linkedCokes.forEach((coke) => {
          const varietyId = coke.key.replace("bebida:", "");
          incrementCokePromoStock(varietyId);
          cart.remove(coke.key);
        });
      }

      cart.remove(item.key);
      clearUndoTimer();

      setUndoItem({ item, groupKey, index });
      undoTimerRef.current = setTimeout(() => {
        setUndoItem(null);
        undoTimerRef.current = null;
      }, 3000);
    },
    [cart, clearUndoTimer],
  );

  const handleUndo = React.useCallback(() => {
    if (!undoItem?.item) return;
    cart.add({
      ...undoItem.item,
      qty: undoItem.item.qty || 1,
      meta: { ...undoItem.item.meta, allowDuringClosed: true },
    });
    setUndoItem(null);
    clearUndoTimer();
  }, [undoItem, cart, clearUndoTimer]);

  return {
    undoItem,
    handleRemove,
    handleUndo,
  };
}
