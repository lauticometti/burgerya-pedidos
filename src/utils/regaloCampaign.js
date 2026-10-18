import { useSyncExternalStore } from "react";
import { getArgentinaTimeParts, getStoreNow, useStoreStatus } from "./storeClosedMode";

// ============================================================================
// CAMPAÑA TEMPORAL "hoy el regalo lo ponemos nosotros" — domingo 2026-10-18,
// 20:00 a 21:00. Segunda edición: reusa la lógica de la campaña de ayer
// (sábado 2026-10-17, 40% OFF) con 30% y alcance más amplio (ver abajo).
// ============================================================================
// Fuente UNICA de la campaña: tarjetas, carrito, totales, WhatsApp y la
// revalidacion antes de enviar leen todo de aca.
//
//  - Se prende sola a las 20:00 y se apaga sola a las 21:00 (hora Buenos
//    Aires). Otro dia no hace nada: no hace falta otro despliegue.
//  - Mientras la ventana esta activa se apagan las demas promos (recomendada
//    del dia, triple=doble, combo premium, cupones) para que no se acumulen.
//  - Los precios del catalogo NO se tocan: el 30% se calcula al vuelo sobre
//    el precio habitual de cada producto y adicional (ver cartLineTotals.js:
//    a diferencia de ayer, hoy SI incluye triples, extras, papas, dips y
//    bebidas — no solo burgers simples/dobles).
//
// Para revertir: REGALO_CAMPAIGN.enabled = false (o borrar este archivo y sus
// usos, ver commit).
// TEMP SOLO PREVIEW: startMinutes adelantado para que se pueda revisar esta
// rama sin esperar a las 20:00 real (el ?clock= de desarrollo no funciona en
// un build de Vercel, solo en `npm run dev`). ANTES DE MERGEAR A MAIN volver
// startMinutes a 20 * 60.
export const REGALO_CAMPAIGN = {
  enabled: true,
  dateKey: "2026-10-18",
  startMinutes: 19 * 60, // TEMP preview: 19:00 — volver a 20*60 antes de mergear
  endMinutes: 23 * 60 + 59, // TEMP preview: 23:59 — volver a 21*60 antes de mergear
  maxSlotMinutes: 21 * 60, // entrega/retiro a mas tardar 21:00 (sin cambios)
  percent: 30,
};

export const REGALO_TITLE = "hoy el regalo lo ponemos nosotros";
export const REGALO_SUBTITLE = "30% off hasta las 21";
export const REGALO_FOOTNOTE =
  "Hoy 18/10, de 20 a 21 h. Para pedidos con entrega o retiro hasta las 21 h. Descuento automático. No acumulable. Envío aparte.";
export const REGALO_BADGE = "30% OFF";
export const REGALO_DISCOUNT_LABEL = "Regalo 30%";
export const REGALO_INELIGIBLE_MESSAGE =
  "El 30% OFF aplica a pedidos para hoy hasta las 21:00. Para el horario elegido se aplica el precio habitual.";

// Cartel de cierre: desde las 21:00 hasta el fin del dia cuenta lo que paso.
// Solo texto, no cambia ningun precio.
export const REGALO_RECAP_TITLE = "HOY HUBO 30% OFF";
export const REGALO_RECAP_SUBTITLE =
  "de 20 a 21 h";

export function isRegaloRecapActive(parts) {
  if (!REGALO_CAMPAIGN.enabled || !parts) return false;
  return parts.dateKey === REGALO_CAMPAIGN.dateKey && parts.minutes >= REGALO_CAMPAIGN.endMinutes;
}

// La ventana de la campaña (condicion A: el pedido se confirma ahora).
export function isRegaloWindowActive(parts) {
  if (!REGALO_CAMPAIGN.enabled || !parts) return false;
  return (
    parts.dateKey === REGALO_CAMPAIGN.dateKey &&
    parts.minutes >= REGALO_CAMPAIGN.startMinutes &&
    parts.minutes < REGALO_CAMPAIGN.endMinutes
  );
}

