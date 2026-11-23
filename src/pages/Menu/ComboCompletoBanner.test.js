import { describe, it, expect } from "vitest";
import {
  isComboCompletoActive,
  buildComboCompletoCartItems,
  COMBO_COMPLETO_PRICE,
} from "./ComboCompletoBanner";
import { getCartItemsTotal, getRegaloCartDiscount } from "../../utils/cartLineTotals";
import { evaluateCoupon } from "../../utils/coupons";

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

    const result = evaluateCoupon({
      code: "DB-28TL",
      cartItems: [burgerItem],
      now: date,
    });

    expect(result.discount).toBe(0);
    expect(result.error).toBe("DB-28TL es burger doble gratis: agregá una burger doble al carrito");
  });
});
