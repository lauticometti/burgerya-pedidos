import { describe, it, expect } from "vitest";
import {
  isComboCompletoActive,
  buildComboCompletoCartItems,
  COMBO_COMPLETO_PRICE,
} from "./ComboCompletoBanner";
import { getCartItemsTotal, getRegaloCartDiscount } from "../../utils/cartLineTotals";
import { evaluateCoupon, evaluateDbardoStack } from "../../utils/coupons";

describe("isComboCompletoActive", () => {
  it("activo solo el 23/11/2026", () => {
    expect(isComboCompletoActive({ dateKey: "2026-11-23" })).toBe(true);
  });

  it("apagado el día anterior y el siguiente", () => {
    expect(isComboCompletoActive({ dateKey: "2026-11-22" })).toBe(false);
    expect(isComboCompletoActive({ dateKey: "2026-11-24" })).toBe(false);
  });
});

describe("buildComboCompletoCartItems", () => {
  const date = new Date("2026-11-23T20:00:00-03:00");

  it("total exacto $18.000 (burger a precio normal + coca + dip de regalo)", () => {
    const { burgerItem, bebidaItem, dipItem } = buildComboCompletoCartItems(date);
    const total = getCartItemsTotal([burgerItem, bebidaItem, dipItem]);
    expect(total).toBe(18000);
    expect(total).toBe(COMBO_COMPLETO_PRICE);
  });

  it("la burger sale a precio normal (no se infla ni se descuenta)", () => {
    const { burgerItem } = buildComboCompletoCartItems(date);
    expect(burgerItem.unitPrice).toBe(15500);
  });

  it("el dip sale gratis y la coca a precio normal", () => {
    const { bebidaItem, dipItem } = buildComboCompletoCartItems(date);
    expect(bebidaItem.unitPrice).toBe(2500);
    expect(dipItem.unitPrice).toBe(0);
  });

  it("la burger queda marcada comboLocked (no participa de otras ofertas)", () => {
    const { burgerItem } = buildComboCompletoCartItems(date);
    expect(burgerItem.meta.comboLocked).toBe(true);
  });

  it("las keys de bebida/dip no colisionan con las del catálogo normal", () => {
    const { bebidaItem, dipItem } = buildComboCompletoCartItems(date);
    expect(bebidaItem.key).not.toBe("bebida:coca_600");
    expect(dipItem.key).not.toBe("dip:dip_mil_islas");
  });
});

describe("el combo no acumula con otras promos", () => {
  it("un cupón de % off en burgers no descuenta la burger del combo", () => {
    const date = new Date("2026-11-23T20:00:00-03:00");
    const { burgerItem } = buildComboCompletoCartItems(date);

    // BURGER10 estuvo vigente el 4 y 5/11 — se simula esa fecha para probar
    // la lógica sin depender de que el cupón siga activo hoy.
    const result = evaluateCoupon({
      code: "BURGER10",
      cartItems: [burgerItem],
      now: new Date("2026-11-04T20:00:00-03:00"),
    });

    expect(result.discount).toBe(0);
    expect(result.appliedCode).toBe("BURGER10");
    expect(result.message).toBe(
      "BURGER10: se mantienen las promociones de mayor o igual descuento",
    );
  });

  it("el descuento regalo 30% no se aplica sobre la burger del combo", () => {
    const date = new Date("2026-11-23T20:00:00-03:00");
    const { burgerItem } = buildComboCompletoCartItems(date);
    expect(getRegaloCartDiscount([burgerItem])).toBe(0);
  });

  it("un código D BARDO 'burger doble gratis' (vigente hasta el 30/11) no regala la burger del combo", () => {
    const date = new Date("2026-11-23T20:00:00-03:00");
    const { burgerItem } = buildComboCompletoCartItems(date);

    const result = evaluateDbardoStack({
      codes: ["DB-28TL"],
      cartItems: [burgerItem],
      cartTotal: 18000,
      now: date,
    });

    expect(result.totalDiscount).toBe(0);
    expect(result.entries[0].error).toBe(
      "No hay más burgers dobles en el carrito para regalar: agregá otra doble",
    );
    expect(result.giveawayTargets).toHaveLength(0);
  });

  it("apilar dos D BARDO (burger + 15%) con SOLO el combo en el carrito: el % corre sobre el total, la burger no se toca", () => {
    const date = new Date("2026-11-23T20:00:00-03:00");
    const { burgerItem, bebidaItem, dipItem } = buildComboCompletoCartItems(date);
    const cartItems = [burgerItem, bebidaItem, dipItem];
    const cartTotal = getCartItemsTotal(cartItems);
    expect(cartTotal).toBe(18000);

    const result = evaluateDbardoStack({
      codes: ["DB-28TL", "DB-ZY2W"], // "burger" + 15%
      cartItems,
      cartTotal,
      now: date,
    });

    // La burger gratis no encuentra doble elegible (comboLocked) -> error, $0.
    expect(result.entries[0].tier).toBeUndefined();
    expect(result.entries[0].error).toContain("No hay más burgers dobles");
    // El 15% sí corre, sobre el total completo del pedido (18.000), no se
    // recalcula sobre nada que ya haya tocado la burger del combo.
    expect(result.entries[1].tier).toBe(15);
    expect(result.entries[1].discount).toBe(Math.round(18000 * 0.15));
    expect(result.totalDiscount).toBe(result.entries[1].discount);
    expect(result.totalDiscount).toBeLessThanOrEqual(30000);
    expect(result.giveawayTargets).toHaveLength(0);
  });
});
