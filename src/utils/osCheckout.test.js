import { describe, expect, it } from "vitest";
import { buildOsPayload, cartToOsLines, slotToIso } from "./osCheckout";

const burger = (extra = {}) => ({
  key: "burger:cheese:doble",
  name: "Cheese",
  qty: 2,
  unitPrice: 15500,
  extras: [{ id: "carne_cheddar", price: 4000 }],
  removedIngredients: [{ id: "cheddar", label: "Cheddar" }],
  papas: [],
  meta: { type: "burger", burgerId: "cheese", size: "doble", offerId: null, discountAmount: 0 },
  ...extra,
});

describe("carrito de la web → pedido del OS", () => {
  it("manda productos, talles, agregados y sacados; nunca precios", () => {
    const { lines, unsupported } = cartToOsLines([
      burger(),
      { key: "bebida:coca_600", name: "Coca", qty: 1, unitPrice: 2500, meta: { type: "bebida" } },
      { key: "papas:chica:solas", name: "Papas", qty: 1, unitPrice: 3000, papas: [], meta: { type: "papas" } },
    ]);
    expect(unsupported).toBeNull();
    expect(lines[0]).toEqual({
      type: "burger",
      productId: "cheese",
      size: "doble",
      qty: 2,
      extraIds: ["carne_cheddar"],
      removedIds: ["cheddar"],
      papasIds: [],
    });
    expect(JSON.stringify(lines)).not.toContain("15500");
    expect(lines[2]).toEqual({ type: "papas", productId: "porcion_extra", qty: 1 });
  });

  it("ofertas, promos y regalos siguen por WhatsApp", () => {
    expect(cartToOsLines([burger({ meta: { type: "burger", burgerId: "cheese", size: "triple", offerId: "friday" } })]).unsupported).toBeTruthy();
    expect(cartToOsLines([burger({ meta: { type: "burger", burgerId: "cheese", size: "doble", cokeGifts: ["coca"] } })]).unsupported).toBeTruthy();
    expect(cartToOsLines([{ key: "promo:x", name: "Promo", qty: 1, meta: { type: "promo" } }]).unsupported).toBeTruthy();
  });

  it("horario programado en hora argentina", () => {
    expect(slotToIso("21:30", new Date("2026-10-29T22:00:00Z"))).toBe("2026-10-30T00:30:00.000Z");
  });

  it("arma los datos del checkout con teléfono y total que vio el cliente", () => {
    const p = buildOsPayload({
      idempotencyKey: "k",
      form: { deliveryMode: "Retiro", name: "Juan", pay: "Transferencia", whenMode: "Ahora" },
      phone: "1155550000",
      consent: true,
      lines: [],
      grandTotal: 33500,
    });
    expect(p.checkout).toMatchObject({ fulfillment: "retiro", paymentMethod: "transferencia", customer: { phone: "1155550000" } });
    expect(p.expectedTotalPesos).toBe(33500);
  });
});
