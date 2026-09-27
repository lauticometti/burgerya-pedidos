import { describe, it, expect } from "vitest";
import { computeCheckoutValidation } from "./useCheckoutValidation";
import { computeCheckoutTotals } from "../../utils/checkoutTotals";

const ITEM = [{ name: "Burger", qty: 1 }];

const COVERED_Z1 = { status: "covered", covered: true, zoneId: "delivery-zone-01", zoneLabel: "Zona 1", deliveryPrice: 1000 };

// Arma los params con los totals de computeCheckoutTotals, igual que Carrito:
// productos 20000 (+ envio segun deliveryMode/deliveryQuote).
function baseParams(overrides = {}) {
  const { productsSubtotal = 20000, discountAmount = 0, locationSource = "search", ...rest } = overrides;
  const deliveryMode = rest.deliveryMode ?? "Delivery";
  const deliveryQuote = "deliveryQuote" in rest ? rest.deliveryQuote : COVERED_Z1;
  return {
    deliveryMode: "Delivery",
    name: "Juan",
    address: "Malaspina 1602",
    cross: "",
    pay: "Efectivo",
    payCashAmount: "",
    notes: "",
    items: ITEM,
    couponCode: "",
    whenMode: "Ahora",
    whenSlot: "",
    deliveryQuote,
    location: locationSource ? { lat: -34.600409, lng: -58.64632975, source: locationSource } : null,
    totals: computeCheckoutTotals({ productsSubtotal, discountAmount, deliveryMode, deliveryQuote }),
    ...rest,
  };
}