// Precio con el regalo aplicado. Todos los precios del menu son multiplos
// de 50, asi que el 30% da siempre un entero exacto.
export function getRegaloDiscount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round((n * REGALO_CAMPAIGN.percent) / 100);
}

export function getRegaloPrice(amount) {
  return Math.max(Number(amount) - getRegaloDiscount(amount), 0);
}

function hhmmToMinutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value ?? ""));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Estado de la campaña para un momento y un horario elegido (condicion B).
 *
 * status:
 *  - "inactive":   fuera de la ventana 20:00-21:00 (precios habituales).
 *  - "eligible":   "Más tarde" con un horario de hoy disponible y <= 21:00.
 *  - "ineligible": horario elegido despues de las 21:00.
 *  - "pending":    todavia sin horario explicito valido ("Ahora" no tiene
 *                  hora estimada en el sistema, asi que no alcanza).
 *  - "noSlots":    ya no quedan horarios <= 21:00 en el selector.
 *
 * applies          → el descuento entra en los totales y en el WhatsApp.
 * showPromoPrices  → las tarjetas muestran tachado + 30% OFF.
 */
export function getRegaloState({ whenMode, whenSlot, date = null } = {}) {
  const now = date instanceof Date ? date : getStoreNow();
  const parts = getArgentinaTimeParts(now);
  if (!isRegaloWindowActive(parts)) {
    return { status: "inactive", campaignActive: false, applies: false, showPromoPrices: false, message: "" };
  }

  // Por defecto aplica ("Ahora" incluido). Solo se quita si el cliente elige
  // "Más tarde" con un horario despues de las 21:00.
  const base = { campaignActive: true };
  if (whenMode === "Mas tarde" && whenSlot) {
    const slot = hhmmToMinutes(whenSlot);
    if (slot != null && slot > REGALO_CAMPAIGN.maxSlotMinutes) {
      return { ...base, status: "ineligible", applies: false, showPromoPrices: false, message: REGALO_INELIGIBLE_MESSAGE };
    }
  }
  return { ...base, status: "eligible", applies: true, showPromoPrices: true, message: "" };
}

// ---------------------------------------------------------------------------
// Horario elegido en el carrito, compartido con el menu (las tarjetas tienen
// que mostrar lo que el cliente va a pagar con el horario que eligio).
// ---------------------------------------------------------------------------
const FORM_STORAGE_KEY = "burgerya_carrito_form";
const listeners = new Set();
let currentWhen = null;

function readSavedWhen() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(FORM_STORAGE_KEY) || "{}");
    return { whenMode: saved.whenMode || "Ahora", whenSlot: saved.whenSlot || "" };
  } catch {
    return { whenMode: "Ahora", whenSlot: "" };
  }
}

function getWhenSnapshot() {
  if (!currentWhen) {
    currentWhen = typeof window === "undefined" ? { whenMode: "Ahora", whenSlot: "" } : readSavedWhen();
  }
  return currentWhen;
}

function subscribeWhen(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setRegaloWhen(whenMode, whenSlot) {
  const prev = getWhenSnapshot();
  if (prev.whenMode === whenMode && prev.whenSlot === whenSlot) return;
  currentWhen = { whenMode, whenSlot };
  listeners.forEach((l) => l());
}

// Hook para las tarjetas / el pill: se recalcula en cada minuto (y al volver
// a la pestaña, via useStoreStatus) y cuando cambia el horario elegido.
export function useRegaloState() {
  const { dateKey, minutes } = useStoreStatus();
  const when = useSyncExternalStore(subscribeWhen, getWhenSnapshot, getWhenSnapshot);
  // dateKey/minutes solo fuerzan el re-render en cada tick del reloj.
  void dateKey;
  void minutes;
  return getRegaloState(when);
}
