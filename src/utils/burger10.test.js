import { describe, it, expect } from "vitest";
import { evaluateCoupon } from "./coupons";
import { burgers } from "../data/menu";
import { getBurgerPriceInfo } from "./burgerPricing";
import { getCartItemsTotal } from "./cartLineTotals";
import { computeCheckoutTotals } from "./checkoutTotals";
import { getRegaloState } from "./regaloCampaign";
import { isCokePromoAvailable } from "./cokePromo";

const NOW = new Date("2026-11-04T20:00:00-03:00");
const burger = (overrides = {}) => ({
  key: "burger:cheese:doble",
  qty: 1,
  unitPrice: 15500,
  meta: { type: "burger", burgerId: "cheese", size: "doble" },
  ...overrides,
});
const paidFries = [{ id: "porcion_grande", price: 2500 }];
const extras = [{ id: "cebolla", price: 500 }, { id: "carne", price: 4000 }];
const evaluate = (cartItems, now = NOW, code = "BURGER10") =>
  evaluateCoupon({ code, cartItems, cartTotal: getCartItemsTotal(cartItems), now });

describe("BURGER10: base exclusiva de hamburguesas", () => {
  it.each([
    ["papas pagas", { papas: paidFries }],
    ["agregados", { extras }],
    ["papas y agregados", { papas: paidFries, extras }],
  ])("no descuenta %s", (_, modifiers) => {
    expect(evaluate([burger(modifiers)]).discount).toBe(1550);
  });

  it("calcula cantidades y lineas distintas; excluye bebidas, dips, papas y combos", () => {
    const items = [
      burger({ qty: 3, papas: paidFries, extras }),
      burger({ key: "burger:cheese:simple", qty: 2, unitPrice: 11500 }),
      ...["bebida", "dip", "papas", "combo", "promo"].map((type) => ({
        key: type, qty: 2, unitPrice: 5000, meta: { type },
      })),
    ];
    const discount = evaluate(items).discount;
    expect(discount).toBe(6950);
    const totals = computeCheckoutTotals({
      productsSubtotal: getCartItemsTotal(items), discountAmount: discount,
      deliveryMode: "Delivery", deliveryQuote: { status: "covered", deliveryPrice: 2000 },
    });
    expect(totals.grandTotal).toBe(135550);
  });

  it("mantiene el redondeo por linea", () => {
    expect(evaluate([burger({ unitPrice: 11505, qty: 3 })]).discount).toBe(3452);
  });
});

describe("BURGER10: limites absolutos en Buenos Aires", () => {
  it.each([
    ["2026-11-04T02:59:59.999Z", false],
    ["2026-11-04T03:00:00.000Z", true],
    ["2026-11-05T00:00:00-03:00", true],
    ["2026-11-06T02:59:59.999Z", true],
    ["2026-11-06T03:00:00.000Z", false],
    ["2026-11-06T03:00:00.001Z", false],
    ["2026-11-11T20:00:00-03:00", false],
  ])("%s: activo=%s", (date, active) => {
    const result = evaluate([burger()], new Date(date));
    expect(result.discount).toBe(active ? 1550 : 0);
    expect(result.appliedCode).toBe(active ? "BURGER10" : undefined);
    expect(Boolean(result.error)).toBe(!active);
  });
});

describe("BURGER10: promociones sin acumulacion", () => {
  it.each([
    [15000, 300], // oferta menor al 10%: completa solo la diferencia
    [14850, 0], // oferta exactamente del 10%
    [14000, 0], // oferta mayor: conserva el precio mas conveniente
  ])("precio automatico %i, descuento adicional %i", (unitPrice, expected) => {
    const item = burger({ qty: 2, unitPrice, extras, papas: paidFries,
      meta: { type: "burger", basePrice: 16500, offerId: "daily_feature" } });
    const before = structuredClone(item);
    const result = evaluate([item]);
    expect(result.appliedCode).toBe("BURGER10");
    expect(result.error).toBeUndefined();
    expect(result.discount).toBe(expected);
    expect(item).toEqual(before);
  });

  it("no usa el ahorro de una oferta mayor para anular el descuento de otra burger", () => {
    const offer = burger({ unitPrice: 10000,
      meta: { type: "burger", basePrice: 15500, offerId: "flash" } });
    expect(evaluate([offer, burger({ qty: 2 })]).discount).toBe(3100);
  });

  it.each([
    ["2026-11-04T20:00:00-03:00", "american"],
    ["2026-11-05T20:00:00-03:00", "smoklahoma"],
  ])("usa los precios automaticos reales del %s", (date, id) => {
    const now = new Date(date);
    const menuBurger = burgers.find((item) => item.id === id);
    for (const size of ["simple", "doble", "triple"]) {
      const price = getBurgerPriceInfo(menuBurger, size, now);
      expect(price.hasDiscount).toBe(true);
      const item = burger({ unitPrice: price.finalPrice, qty: 2, extras, papas: paidFries,
        meta: { type: "burger", burgerId: id, size, basePrice: price.basePrice, offerId: price.offerId } });
      const result = evaluate([item], now);
      const expectedBurgerTotal = Math.min(price.finalPrice * 2, price.basePrice * 2 - Math.round(price.basePrice * 2 * 0.1));
      expect(item.unitPrice * 2 - result.discount).toBe(expectedBurgerTotal);
    }
    // Estas campañas globales/de regalo no se superponen con BURGER10.
    expect(getRegaloState({ date: now }).campaignActive).toBe(false);
    expect(isCokePromoAvailable(now)).toBe(false);
  });
});

describe("regresion de otros cupones porcentuales", () => {
  it.each([
    ["PRODE", "2026-07-15T20:00:00-03:00", 2250],
    ["MIERCOLES16", "2026-09-16T20:00:00-03:00", 3375],
    ["JUEVES17", "2026-09-17T20:00:00-03:00", 2250],
    ["CORTASEMANA10", "2026-10-28T20:00:00-03:00", 1800],
  ])("%s conserva su base historica", (code, date, expected) => {
    expect(evaluate([burger({ extras, papas: paidFries })], new Date(date), code).discount).toBe(expected);
  });
});
