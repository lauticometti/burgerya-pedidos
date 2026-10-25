import React from "react";

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
      // Las Cocas de regalo se derivan de meta.cokeGifts de cada burger: al
      // sacar esta linea el carrito quita solo sus regalos, y el undo las
      // vuelve a sumar (si la promo sigue vigente) porque el item las conserva.
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
