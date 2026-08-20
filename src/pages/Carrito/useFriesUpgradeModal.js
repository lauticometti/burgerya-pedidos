import React from "react";
import { toast } from "../../utils/toast";
import { canUpgradeFries, hasFriesUpgrade } from "../../utils/friesUpgrade";

/**
 * Flujo de "Mejorar papas" en el carrito.
 *
 * - qty === 1  → se aplica (o se saca) derecho, sin preguntar nada.
 * - qty  >  1  → abre el modal de cantidad para splitear la linea.
 *
 * El toggle se resuelve contra el estado ACTUAL de la variante: si la linea ya
 * tiene las papas mejoradas, el boton saca la mejora; si no, la aplica.
 */
export default function useFriesUpgradeModal(cart) {
  const [targetKey, setTargetKey] = React.useState(null);
  const [count, setCount] = React.useState(1);

  const targetItem = React.useMemo(
    () => cart.items.find((it) => it.key === targetKey) || null,
    [cart.items, targetKey],
  );

  const close = React.useCallback(() => {
    setTargetKey(null);
    setCount(1);
  }, []);

  const apply = React.useCallback(
    (item, enabled, units) => {
      cart.setFriesUpgrade(item, enabled, units);
      const suffix = units > 1 ? ` (${units})` : "";
      toast.success(
        enabled ? `Papas mejoradas${suffix}.` : `Mejora de papas quitada${suffix}.`,
      );
    },
    [cart],
  );

  const toggle = React.useCallback(
    (item) => {
      if (!canUpgradeFries(item)) return;

      // Una sola unidad: no hay nada que preguntar.
      if (item.qty <= 1) {
        apply(item, !hasFriesUpgrade(item), 1);
        return;
      }

      // Varias unidades: preguntamos a cuantas. Por defecto, a todas.
      setTargetKey(item.key);
      setCount(item.qty);
    },
    [apply],
  );

  const confirm = React.useCallback(
    (units) => {
      if (!targetItem) return;
      apply(targetItem, !hasFriesUpgrade(targetItem), units);
      close();
    },
    [targetItem, apply, close],
  );

  const changeCount = React.useCallback(
    (next) => {
      if (!targetItem) return;
      setCount(Math.min(Math.max(next, 1), targetItem.qty));
    },
    [targetItem],
  );

  return {
    open: Boolean(targetItem),
    // Si la variante ya esta mejorada, el modal pregunta a cuantas sacarsela.
    mode: targetItem && hasFriesUpgrade(targetItem) ? "downgrade" : "upgrade",
    item: targetItem,
    count: targetItem ? Math.min(count, targetItem.qty) : 1,
    maxCount: targetItem?.qty || 1,
    toggle,
    changeCount,
    confirm,
    close,
  };
}
