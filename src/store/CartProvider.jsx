import React, { useMemo, useReducer } from "react";
import { CartContext } from "./cartContext";

function reducer(state, action) {
  switch (action.type) {
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
    return {
      items,
      total,
      add: (item) => dispatch({ type: "ADD", item }),
      remove: (key) => dispatch({ type: "REMOVE", key }),
      clear: () => dispatch({ type: "CLEAR" }),
      setQty: (key, qty) => dispatch({ type: "SET_QTY", key, qty }),
    };
  }, [state.items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}
