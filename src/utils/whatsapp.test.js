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

// Seccion de productos (la que lee cocina): desde BURGERS hasta la linea en blanco.
function kitchenSection(message) {
  const start = message.indexOf("BURGERS");
  return message.slice(start, message.indexOf("\n\n", start));
}

describe.each(["TEDEBEMOSUNA", "VOLVEYA"])("WhatsApp: promo doble -> triple (%s)", (code) => {
  const promo = { code, lineKey: "burger:oklahoma:doble" };

  it("cocina ve el producto final: 1 triple + el resto dobles, sin promo ni cupon", () => {
    const kitchen = kitchenSection(text({ deliveryMode: "Retiro", freeMeatPromo: promo }));
    expect(kitchen).toBe(
      ["BURGERS", "1 Oklahoma triple", "1 Oklahoma doble", "--------", "BEBIDAS", "1 Coca-cola 500ml"].join("\n"),
    );
    expect(kitchen).not.toMatch(/promo|gratis|cobra|🎁/i);
    expect(kitchen).not.toContain(code);
  });

  it("la linea de control del cupon queda en el bloque de totales, montos intactos", () => {
    expect(tail(text({ deliveryMode: "Retiro", freeMeatPromo: promo }))).toBe(
      ["", `🎁 Promo ${code}: +1 carne GRATIS`, "Total: $30.000 Transferencia"].join("\n"),
    );
  });

  it("una sola doble pasa entera a triple y conserva agregados y aclaraciones", () => {
    const items = [
      {
        key: "burger:cheese:doble",
        name: "Cheese",
        qty: 1,
        extras: [{ name: "Bacon" }],
        removedIngredients: [{ label: "Cheddar" }],
        note: "bien cocida",
        meta: { type: "burger", size: "doble" },
      },
    ];
    const kitchen = kitchenSection(
      text({ deliveryMode: "Retiro", items, freeMeatPromo: { code, lineKey: "burger:cheese:doble" } }),
    );
    expect(kitchen).toBe(
      ["BURGERS", "1 Cheese triple", "- Sin Cheddar", "  Agregados: Bacon", "  Aclaracion: bien cocida"].join("\n"),
    );
  });
});

describe("WhatsApp: sin promo doble -> triple", () => {
  it("la comanda queda igual que siempre", () => {
    const message = text();
    expect(kitchenSection(message)).toBe(
      ["BURGERS", "2 Oklahoma dobles", "--------", "BEBIDAS", "1 Coca-cola 500ml"].join("\n"),
    );
    expect(message).not.toContain("carne GRATIS");
  });
});

describe("WhatsApp: +1 carne sobre una doble con promo del dia", () => {
  it("cocina ve solo la triple y el total cobra esa doble a precio normal", () => {
    const items = [
      { key: "burger:american:doble", name: "American", qty: 1, unitPrice: 14000, meta: { type: "burger", size: "doble", basePrice: 15500 } },
    ];
    const totals = computeCheckoutTotals({ productsSubtotal: 14000 + 1500, deliveryMode: "Retiro" });
    const message = text({ deliveryMode: "Retiro", items, totals, freeMeatPromo: { code: "VOLVEYA", lineKey: "burger:american:doble" } });
    expect(kitchenSection(message)).toBe(["BURGERS", "1 American triple"].join("\n"));
    expect(message).toContain("Total: $15.500 Transferencia");
  });
});

describe("WhatsApp: REGALITO", () => {
  it("cocina ve solo el producto final", () => {
    const items = [
      { key: "burger:american:doble", name: "American", qty: 1, unitPrice: 14000, meta: { type: "burger", size: "doble", basePrice: 15500 } },
    ];
    const totals = computeCheckoutTotals({ productsSubtotal: 15500, deliveryMode: "Retiro" });
    const kitchen = kitchenSection(
      text({ deliveryMode: "Retiro", items, totals, freeMeatPromo: { code: "REGALITO", lineKey: "burger:american:doble" } }),
    );
    expect(kitchen).toBe(["BURGERS", "1 American triple"].join("\n"));
    expect(kitchen).not.toMatch(/promo|gratis|regalito|🎁/i);
  });
});
