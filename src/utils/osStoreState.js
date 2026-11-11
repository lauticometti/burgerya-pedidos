// Estado de la tienda que manda el OS (checkout web, bloque 1): por ahora el STOCK.
//
// Una sola fuente: cuando el checkout contra el OS está prendido (VITE_OS_FUNCTIONS_URL),
// lo que diga menu.js de stock (isAvailable, notice, forcedRemovals...) se ignora y vale
// lo que marcan los dueños en el OS. Si el OS no responde, la web sigue con menu.js
// tal cual (nunca se rompe por esto).

import { useSyncExternalStore } from "react";
import * as menu from "../data/menu";
import { isOsCheckoutEnabled, OS_FUNCTIONS_URL } from "./osCheckout";

const EVENT = "burgerya:store-state";
let version = 0;

// Campos de stock que menu.js usaba a mano y que, con el OS, pasan a venir de ahí.
const STOCK_FIELDS = [
  "unavailableSince",
  "unavailableShift",
  "unavailableUntil",
  "unavailableReason",
  "notice",
  "noticeSince",
  "noticeShift",
  "noticeUntil",
  "forcedRemovals",
  "forcedRemovalsUntil",
];

const PRODUCT_LISTS = ["burgers", "extras", "papas", "dips", "bebidas"];

/**
 * Campos de stock de UN producto según el estado del OS (puro, para tests).
 * @param {object} item  producto de menu.js
 * @param {{products: Record<string, {until: string|null, notice?: string}>, ingredients: Record<string, {until: string|null, notice?: string}>}} stock
 */
export function stockFieldsFor(item, stock) {
  const out = { isAvailable: 1 };
  const mark = stock?.products?.[item.id];
  if (mark) {
    out.isAvailable = 0;
    if (mark.until) out.unavailableUntil = mark.until;
    if (mark.notice) out.unavailableReason = mark.notice;
  }
  const forced = (item.removableIngredients || []).filter((r) => stock?.ingredients?.[r.id]);
  if (forced.length) {
    const marks = forced.map((r) => stock.ingredients[r.id]);
    out.forcedRemovals = forced.map((r) => ({ id: r.id, label: r.label }));
    out.notice = forced.map((r, i) => marks[i].notice || `Sin ${r.label.toLowerCase()}`).join(" · ");
    // Vence cuando vence la primera marca; las que duran "hasta reponer" no vencen solas.
    const untils = marks.map((m) => m.until).filter(Boolean).sort();
    if (untils.length === marks.length) {
      out.forcedRemovalsUntil = untils[0];
      out.noticeUntil = untils[0];
    }
  } else if (mark?.notice && item.removableIngredients) {
    out.notice = mark.notice;
  }
  return out;
}

/** Pisa el stock de menu.js con el del OS (mutando los productos, que la web lee directo). */
export function applyStoreState(state, lists = menu) {
  if (!state?.stock) return;
  for (const name of PRODUCT_LISTS) {
    for (const item of lists[name] || []) {
      for (const f of STOCK_FIELDS) delete item[f];
      Object.assign(item, stockFieldsFor(item, state.stock));
    }
  }
  version += 1;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/** Pide el estado al OS (protocolo callable, sin SDK). Silencioso si falla. */
export async function loadOsStoreState() {
  if (!isOsCheckoutEnabled()) return null;
  try {
    const res = await fetch(`${OS_FUNCTIONS_URL}/getStoreState`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: {} }),
    });
    const body = await res.json();
    if (!res.ok || body.error) return null;
    applyStoreState(body.result);
    return body.result;
  } catch {
    return null;
  }
}

/** Para que la app vuelva a dibujarse cuando llega el estado del OS. */
export function useStoreStateVersion() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      return () => window.removeEventListener(EVENT, cb);
    },
    () => version,
    () => 0,
  );
}
