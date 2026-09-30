import { describe, it, expect } from "vitest";
import { buildWhatsAppText } from "./whatsapp";
import { computeCheckoutTotals } from "./checkoutTotals";

const ITEMS = [
  { key: "burger:oklahoma:doble", name: "Oklahoma", qty: 2, meta: { type: "burger", size: "doble" } },
  { key: "bebida:coca", name: "Coca-Cola 500ml", qty: 1, meta: { type: "bebida" } },
];
const COVERED_Z2 = { status: "covered", covered: true, zoneId: "delivery-zone-02", zoneLabel: "Zona 2", deliveryPrice: 1500 };
const LOCATION = { lat: -34.6019123, lng: -58.6391234, source: "search" };

function text(overrides = {}) {
  const deliveryMode = overrides.deliveryMode ?? "Delivery";
  const totals =
    overrides.totals ??
    computeCheckoutTotals({
      productsSubtotal: 30000,
      discountAmount: overrides.discountAmount ?? 0,
      deliveryMode,
      deliveryQuote: COVERED_Z2,
    });
  return decodeURIComponent(
    buildWhatsAppText({
      name: "Lautaro",
      address: "Av. Siempre Viva 742, Hurlingham",
      cross: "",
      pay: "Transferencia",
      notes: "",
      items: ITEMS,
      couponCode: "",
      whenMode: "Ahora",
      whenSlot: "",
      location: LOCATION,
      ...overrides,
      deliveryMode,
      totals,
    }),
  );
}

// Lo que va despues del listado de productos.
function tail(message) {
  return message.slice(message.lastIndexOf("1 Coca-cola 500ml") + "1 Coca-cola 500ml".length + 1);
}

describe("WhatsApp: formato operativo para Delivery", () => {
  it("direccion, entrecalles, mapa y resumen financiero completo", () => {
    const message = text({ cross: "Calle A y Calle B" });
    expect(message).toBe(
      [
        "Lautaro",
        "",
        "BURGERS",
        "2 Oklahoma dobles",
        "--------",
        "BEBIDAS",
        "1 Coca-cola 500ml",
        "",
        "Av. Siempre Viva 742, Hurlingham",
        "Entre Calle A y Calle B",
        "Mapa: https://www.google.com/maps?q=-34.601912,-58.639123",
        "",
        "Subtotal: $30.000",
        "Envío: $1.500",
        "Total: $31.500 Transferencia",
      ].join("\n"),
    );
  });

  it("sin entrecalles no imprime la linea", () => {
    expect(tail(text())).toBe(
      [
        "",
        "Av. Siempre Viva 742, Hurlingham",
        "Mapa: https://www.google.com/maps?q=-34.601912,-58.639123",
        "",
        "Subtotal: $30.000",
        "Envío: $1.500",
        "Total: $31.500 Transferencia",
      ].join("\n"),
    );
  });

  it("si el cliente ya escribio 'entre ...' no se duplica", () => {
    expect(text({ cross: "entre Calle A y Calle B" })).toContain("\nEntre Calle A y Calle B\n");
  });

  it("descuento + envio: Subtotal bruto, Descuento, Envío y Total final", () => {
    expect(tail(text({ discountAmount: 3000, couponCode: "PROMO10" }))).toContain(
      ["Subtotal: $30.000", "Descuento PROMO10: -$3.000", "Envío: $1.500", "Total: $28.500 Transferencia"].join("\n"),
    );
  });

  it("efectivo", () => {
    expect(text({ pay: "Efectivo" }).endsWith("Total: $31.500 Efectivo")).toBe(true);
  });

  it("mixto", () => {
    const message = text({ pay: "Mixto", payCashAmount: 20000, payTransferAmount: 11500 });
    expect(message.endsWith("Total: $31.500 (Efectivo $20.000 + Transferencia $11.500)")).toBe(true);
  });

  it("no queda ninguna linea suelta tipo '$1.500 envio'", () => {
    expect(text()).not.toMatch(/\$[\d.]+ envio/i);
  });
});

describe("WhatsApp: GPS / pin sin calle", () => {
  it("si fallo el reverse geocoding no inventa direccion: avisa y manda el mapa", () => {
    const message = text({ address: "", location: { lat: -34.6, lng: -58.64, source: "geolocation" } });
    expect(tail(message)).toBe(
      [
        "",
        "Sin calle/altura: ver mapa",
        "Mapa: https://www.google.com/maps?q=-34.600000,-58.640000",
        "",
        "Subtotal: $30.000",
        "Envío: $1.500",
        "Total: $31.500 Transferencia",
      ].join("\n"),
    );
  });

  it("pin con direccion obtenida: direccion + mapa con las coordenadas del pin", () => {
    const message = text({ address: "Beethoven 1234, Hurlingham", location: { lat: -34.5901, lng: -58.6399, source: "map" } });
    expect(message).toContain("Beethoven 1234, Hurlingham\nMapa: https://www.google.com/maps?q=-34.590100,-58.639900\n");
  });
});

describe("WhatsApp: Retiro", () => {
  it("sin direccion, sin mapa, sin envio", () => {
    const message = text({ deliveryMode: "Retiro", cross: "Calle A y Calle B" });
    expect(message.startsWith("RETIRO\nLautaro\n")).toBe(true);
    expect(message).not.toContain("Siempre Viva");
    expect(message).not.toContain("Mapa:");
    expect(message).not.toContain("Envío");
    expect(message).not.toContain("Entre");
    expect(tail(message)).toBe("\nTotal: $30.000 Transferencia");
  });

  it("Retiro con descuento: Subtotal, Descuento y Total, sin envio", () => {
    expect(tail(text({ deliveryMode: "Retiro", discountAmount: 3000, couponCode: "PROMO10" }))).toBe(
      ["", "Subtotal: $30.000", "Descuento PROMO10: -$3.000", "Total: $27.000 Transferencia"].join("\n"),
    );
  });
});

describe("WhatsApp: promo TEDEBEMOSUNA", () => {
  const promo = { code: "TEDEBEMOSUNA", lineKey: "burger:oklahoma:doble" };

  it("marca la doble que va triple y suma la linea de promo sin tocar montos", () => {
    const message = text({ deliveryMode: "Retiro", freeMeatPromo: promo });
    expect(message).toContain("2 Oklahoma dobles\n  🎁 +1 carne GRATIS: 1 de las 2 va TRIPLE\n");
    expect(tail(message)).toBe(
      ["", "🎁 Promo TEDEBEMOSUNA: +1 carne GRATIS", "Total: $30.000 Transferencia"].join("\n"),
    );
  });

  it("sin promo no aparece nada", () => {
    expect(text()).not.toContain("carne GRATIS");
  });
});
