import React, { useEffect, useMemo, useReducer } from "react";
import { burgers } from "../data/menu";
import { CartContext } from "./cartContext";
import { getBurgerPriceInfo } from "../utils/burgerPricing";
import { getPapasUpgradePrice } from "../utils/papasPricing";
import { toast } from "../utils/toast";
import { useStoreStatus } from "../utils/storeClosedMode";
import {
  mutateItem,
  removeItems,
  removeItemsByPrefix,
  splitBurgerLine,
  setPapasUpgrade,
} from "./cartReducerActions";

function reducer(state, action) {
  switch (action.type) {
    case "REMOVE_MANY":
      return { ...state, items: removeItems(state.items, action.keys) };

    case "SPLIT_ONE":
      return {
        ...state,
        items: splitBurgerLine(state.items, action.baseKey, action.lineItem),
      };

    case "SET_PAPAS_UP":
      return {
        ...state,
        items: setPapasUpgrade(state.items, action.lineId, action.item),
      };

    case "ADD": {
      const item = action.item;
      const existing = state.items[item.key];
      const qty = (existing?.qty || 0) + (item.qty || 1);
      const mergedMeta = { ...existing?.meta, ...item.meta };
      if (!mergedMeta.removedIngredientIds) {
        mergedMeta.removedIngredientIds =
          item.meta?.removedIngredientIds ||
          existing?.meta?.removedIngredientIds ||
          [];
      }

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
            removedIngredients:
              item.removedIngredients || existing?.removedIngredients || [],
            meta: mergedMeta,
          },
        },
      };
    }

    case "REMOVE":
      return { ...state, items: removeItems(state.items, [action.key]) };

    case "CLEAR":
      return { ...state, items: {} };

    case "SET_QTY": {
      const { key, qty } = action;
      const items = { ...state.items };
      if (qty <= 0) delete items[key];
      else items[key] = { ...items[key], qty };
      return { ...state, items };
    }

    case "SET_NOTE":
      return {
        ...state,
        items: mutateItem(state.items, action.key, { note: action.note }),
      };

    case "SET_EXTRAS":
      return {
        ...state,
        items: mutateItem(state.items, action.key, { extras: action.extras }),
      };

    case "SET_PAPAS":
      return {
        ...state,
        items: mutateItem(state.items, action.key, { papas: action.papas }),
      };

    case "SET_REMOVED": {
      const { key, removedIngredients } = action;
      const current = state.items[key];
      if (!current) return state;

      const cleaned = (removedIngredients || []).filter(Boolean);
      const removedIds = cleaned.map((ing) => ing.id).filter(Boolean);

      return {
        ...state,
        items: mutateItem(state.items, key, {
          removedIngredients: cleaned,
          meta: {
            ...current.meta,
            removedIngredientIds: removedIds,
          },
        }),
      };
    }

    case "SET_PROMO_PICKS":
      return {
        ...state,
        items: mutateItem(state.items, action.key, {
          meta: { ...state.items[action.key]?.meta, picks: action.picks },
        }),
      };

    case "REPRICE_ITEMS": {
      const items = { ...state.items };
      let hasChanges = false;

      for (const update of action.updates || []) {
        const current = items[update.key];
        if (!current) continue;

        items[update.key] = {
          ...current,
          unitPrice: update.unitPrice,
          meta: {
            ...current.meta,
            ...update.meta,
          },
        };
        hasChanges = true;
      }

      return hasChanges ? { ...state, items } : state;
    }

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: {}, lastAdded: null });
  const { closedToastText, dateKey, isClosed, minutes } = useStoreStatus();
  const burgersById = useMemo(
    () => {
      const idx = {};
      for (const burger of burgers) {
        idx[burger.id] = burger;
      }
      return idx;
    },
    [],
  );

  useEffect(() => {
    const updates = Object.values(state.items).reduce((acc, item) => {
      if (item.meta?.type !== "burger") return acc;

      const burger = burgersById[item.meta?.burgerId];
      const size = item.meta?.size;
      if (!burger || !size) return acc;

      const priceInfo = getBurgerPriceInfo(burger, size);
      const nextMeta = {
        basePrice: priceInfo.basePrice,
        discountAmount: priceInfo.discountAmount,
        offerId: priceInfo.offerId,
        offerLabel: priceInfo.offerLabel,
      };
      const hasChanged =
        item.unitPrice !== priceInfo.finalPrice ||
        item.meta?.basePrice !== nextMeta.basePrice ||
        item.meta?.discountAmount !== nextMeta.discountAmount ||
        item.meta?.offerId !== nextMeta.offerId ||
        item.meta?.offerLabel !== nextMeta.offerLabel;

      if (hasChanged) {
        acc.push({
          key: item.key,
          unitPrice: priceInfo.finalPrice,
          meta: nextMeta,
        });
      }

      return acc;
    }, []);

    if (updates.length > 0) {
      dispatch({ type: "REPRICE_ITEMS", updates });
    }
  }, [burgersById, dateKey, minutes, state.items]);

  const api = useMemo(() => {
    const items = Object.values(state.items);
    const total = items.reduce((sum, it) => {
      const papasContext = { size: it.meta?.size, itemType: it.meta?.type };
      const extrasTotal = (it.extras || []).reduce(
        (extrasSum, extra) => extrasSum + extra.price,
        0,
      );
      const papasTotal = (it.papas || []).reduce(
        (papasSum, extra) => papasSum + getPapasUpgradePrice(extra, papasContext),
        0,
      );
      const picksExtrasTotal = (it.meta?.picks || []).reduce((picksSum, pick) => {
        const pickExtras = (pick.extras || []).reduce(
          (pickSum, extra) => pickSum + extra.price,
          0,
        );
        const pickPapas = (pick.papas || []).reduce(
          (pickSum, extra) => pickSum + getPapasUpgradePrice(extra, papasContext),
          0,
        );
        return picksSum + pickExtras + pickPapas;
      }, 0);

      return sum + it.qty * (it.unitPrice + extrasTotal + papasTotal + picksExtrasTotal);
    }, 0);
    return {
      items,
      total,
      lastAdded: state.lastAdded,
      add: (item) => {
        const allowDuringClosed = item?.meta?.allowDuringClosed;
        if (isClosed && !allowDuringClosed) {
          toast.error(closedToastText, {
            key: "store-closed-add",
            duration: 2800,
          });
          return;
        }
        dispatch({ type: "ADD", item });
      },
      remove: (key) => dispatch({ type: "REMOVE", key }),
      clear: () => dispatch({ type: "CLEAR" }),
      setQty: (key, qty) => dispatch({ type: "SET_QTY", key, qty }),
      setNote: (key, note) => dispatch({ type: "SET_NOTE", key, note }),
      setExtras: (key, extras) => dispatch({ type: "SET_EXTRAS", key, extras }),
      setPapas: (key, papas) => dispatch({ type: "SET_PAPAS", key, papas }),
      setRemovedIngredients: (key, removed) =>
        dispatch({ type: "SET_REMOVED", key, removedIngredients: removed }),
      setPromoPicks: (key, picks) =>
        dispatch({ type: "SET_PROMO_PICKS", key, picks }),
    };
  }, [closedToastText, isClosed, state.items, state.lastAdded]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}
