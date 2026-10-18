import React, { useEffect, useMemo, useReducer } from "react";
import { bebidas, burgers } from "../data/menu";
import { isItemUnavailable } from "../utils/availability";
import { CartContext } from "./cartContext";
import { getBurgerPriceInfo } from "../utils/burgerPricing";
import { getCartItemsTotal } from "../utils/cartLineTotals";
import { COMBO_COCA_PRICE } from "../pages/Menu/ComboPremiumBanner";
import { toast } from "../utils/toast";
import { isCokePromoAvailable } from "../utils/cokePromo";
import { useStoreStatus } from "../utils/storeClosedMode";
import { buildBurgerVariantDraft } from "../utils/cartKeys";
import {
  createFriesUpgradeEntry,
  stripDisabledFriesUpgrades,
} from "../utils/friesUpgrade";
import {
  mutateItem,
  removeItems,
  removeItemsByPrefix,
  updateBurgerLineUnits,
  setPapasUpgrade,
} from "./cartReducerActions";

function reducer(state, action) {
  switch (action.type) {
    case "REMOVE_MANY":
      return { ...state, items: removeItems(state.items, action.keys) };

    case "UPDATE_BURGER_LINE_UNITS":
      return {
        ...state,
        items: updateBurgerLineUnits(
          state.items,
          action.baseKey,
          action.draft,
          action.count,
        ),
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

const CART_STORAGE_KEY = "burgerya:cart:v1";

const REMOVED_ITEM_IDS = new Set([
  "cheddar_liq",
  "porcion_grande_cheddar",
  "porcion_grande_cheddar_bacon",
  "dip_cheddar",
]);

const REMOVED_CART_KEY_PREFIXES = [
  "papas:chica:cheddar",
  "papas:grande:cheddar",
  "papas:chica:cheddar_bacon",
  "papas:grande:cheddar_bacon",
  "papas:chica:bacon",
  "papas:grande:bacon",
];

const MENU_BURGERS_BY_ID = burgers.reduce((idx, burger) => {
  idx[burger.id] = burger;
  return idx;
}, {});

function sanitizePersistedItems(items) {
  const cleaned = {};
  let hadRemoved = false;
  for (const [key, item] of Object.entries(items)) {
    const isRemovedKey = REMOVED_CART_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
    const isRemovedId = item.meta?.itemId && REMOVED_ITEM_IDS.has(item.meta.itemId);
    const isUnavailableBurger =
      item.meta?.type === "burger" &&
      (!MENU_BURGERS_BY_ID[item.meta.burgerId] || isItemUnavailable(MENU_BURGERS_BY_ID[item.meta.burgerId]));
    if (isRemovedKey || isRemovedId || isUnavailableBurger) {
      hadRemoved = true;
      continue;
    }
    cleaned[key] = item;
  }

  // Mejora de papas dada de baja: se la sacamos a los carritos que quedaron
  // guardados con ella puesta, para que no se sigan pidiendo esas papas.
  const stripped = stripDisabledFriesUpgrades(cleaned);
  return {
    cleaned: stripped.items,
    hadRemoved: hadRemoved || stripped.changed,
  };
}

function loadPersistedState(initial) {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.items) return initial;
    const { cleaned, hadRemoved } = sanitizePersistedItems(parsed.items);
    if (hadRemoved) {
      window.__cartHadRemovedItems = true;
    }
    return { ...initial, items: cleaned };
  } catch {
    return initial;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(
    reducer,
    { items: {}, lastAdded: null },
    loadPersistedState,
  );
  const { dateKey, minutes, isRegaloActive } = useStoreStatus();

  useEffect(() => {
    if (typeof window !== "undefined" && window.__cartHadRemovedItems) {
      window.__cartHadRemovedItems = false;
      toast.show("Actualizamos el menú. Algunos productos ya no están disponibles.", {
        key: "menu-update-removed",
        kind: "promo",
        ms: 4500,
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ items: state.items }),
      );
    } catch {
      /* quota / privacy mode: no-op */
    }
  }, [state.items]);
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
      // Coca del combo premium: durante la campaña regalo vuelve a su precio
      // habitual (el descuento no se suma al precio combo) y al terminar la
      // campaña recupera el precio combo.
      if (item.meta?.type === "bebida" && item.key?.endsWith(":combo")) {
        const bebidaId = item.key.split(":")[1];
        const regular = bebidas.find((b) => b.id === bebidaId)?.price;
        const nextPrice = isRegaloActive && typeof regular === "number" ? regular : COMBO_COCA_PRICE;
        if (item.unitPrice !== nextPrice) acc.push({ key: item.key, unitPrice: nextPrice, meta: {} });
        return acc;
      }
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
  }, [burgersById, dateKey, minutes, isRegaloActive, state.items]);

  // Coca 600 de regalo: nunca mas Cocas gratis que triples que participan
  // (borrar una triple saca su Coca) y, mientras la promo esta activa, cada
  // triple sumada con "+" en el carrito suma su Coca a la que ya habia.
  useEffect(() => {
    const items = Object.values(state.items);
    const cokes = items.filter((it) => it.meta?.isCokePromo);
    if (!cokes.length) return;
    const triples = items
      .filter((it) => it.meta?.type === "burger" && it.meta?.size === "triple" && !it.meta?.offerId)
      .reduce((sum, it) => sum + (it.qty || 0), 0);
    let free = cokes.reduce((sum, it) => sum + (it.qty || 0), 0);
    if (free < triples && isCokePromoAvailable()) {
      dispatch({ type: "SET_QTY", key: cokes[0].key, qty: (cokes[0].qty || 0) + (triples - free) });
      return;
    }
    for (const coke of cokes) {
      if (free <= triples) break;
      const drop = Math.min(coke.qty || 0, free - triples);
      dispatch({ type: "SET_QTY", key: coke.key, qty: (coke.qty || 0) - drop });
      free -= drop;
    }
  }, [state.items]);

  const api = useMemo(() => {
    const items = Object.values(state.items);
    const total = getCartItemsTotal(items);
    return {
      items,
      total,
      lastAdded: state.lastAdded,
      add: (item) => {
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
      // "Personalizar burger": toca agregados / ingredientes quitados /
      // aclaracion y deja intacta la mejora de papas que ya tenga la variante.
      applyBurgerLineModifiers: (item, scope, modifiers) => {
        const { extras = [], removedIngredients = [], note = "" } = modifiers;
        const draft = buildBurgerVariantDraft(item, {
          extras,
          removedIngredients,
          papas: item.papas || [],
          note,
        });
        dispatch({
          type: "UPDATE_BURGER_LINE_UNITS",
          baseKey: item.key,
          draft,
          count: scope === "one" ? 1 : item.qty,
        });
      },

      // "Mejorar papas": toca SOLO la mejora de las papas incluidas y deja
      // intacta la personalizacion de la burger. `count` = cuantas unidades de
      // esa linea pasan a la variante nueva (el resto queda como estaba).
      setFriesUpgrade: (item, enabled, count) => {
        const draft = buildBurgerVariantDraft(item, {
          extras: item.extras || [],
          removedIngredients: item.removedIngredients || [],
          papas: enabled ? [createFriesUpgradeEntry()] : [],
          note: item.note || "",
        });
        dispatch({
          type: "UPDATE_BURGER_LINE_UNITS",
          baseKey: item.key,
          draft,
          count: count ?? item.qty,
        });
      },
    };
  }, [state.items, state.lastAdded]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}