describe("computeCheckoutValidation: delivery", () => {
  it("con zona cubierta y el resto de los datos completos, permite enviar", () => {
    const result = computeCheckoutValidation(baseParams());
    expect(result.canSend).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it("fuera de cobertura NO permite enviar, aunque el resto este completo", () => {
    const result = computeCheckoutValidation(
      baseParams({
        deliveryQuote: { status: "uncovered", covered: false, zoneId: null, zoneLabel: null, deliveryPrice: null },
        deliveryPrice: 0,
      }),
    );
    expect(result.canSend).toBe(false);
    expect(result.missingFields).toContain("una dirección dentro de la zona de cobertura");
  });

  it("direccion con texto pero sin zona resuelta todavia (coords null) NO permite enviar", () => {
    const result = computeCheckoutValidation(
      baseParams({
        deliveryQuote: { status: "idle", covered: null, zoneId: null, zoneLabel: null, deliveryPrice: null },
        deliveryPrice: 0,
      }),
    );
    expect(result.canSend).toBe(false);
    expect(result.missingFields).toContain("confirmar la dirección (elegila de la lista)");
  });

  it("sin texto de direccion NO permite enviar (no llega a chequear la zona)", () => {
    const result = computeCheckoutValidation(baseParams({ address: "" }));
    expect(result.canSend).toBe(false);
    expect(result.missingFields).toContain("dirección");
  });

  it("el mensaje de WhatsApp incluye el precio del envio cuando hay zona cubierta", () => {
    const result = computeCheckoutValidation(baseParams());
    const text = decodeURIComponent(result.waHref.split("text=")[1]);
    expect(text).toContain("Envío: $1.000");
    expect(text).toContain("Total: $21.000 Efectivo");
  });
});

describe("computeCheckoutValidation: ubicacion sin texto de direccion (geolocation / mapa)", () => {
  it("geolocation con zona cubierta permite enviar aunque el campo de direccion este vacio", () => {
    const result = computeCheckoutValidation(
      baseParams({ address: "", locationSource: "geolocation" }),
    );
    expect(result.canSend).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it("mapa con zona cubierta permite enviar aunque el campo de direccion este vacio", () => {
    const result = computeCheckoutValidation(
      baseParams({ address: "", locationSource: "map" }),
    );
    expect(result.canSend).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it("geolocation fuera de cobertura NO permite enviar, y lo reporta como problema de zona (no de falta de texto)", () => {
    const result = computeCheckoutValidation(
      baseParams({
        address: "",
        locationSource: "geolocation",
        deliveryQuote: { status: "uncovered", covered: false, zoneId: null, zoneLabel: null, deliveryPrice: null },
        deliveryPrice: 0,
      }),
    );
    expect(result.canSend).toBe(false);
    expect(result.missingFields).toContain("una dirección dentro de la zona de cobertura");
    expect(result.missingFields).not.toContain("dirección");
  });

  it("mapa sin ningun pin colocado todavia (idle) exige completar la ubicacion", () => {
    const result = computeCheckoutValidation(
      baseParams({
        address: "",
        locationSource: null,
        deliveryQuote: { status: "idle", covered: null, zoneId: null, zoneLabel: null, deliveryPrice: null },
        deliveryPrice: 0,
      }),
    );
    expect(result.canSend).toBe(false);
    expect(result.missingFields).toContain("dirección");
  });

  it("una fuente que no es geolocation ni mapa NO activa el bypass — sigue exigiendo texto de direccion", () => {
    const result = computeCheckoutValidation(
      baseParams({ address: "", locationSource: "otra-fuente" }),
    );
    expect(result.canSend).toBe(false);
    expect(result.missingFields).toContain("dirección");
  });
});

describe("computeCheckoutValidation: retiro", () => {
  it("Retiro no exige direccion ni zona para poder enviar", () => {
    const result = computeCheckoutValidation(
      baseParams({
        deliveryMode: "Retiro",
        address: "",
        deliveryQuote: { status: "idle", covered: null, zoneId: null, zoneLabel: null, deliveryPrice: null },
        deliveryPrice: 0,
        total: 20000,
      }),
    );
    expect(result.canSend).toBe(true);
    expect(result.missingFields).toEqual([]);
  });
});

describe("computeCheckoutValidation: pago y total final", () => {
  const waText = (result) => decodeURIComponent(result.waHref.split("text=")[1]);

  it("efectivo: el WhatsApp lleva el grandTotal (productos + envio)", () => {
    const result = computeCheckoutValidation(baseParams({ pay: "Efectivo" }));
    expect(result.canSend).toBe(true);
    expect(waText(result)).toContain("Total: $21.000 Efectivo");
  });

  it("transferencia", () => {
    const result = computeCheckoutValidation(baseParams({ pay: "Transferencia" }));
    expect(result.canSend).toBe(true);
    expect(waText(result)).toContain("Total: $21.000 Transferencia");
  });

  it("mixto: transferencia = grandTotal - efectivo, y el WhatsApp suma exactamente el total", () => {
    const result = computeCheckoutValidation(baseParams({ pay: "Mixto", payCashAmount: "15000" }));
    expect(result.canSend).toBe(true);
    expect(waText(result)).toContain("Total: $21.000 (Efectivo $15.000 + Transferencia $6.000)");
  });

  it("mixto sin efectivo cargado NO permite enviar", () => {
    const result = computeCheckoutValidation(baseParams({ pay: "Mixto", payCashAmount: "" }));
    expect(result.canSend).toBe(false);
    expect(result.missingFields).toContain("montos de pago");
  });

  it("cambio de zona con mixto: conserva el efectivo, recalcula la transferencia, nunca montos viejos", () => {
    const zona1 = computeCheckoutValidation(baseParams({ pay: "Mixto", payCashAmount: "15000" }));
    const zona4 = computeCheckoutValidation(
      baseParams({
        pay: "Mixto",
        payCashAmount: "15000",
        deliveryQuote: { status: "covered", covered: true, zoneId: "delivery-zone-05", zoneLabel: "Zona 4", deliveryPrice: 2500 },
      }),
    );
    expect(waText(zona1)).toContain("Total: $21.000 (Efectivo $15.000 + Transferencia $6.000)");
    expect(zona4.canSend).toBe(true);
    expect(waText(zona4)).toContain("Envío: $2.500");
    expect(waText(zona4)).toContain("Total: $22.500 (Efectivo $15.000 + Transferencia $7.500)");
  });

  it("descuento + delivery: Subtotal bruto, Descuento, Envío y Total = productos - descuento + envio", () => {
    const result = computeCheckoutValidation(
      baseParams({ productsSubtotal: 30000, discountAmount: 3000, couponCode: "PROMO10", pay: "Transferencia" }),
    );
    const text = waText(result);
    expect(text).toContain("Subtotal: $30.000\nDescuento PROMO10: -$3.000\nEnvío: $1.000\nTotal: $28.000 Transferencia");
  });

  it("Retiro: envio $0 y sin mapa aunque haya quedado una ubicacion elegida", () => {
    const result = computeCheckoutValidation(baseParams({ deliveryMode: "Retiro", address: "" }));
    const text = waText(result);
    expect(result.canSend).toBe(true);
    expect(text).not.toContain("Mapa:");
    expect(text).not.toContain("Envío");
    expect(text).toContain("Total: $20.000 Efectivo");
  });
});

describe("computeCheckoutValidation: link de mapa", () => {
  const waText = (result) => decodeURIComponent(result.waHref.split("text=")[1]);

  it("Delivery por busqueda: direccion elegida + link con lat/lng", () => {
    const text = waText(computeCheckoutValidation(baseParams()));
    expect(text).toContain("Malaspina 1602\nMapa: https://www.google.com/maps?q=-34.600409,-58.646330\n");
  });

  it("GPS con reverse geocoding fallido (sin texto): se puede enviar y el WhatsApp lleva el mapa", () => {
    const result = computeCheckoutValidation(baseParams({ address: "", locationSource: "geolocation" }));
    expect(result.canSend).toBe(true);
    expect(waText(result)).toContain("Sin calle/altura: ver mapa\nMapa: https://www.google.com/maps?q=-34.600409,-58.646330");
  });

  it("pin con reverse geocoding fallido (sin texto): se puede enviar y el WhatsApp lleva el mapa", () => {
    const result = computeCheckoutValidation(baseParams({ address: "", locationSource: "map" }));
    expect(result.canSend).toBe(true);
    expect(waText(result)).toContain("Mapa: https://www.google.com/maps?q=-34.600409,-58.646330");
  });
});
