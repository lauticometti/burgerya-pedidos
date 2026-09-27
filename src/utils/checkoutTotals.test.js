import { describe, it, expect } from "vitest";
import { computeCheckoutTotals, deliveryPriceFor, resolveMixedPayment, buildMapsLink } from "./checkoutTotals";
import { computeDeliveryQuote } from "../hooks/useDeliveryQuote";

const COVERED_Z2 = { status: "covered", covered: true, zoneId: "delivery-zone-02", zoneLabel: "Zona 2", deliveryPrice: 1500 };
const UNCOVERED = { status: "uncovered", covered: false, zoneId: null, zoneLabel: null, deliveryPrice: null };
const IDLE = { status: "idle", covered: null, zoneId: null, zoneLabel: null, deliveryPrice: null };

describe("computeCheckoutTotals", () => {
  it("Delivery cubierto: grandTotal = productos + envio de la zona", () => {
    expect(
      computeCheckoutTotals({ productsSubtotal: 30000, deliveryMode: "Delivery", deliveryQuote: COVERED_Z2 }),
    ).toEqual({ productsSubtotal: 30000, discountAmount: 0, discountedProducts: 30000, deliveryFee: 1500, grandTotal: 31500 });
  });

  it("Retiro: envio $0 aunque haya una zona resuelta", () => {
    const t = computeCheckoutTotals({ productsSubtotal: 30000, deliveryMode: "Retiro", deliveryQuote: COVERED_Z2 });
    expect(t.deliveryFee).toBe(0);
    expect(t.grandTotal).toBe(30000);
  });

  it("descuento + delivery: subtotal bruto - descuento + envio", () => {
    const t = computeCheckoutTotals({
      productsSubtotal: 30000,
      discountAmount: 3000,
      deliveryMode: "Delivery",
      deliveryQuote: COVERED_Z2,
    });
    expect(t).toEqual({ productsSubtotal: 30000, discountAmount: 3000, discountedProducts: 27000, deliveryFee: 1500, grandTotal: 28500 });
  });

  it("el descuento nunca deja los productos en negativo", () => {
    const t = computeCheckoutTotals({ productsSubtotal: 5000, discountAmount: 8000, deliveryMode: "Delivery", deliveryQuote: COVERED_Z2 });
    expect(t.discountAmount).toBe(5000);
    expect(t.discountedProducts).toBe(0);
    expect(t.grandTotal).toBe(1500);
  });

  it("fuera de cobertura o sin ubicacion no suma envio (nunca un precio inventado)", () => {
    for (const quote of [UNCOVERED, IDLE, null]) {
      const t = computeCheckoutTotals({ productsSubtotal: 20000, deliveryMode: "Delivery", deliveryQuote: quote });
      expect(t.deliveryFee).toBe(0);
      expect(t.grandTotal).toBe(20000);
    }
  });

  it("con una cotizacion real del motor de zonas (Z1 $1000)", () => {
    const quote = computeDeliveryQuote({ lat: -34.600409, lng: -58.64632975 }, "Delivery");
    const t = computeCheckoutTotals({ productsSubtotal: 12000, deliveryMode: "Delivery", deliveryQuote: quote });
    expect(t.deliveryFee).toBe(1000);
    expect(t.grandTotal).toBe(13000);
  });
});

describe("deliveryPriceFor", () => {
  it("solo Delivery cubierto suma", () => {
    expect(deliveryPriceFor(COVERED_Z2, "Delivery")).toBe(1500);
    expect(deliveryPriceFor(COVERED_Z2, "Retiro")).toBe(0);
    expect(deliveryPriceFor(UNCOVERED, "Delivery")).toBe(0);
  });
});

describe("resolveMixedPayment", () => {
  it("transferencia = total - efectivo", () => {
    expect(resolveMixedPayment({ cashInput: "20000", total: 28500 })).toEqual({ cash: 20000, transfer: 8500, valid: true });
  });

  it("efectivo vacio: sin montos, invalido", () => {
    expect(resolveMixedPayment({ cashInput: "", total: 28500 })).toEqual({ cash: null, transfer: null, valid: false });
  });

  it("cambio de zona con Mixto: conserva el efectivo y recalcula la transferencia con el total nuevo", () => {
    const antes = resolveMixedPayment({ cashInput: "20000", total: 31500 }); // Zona 2
    const despues = resolveMixedPayment({ cashInput: "20000", total: 33500 }); // Zona 4
    expect(antes).toEqual({ cash: 20000, transfer: 11500, valid: true });
    expect(despues).toEqual({ cash: 20000, transfer: 13500, valid: true });
    expect(despues.cash + despues.transfer).toBe(33500);
  });

  it("si el total baja por debajo del efectivo, el efectivo se recorta al total (nunca montos que no suman)", () => {
    // Eligio Mixto con todo en efectivo ($31.500) y despues la zona cambio a una mas barata.
    expect(resolveMixedPayment({ cashInput: "31500", total: 31000 })).toEqual({ cash: 31000, transfer: 0, valid: true });
  });
});

describe("buildMapsLink", () => {
  it("usa las coordenadas confirmadas con 6 decimales", () => {
    expect(buildMapsLink({ lat: -34.621918400000006, lng: -58.633184 })).toBe(
      "https://www.google.com/maps?q=-34.621918,-58.633184",
    );
  });

  it("sin coordenadas validas no hay link", () => {
    expect(buildMapsLink(null)).toBe(null);
    expect(buildMapsLink({ lat: null, lng: -58.6 })).toBe(null);
    expect(buildMapsLink({ lat: NaN, lng: -58.6 })).toBe(null);
  });
});
