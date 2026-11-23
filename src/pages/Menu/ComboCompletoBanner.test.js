import { describe, it, expect } from "vitest";
import {
  isComboCompletoActive,
  buildComboCompletoCartItems,
  COMBO_COMPLETO_PRICE,
} from "./ComboCompletoBanner";
import { getCartItemsTotal, getRegaloCartDiscount } from "../../utils/cartLineTotals";
import {
  evaluateCoupon,
  evaluateDbardoStack,
  DBARDO_COMBO_BLOCKED_MESSAGE,
} from "../../utils/coupons";

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

  it("un código D BARDO 'burger doble gratis' con el combo en el carrito: se rechaza entero, no regala la burger", () => {
    const date = new Date("2026-11-23T20:00:00-03:00");
    const { burgerItem } = buildComboCompletoCartItems(date);

    const result = evaluateDbardoStack({
      codes: ["DB-28TL"],
      cartItems: [burgerItem],
      cartTotal: 18000,
      now: date,
    });

    expect(result.totalDiscount).toBe(0);
    expect(result.entries[0].error).toBe(DBARDO_COMBO_BLOCKED_MESSAGE);
    expect(result.giveawayTargets).toHaveLength(0);
  });

  it("apilar dos D BARDO (burger + 15%) con el combo en el carrito: los DOS se rechazan, el % ya no corre sobre el total", () => {
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

    expect(result.entries[0].error).toBe(DBARDO_COMBO_BLOCKED_MESSAGE);
    expect(result.entries[1].error).toBe(DBARDO_COMBO_BLOCKED_MESSAGE);
    expect(result.entries[0].tier).toBeUndefined();
    expect(result.entries[1].tier).toBeUndefined();
    expect(result.totalDiscount).toBe(0);
    expect(result.giveawayTargets).toHaveLength(0);
  });

  it("con otra burger doble (no del combo) sumada al carrito, el combo sigue bloqueando todo el stack", () => {
    const date = new Date("2026-11-23T20:00:00-03:00");
    const { burgerItem, bebidaItem, dipItem } = buildComboCompletoCartItems(date);
    const otraDoble = {
      key: "burger:bacon:doble",
      name: "Bacon",
      qty: 1,
      unitPrice: 16500,
      meta: { type: "burger", burgerId: "bacon", size: "doble" },
    };
    const cartItems = [burgerItem, bebidaItem, dipItem, otraDoble];
    const cartTotal = getCartItemsTotal(cartItems);

    const result = evaluateDbardoStack({
      codes: ["DB-28TL", "DB-ZY2W"],
      cartItems,
      cartTotal,
      now: date,
    });

    expect(result.entries[0].error).toBe(DBARDO_COMBO_BLOCKED_MESSAGE);
    expect(result.entries[1].error).toBe(DBARDO_COMBO_BLOCKED_MESSAGE);
    expect(result.totalDiscount).toBe(0);
    expect(result.giveawayTargets).toHaveLength(0);
  });

  it("sacando el combo del carrito, los mismos códigos vuelven a aplicar normal sobre la otra burger", () => {
    const date = new Date("2026-11-23T20:00:00-03:00");
    const otraDoble = {
      key: "burger:bacon:doble",
      name: "Bacon",
      qty: 1,
      unitPrice: 16500,
      meta: { type: "burger", burgerId: "bacon", size: "doble" },
    };
    const result = evaluateDbardoStack({
      codes: ["DB-28TL", "DB-ZY2W"],
      cartItems: [otraDoble],
      cartTotal: 16500,
      now: date,
    });

    expect(result.entries[0].error).toBeUndefined();
    expect(result.entries[0].tier).toBe("burger");
    expect(result.entries[0].discount).toBe(16500);
    expect(result.entries[1].error).toBeUndefined();
    expect(result.entries[1].tier).toBe(15);
  });
});
