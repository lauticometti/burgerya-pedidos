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

      // crear linea custom (qty 1)
      items[lineItem.key] = { ...lineItem, qty: 1 };

      return { ...state, items };
    }

    // setea UN solo upgrade de papas por burgerline
    case "SET_PAPAS_UP": {
      const { lineId, item } = action;
      const items = { ...state.items };

      // borrar cualquier upgrade anterior de esa linea
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
        lastAdded: item.name,
        items: {
          ...state.items,
          [item.key]: {
            ...item,
            qty,
            note: item.note || existing?.note || "",
            extras: item.extras || existing?.extras || [],
            papas: item.papas || existing?.papas || [],
          },
        },
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
    case "SET_NOTE": {
      const { key, note } = action;
      const items = { ...state.items };
      if (items[key]) {
        items[key] = { ...items[key], note };
      }
      return { ...state, items };
    }
    case "SET_EXTRAS": {
      const { key, extras } = action;
      const items = { ...state.items };
      if (items[key]) {
        items[key] = { ...items[key], extras };
      }
      return { ...state, items };
    }
    case "SET_PAPAS": {
      const { key, papas } = action;
      const items = { ...state.items };
      if (items[key]) {
        items[key] = { ...items[key], papas };
      }
      return { ...state, items };
    }
    case "SET_PROMO_PICKS": {
      const { key, picks } = action;
      const items = { ...state.items };
      if (items[key]) {
        items[key] = {
          ...items[key],
          meta: { ...items[key].meta, picks },
        };
      }
      return { ...state, items };
    }
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: {}, lastAdded: null });

  const api = useMemo(() => {
    const items = Object.values(state.items);
      const total = items.reduce((sum, it) => {
        const extrasTotal = (it.extras || []).reduce(
          (extrasSum, extra) => extrasSum + extra.price,
          0,
        );
        const papasTotal = (it.papas || []).reduce(
          (papasSum, extra) => papasSum + extra.price,
          0,
        );
        const picksExtrasTotal = (it.meta?.picks || []).reduce(
          (picksSum, pick) => {
          const pickExtras = (pick.extras || []).reduce(
            (pickSum, extra) => pickSum + extra.price,
            0,
          );
          const pickPapas = (pick.papas || []).reduce(
            (pickSum, extra) => pickSum + extra.price,
            0,
          );
          return picksSum + pickExtras + pickPapas;
        },
        0,
      );
      return sum + it.qty * (it.unitPrice + extrasTotal + papasTotal + picksExtrasTotal);
    }, 0);
    return {
      items,
      total,
      lastAdded: state.lastAdded,
      add: (item) => dispatch({ type: "ADD", item }),
      remove: (key) => dispatch({ type: "REMOVE", key }),
      clear: () => dispatch({ type: "CLEAR" }),
      setQty: (key, qty) => dispatch({ type: "SET_QTY", key, qty }),
      setNote: (key, note) => dispatch({ type: "SET_NOTE", key, note }),
      setExtras: (key, extras) => dispatch({ type: "SET_EXTRAS", key, extras }),
      setPapas: (key, papas) => dispatch({ type: "SET_PAPAS", key, papas }),
      setPromoPicks: (key, picks) =>
        dispatch({ type: "SET_PROMO_PICKS", key, picks }),
    };
  }, [state.items, state.lastAdded]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

