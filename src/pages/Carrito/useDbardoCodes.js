import React from "react";
import { toast } from "../../utils/toast";
import { getStoreNow } from "../../utils/storeClosedMode";
import { evaluateDbardoStack, normalizeDbardoCode } from "../../utils/coupons";

// Códigos D BARDO (stickers de tragos): a diferencia del resto de los
// cupones, se pueden acumular varios en el mismo pedido (tope $30.000 total,
// ver evaluateDbardoStack). Este hook guarda la LISTA de códigos aplicados;
// el detalle de cada uno (tier, a qué burger apunta, cuánto descuenta) se
// recalcula siempre en vivo contra el carrito actual.
export default function useDbardoCodes(cartItems, cartTotal) {
  const [dbardoCodes, setDbardoCodes] = React.useState([]); // ["DB-BT3N", ...]

  const stack = React.useMemo(
    () =>
      evaluateDbardoStack({
        codes: dbardoCodes,
        cartItems,
        cartTotal,
        now: getStoreNow(),
      }),
    [dbardoCodes, cartItems, cartTotal],
  );

  // Agrega un código a partir del texto tal cual lo escribió el cliente.
  // Devuelve true si se aplicó, false si hubo error (y ya mostró el toast).
  const addDbardoCode = React.useCallback(
    (rawText) => {
      const text = (rawText || "").trim();
      if (!text) return false;
      const properCode = normalizeDbardoCode(text);
      if (!properCode) {
        toast.error("Código inválido");
        return false;
      }
      if (dbardoCodes.includes(properCode)) {
        toast.error("Ese código ya está aplicado");
        return false;
      }
      const trial = evaluateDbardoStack({
        codes: [...dbardoCodes, properCode],
        cartItems,
        cartTotal,
        now: getStoreNow(),
      });
      const newEntry = trial.entries[trial.entries.length - 1];
      if (newEntry.error) {
        toast.error(newEntry.error);
        return false;
      }
      setDbardoCodes((prev) => [...prev, properCode]);
      toast.success(
        newEntry.tier === "burger"
          ? `✓ ${newEntry.code}: ${newEntry.targetBurgerName} doble gratis`
          : `✓ ${newEntry.code}: ${newEntry.tier}% off`,
      );
      return true;
    },
    [dbardoCodes, cartItems, cartTotal],
  );

  const removeDbardoCode = React.useCallback((code) => {
    setDbardoCodes((prev) => prev.filter((c) => c !== code));
  }, []);

  const clearDbardoCodes = React.useCallback(() => {
    setDbardoCodes([]);
  }, []);

  // Revalida todos los códigos justo antes de enviar, igual que el cupón
  // simple: si alguno dejó de aplicar (venció, o ya no queda doble para
  // regalar), se saca de la lista y se avisa antes de mandar el pedido.
  const revalidateDbardoCodes = React.useCallback(() => {
    if (!dbardoCodes.length) return true;
    const fresh = evaluateDbardoStack({
      codes: dbardoCodes,
      cartItems,
      cartTotal,
      now: getStoreNow(),
    });
    const failed = fresh.entries.filter((e) => e.error);
    if (!failed.length) return true;
    const failedCodes = new Set(failed.map((f) => f.code));
    setDbardoCodes((prev) => prev.filter((c) => !failedCodes.has(c)));
    toast.error(
      `${[...failedCodes].join(", ")}: ${failed[0].error}. Revisá tu pedido y volvé a enviarlo.`,
    );
    return false;
  }, [dbardoCodes, cartItems, cartTotal]);

  return {
    dbardoCodes,
    dbardoEntries: stack.entries.filter((e) => !e.error),
    dbardoTotalDiscount: stack.totalDiscount,
    dbardoCapped: stack.capped,
    dbardoGiveawayTargets: stack.giveawayTargets,
    addDbardoCode,
    removeDbardoCode,
    clearDbardoCodes,
    revalidateDbardoCodes,
  };
}
