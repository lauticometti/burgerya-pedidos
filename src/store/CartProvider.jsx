import React, { useMemo, useReducer } from "react";
import { CartContext } from "./cartContext";

function reducer(state, action) {
  switch (action.type) {
    case "REMOVE_MANY": {
      const items = { ...state.items };
      for (const k of action.keys) delete items[k];
      return { ...state, items };
    }

    // baseKey: burger:<id>:<size>
    // lineItemKey: burgerline:<lineId>
    case "SPLIT_ONE": {
      const { baseKey, lineItem } = action;
      const base = state.items[baseKey];
      if (!base || base.qty <= 0) return state;

      const items = { ...state.items };

      // restar 1 al mergeable
      if (base.qty === 1) delete items[baseKey];
      else items[baseKey] = { ...base, qty: base.qty - 1 };

      // crear línea custom (qty 1)
      items[lineItem.key] = { ...lineItem, qty: 1 };

      return { ...state, items };
    }

    // setea UN solo upgrade de papas por burgerline
    case "SET_PAPAS_UP": {
      const { lineId, item } = action;
      const items = { ...state.items };

      // borrar cualquier upgrade anterior de esa línea
      for (const k of Object.keys(items)) {
        if (k.startsWith(`papasup:${lineId}:`)) delete items[k];
      }

      // si item es null, era solo "limpiar"
      if (item) items[item.key] = { ...item, qty: 1 };

      return { ...state, items };
    }

    case "ADD": {
      const item = action.item;
      const existing = state.items[item.key];
      const qty = (existing?.qty || 0) + (item.qty || 1);
      return {
        ...state,
        items: { ...state.items, [item.key]: { ...item, qty } },
      };
    }
    case "REMOVE": {
      const items = { ...state.items };
      delete items[action.key];
      return { ...state, items };
    }
    case "CLEAR":
      return { ...state, items: {} };
    default:
      return state;

    case "SET_QTY": {
      const { key, qty } = action;
      const items = { ...state.items };
      if (qty <= 0) delete items[key];
      else items[key] = { ...items[key], qty };
      return { ...state, items };
    }
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: {} });

  const api = useMemo(() => {
    const items = Object.values(state.items);
    const total = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    function makeLineId() {
      return `l-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function keysForChildren(lineId) {
      return items
        .map((it) => it.key)
        .filter(
          (k) =>
            k.startsWith(`extra:${lineId}:`) ||
            k.startsWith(`papasup:${lineId}:`),
        );
    }

    return {
      items,
      total,
      add: (item) => dispatch({ type: "ADD", item }),
      remove: (key) => dispatch({ type: "REMOVE", key }),
      clear: () => dispatch({ type: "CLEAR" }),
      setQty: (key, qty) => dispatch({ type: "SET_QTY", key, qty }),
      // Convierte 1 unidad de un item mergeable (burger:<id>:<size>) en una línea custom (burgerline:<lineId>)
      splitOne: (baseKey) => {
        const base = state.items[baseKey];
        if (!base) return null;

        const lineId = makeLineId();

        dispatch({
          type: "SPLIT_ONE",
          baseKey,
          lineItem: {
            key: `burgerline:${lineId}`,
            name: base.name, // lo usamos para UI, WhatsApp lo formatea aparte
            qty: 1,
            unitPrice: base.unitPrice,
            meta: {
              type: "burgerline",
              lineId,
              baseKey,
              burgerId: base.meta?.burgerId,
              size: base.meta?.size,
              burgerName: base.meta?.burgerName || base.name,
            },
          },
        });

        return lineId;
      },

      // Agrega un extra pegado a una burgerline
      addExtraToLine: (lineId, extra) => {
        dispatch({
          type: "ADD",
          item: {
            key: `extra:${lineId}:${extra.id}`,
            name: extra.name,
            qty: 1,
            unitPrice: extra.price,
            meta: { type: "extra", parentLineId: lineId },
          },
        });
      },

      // Setea upgrade de papas (uno solo) para esa burgerline
      setPapasUpgrade: (lineId, upgrade /* {id,name,price} o null */) => {
        dispatch({
          type: "SET_PAPAS_UP",
          lineId,
          item: upgrade
            ? {
                key: `papasup:${lineId}:${upgrade.id}`,
                name: upgrade.name, // EJ: "papas cheddar" / "papas cheddar y bacon"
                qty: 1,
                unitPrice: upgrade.price,
                meta: { type: "papasup", parentLineId: lineId },
              }
            : null,
        });
      },

      // Borra burgerline + sus hijos (extras + papasup)
      removeLine: (lineId) => {
        const childKeys = keysForChildren(lineId);
        dispatch({
          type: "REMOVE_MANY",
          keys: [`burgerline:${lineId}`, ...childKeys],
        });
      },
    };
  }, [state.items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}
