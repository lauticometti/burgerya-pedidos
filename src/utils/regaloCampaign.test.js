import { describe, expect, it } from "vitest";
import { getRegaloState, getRegaloPrice, REGALO_INELIGIBLE_MESSAGE } from "./regaloCampaign";
import { getCartItemsTotal, getRegaloCartDiscount } from "./cartLineTotals";
import { computeCheckoutTotals } from "./checkoutTotals";
import { buildWhatsAppText } from "./whatsapp";
import { formatMoney } from "./formatMoney";
import { getStoreStatus } from "./storeClosedMode";

// Hora Buenos Aires (UTC-3).
const at = (hhmm, day = "2026-10-17") => new Date(`${day}T${hhmm}:00-03:00`);
const state = (hhmm, whenMode, whenSlot, day) =>
  getRegaloState({ whenMode, whenSlot, date: at(hhmm, day) });

describe("TU REGALO 40% OFF — ventana y horario", () => {
  it("antes de las 20:00: precios habituales", () => {
    const s = state("19:59", "Mas tarde", "20:30");
    expect(s.campaignActive).toBe(false);
    expect(s.applies).toBe(false);
    expect(s.showPromoPrices).toBe(false);
  });

  it("20:00 con horario hasta las 21:00: aplica", () => {
    expect(state("20:00", "Mas tarde", "20:30").applies).toBe(true);
    expect(state("20:00", "Mas tarde", "21:00").applies).toBe(true);
    expect(state("20:29", "Mas tarde", "21:00").applies).toBe(true);
  });

  it("horario 21:30: se quita con el mensaje pedido", () => {
    const s = state("20:05", "Mas tarde", "21:30");
    expect(s.applies).toBe(false);
    expect(s.showPromoPrices).toBe(false);
    expect(s.status).toBe("ineligible");
    expect(s.message).toBe(REGALO_INELIGIBLE_MESSAGE);
  });

  it("volver a un horario valido lo reaplica", () => {
    expect(state("20:05", "Mas tarde", "21:30").applies).toBe(false);
    expect(state("20:05", "Mas tarde", "21:00").applies).toBe(true);
  });

  it("'Ahora' aplica por defecto", () => {
    expect(state("20:05", "Ahora", "").applies).toBe(true);
    expect(state("20:45", "Ahora", "").applies).toBe(true);
    expect(state("20:59", "Ahora", "").applies).toBe(true);
  });

  it("21:00 en punto (aun con carrito abierto y horario valido): termina", () => {
    const s = state("21:00", "Mas tarde", "21:00");
    expect(s.campaignActive).toBe(false);
    expect(s.applies).toBe(false);
  });

  it("otro dia a la misma hora: no aplica", () => {
    expect(state("20:15", "Mas tarde", "21:00", "2026-10-18").campaignActive).toBe(false);
    expect(state("20:15", "Mas tarde", "21:00", "2026-10-16").campaignActive).toBe(false);
  });

  it("apaga la recomendada del dia solo durante la ventana", () => {
    expect(getStoreStatus(at("20:15")).isDailyFeaturePromoActive).toBe(false);
    expect(getStoreStatus(at("20:15")).dailyFeatureBurgerId).toBe(null);
    expect(getStoreStatus(at("21:00")).dailyFeatureBurgerId).not.toBe(null);
    expect(getStoreStatus(at("19:59")).dailyFeatureBurgerId).not.toBe(null);
  });
});

describe("TU REGALO 40% OFF — montos", () => {
  const items = [
    {
      key: "burger:bacon:doble::",
      name: "Bacon",
      qty: 2,
      unitPrice: 16500,
      extras: [{ id: "cheddar", name: "Cheddar", price: 1500 }],
      papas: [],
      meta: { type: "burger", burgerId: "bacon", size: "doble" },
    },
    { key: "bebida:coca_600", name: "Coca 600", qty: 1, unitPrice: 3000, meta: { type: "bebida" } },
  ];

  it("40% solo sobre el precio de las burgers, igual al precio de tarjeta", () => {
    expect(getCartItemsTotal(items)).toBe(2 * 18000 + 3000);
    expect(getRegaloCartDiscount(items)).toBe(2 * 6600);
    expect(getRegaloPrice(16500)).toBe(9900);
  });

  it("envio aparte, sin descuento (delivery) y retiro sin envio", () => {
    const subtotal = getCartItemsTotal(items);
    const discount = getRegaloCartDiscount(items);
    const quote = { status: "covered", deliveryPrice: 2500 };
    const delivery = computeCheckoutTotals({ productsSubtotal: subtotal, discountAmount: discount, deliveryMode: "Delivery", deliveryQuote: quote });
    expect(delivery.deliveryFee).toBe(2500);
    expect(delivery.grandTotal).toBe(subtotal - discount + 2500);
    const retiro = computeCheckoutTotals({ productsSubtotal: subtotal, discountAmount: discount, deliveryMode: "Retiro", deliveryQuote: quote });
    expect(retiro.grandTotal).toBe(subtotal - discount);
  });

  it("el WhatsApp lleva horario, descuento y el mismo total", () => {
    const subtotal = getCartItemsTotal(items);
    const discount = getRegaloCartDiscount(items);
    const totals = computeCheckoutTotals({ productsSubtotal: subtotal, discountAmount: discount, deliveryMode: "Delivery", deliveryQuote: { status: "covered", deliveryPrice: 2500 } });
    const text = decodeURIComponent(
      buildWhatsAppText({
        name: "Juan", address: "Calle 1", cross: "", pay: "Efectivo", deliveryMode: "Delivery",
        notes: "", items, totals, couponCode: "", discountLabel: "Regalo 40%",
        whenMode: "Mas tarde", whenSlot: "21:00",
      }),
    );
    expect(text).toContain("Juan (PARA 21:00)");
    expect(text).toContain(`Subtotal: ${formatMoney(subtotal)}`);
    expect(text).toContain(`Regalo 40%: -${formatMoney(discount)}`);
    expect(text).toContain(`Envío: ${formatMoney(2500)}`);
    expect(text).toContain(`Total: ${formatMoney(subtotal - discount + 2500)} Efectivo`);
  });
});
