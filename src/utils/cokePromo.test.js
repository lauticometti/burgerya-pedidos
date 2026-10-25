import { describe, it, expect } from "vitest";
import {
  canOfferCokePromo,
  getCokeGiftKey,
  getLineCokeGifts,
  isCokePromoAvailable,
  isCokePromoWindowActive,
  mergeCokeGifts,
  syncCokeGiftItems,
} from "./cokePromo";
import { updateBurgerLineUnits } from "../store/cartReducerActions";
import { getStoreStatus } from "./storeClosedMode";
import { getBurgerPriceInfo } from "./burgerPricing";
import { burgers } from "../data/menu";

const ORIGINAL = "coca_600";
const ZERO = "coca_zero_600";
const AR = (iso) => new Date(`${iso}-03:00`);

function burgerLine(key, size, qty, gifts, extra = {}) {
  return {
    key,
    name: key,
    qty,
    unitPrice: 15000,
    meta: { type: "burger", size, burgerId: "american", cokeGifts: gifts, ...extra },
  };
}

function toMap(list) {
  return Object.fromEntries(list.map((it) => [it.key, it]));
}

function giftQty(items, variety) {
  return items[getCokeGiftKey(variety)]?.qty || 0;
}

describe("ventana de la promo", () => {
  it("activa hoy hasta las 20:59 y apagada desde las 21:00", () => {
    expect(isCokePromoWindowActive({ dateKey: "2026-10-25", minutes: 0 })).toBe(true);
    expect(isCokePromoWindowActive({ dateKey: "2026-10-25", minutes: 18 * 60 + 30 })).toBe(true);
    expect(isCokePromoWindowActive({ dateKey: "2026-10-25", minutes: 20 * 60 + 59 })).toBe(true);
    expect(isCokePromoWindowActive({ dateKey: "2026-10-25", minutes: 21 * 60 })).toBe(false);
    expect(isCokePromoWindowActive({ dateKey: "2026-10-25", minutes: 23 * 60 + 30 })).toBe(false);
  });

  it("no se repite mañana ni el próximo domingo", () => {
    expect(isCokePromoAvailable(AR("2026-10-26T19:00:00"))).toBe(false);
    expect(isCokePromoAvailable(AR("2026-11-01T19:00:00"))).toBe(false);
    expect(isCokePromoAvailable(AR("2026-10-25T19:00:00"))).toBe(true);
  });
});

describe("recomendada del domingo", () => {
  const lautiboom = burgers.find((b) => b.id === "lautiboom");

  it("se suspende (card y precio) hasta las 21 y vuelve sola a las 21", () => {
    const before = getStoreStatus(AR("2026-10-25T20:59:00"));
    expect(before.isCokeGiftActive).toBe(true);
    expect(before.dailyFeatureBurgerId).toBe(null);
    expect(getBurgerPriceInfo(lautiboom, "doble", AR("2026-10-25T20:59:00")).hasDiscount).toBe(false);

    const after = getStoreStatus(AR("2026-10-25T21:00:00"));
    expect(after.isCokeGiftActive).toBe(false);
    expect(after.dailyFeatureBurgerId).toBe("lautiboom");
    expect(getBurgerPriceInfo(lautiboom, "doble", AR("2026-10-25T21:00:00")).hasDiscount).toBe(true);
  });
});

describe("elegibilidad", () => {
  it("solo dobles y triples, sin otra oferta", () => {
    expect(canOfferCokePromo(burgerLine("a", "doble", 1))).toBe(true);
    expect(canOfferCokePromo(burgerLine("a", "triple", 1))).toBe(true);
    expect(canOfferCokePromo(burgerLine("a", "simple", 1))).toBe(false);
    expect(canOfferCokePromo(burgerLine("a", "doble", 1, [], { offerId: "x" }))).toBe(false);
  });
});

describe("regalos por burger", () => {
  it("carrito mixto: doble Original + triple Zero, una Coca $0 por burger", () => {
    const items = syncCokeGiftItems(
      toMap([burgerLine("doble", "doble", 1, [ORIGINAL]), burgerLine("triple", "triple", 1, [ZERO])]),
      true,
    );
    expect(giftQty(items, ORIGINAL)).toBe(1);
    expect(giftQty(items, ZERO)).toBe(1);
    expect(items[getCokeGiftKey(ORIGINAL)].unitPrice).toBe(0);
  });

  it("borrar la doble deja la Zero de la triple, y viceversa", () => {
    const full = syncCokeGiftItems(
      toMap([burgerLine("doble", "doble", 1, [ORIGINAL]), burgerLine("triple", "triple", 1, [ZERO])]),
      true,
    );
    const withoutDoble = { ...full };
    delete withoutDoble.doble;
    const a = syncCokeGiftItems(withoutDoble, true);
    expect(giftQty(a, ORIGINAL)).toBe(0);
    expect(giftQty(a, ZERO)).toBe(1);

    const withoutTriple = { ...full };
    delete withoutTriple.triple;
    const b = syncCokeGiftItems(withoutTriple, true);
    expect(giftQty(b, ORIGINAL)).toBe(1);
    expect(giftQty(b, ZERO)).toBe(0);
  });

  it("+ suma la misma variedad de esa burger; − la baja", () => {
    const base = syncCokeGiftItems(
      toMap([burgerLine("doble", "doble", 1, [ORIGINAL]), burgerLine("triple", "triple", 1, [ZERO])]),
      true,
    );
    const plus = syncCokeGiftItems({ ...base, triple: { ...base.triple, qty: 3 } }, true);
    expect(giftQty(plus, ZERO)).toBe(3);
    expect(giftQty(plus, ORIGINAL)).toBe(1);

    const minus = syncCokeGiftItems({ ...plus, triple: { ...plus.triple, qty: 2 } }, true);
    expect(giftQty(minus, ZERO)).toBe(2);
    expect(giftQty(minus, ORIGINAL)).toBe(1);
  });

  it("nunca más regalos que burgers participantes", () => {
    const items = syncCokeGiftItems(
      toMap([
        burgerLine("simple", "simple", 2, [ORIGINAL, ORIGINAL]),
        burgerLine("doble", "doble", 1, [ORIGINAL, ZERO, ZERO]),
      ]),
      true,
    );
    expect(giftQty(items, ORIGINAL)).toBe(1);
    expect(giftQty(items, ZERO)).toBe(0);
  });

  it("una Coca paga de la misma variedad no se toca", () => {
    const paid = { key: "bebida:coca_600", name: "Coca", qty: 2, unitPrice: 2500, meta: { type: "bebida" } };
    const items = syncCokeGiftItems(toMap([paid, burgerLine("doble", "doble", 1, [ORIGINAL])]), true);
    expect(items["bebida:coca_600"]).toEqual(paid);
    expect(giftQty(items, ORIGINAL)).toBe(1);
  });

  it("al vencer la promo se sacan todos los regalos", () => {
    const active = syncCokeGiftItems(toMap([burgerLine("doble", "doble", 2, [ORIGINAL, ZERO])]), true);
    const expired = syncCokeGiftItems(active, false);
    expect(Object.values(expired).some((it) => it.meta?.isCokePromo)).toBe(false);
  });

  it("sin cambios devuelve el mismo objeto (no re-render)", () => {
    const items = syncCokeGiftItems(toMap([burgerLine("doble", "doble", 1, [ORIGINAL])]), true);
    expect(syncCokeGiftItems(items, true)).toBe(items);
  });

  it("fusionar la misma burger con otra variedad conserva ambas", () => {
    const merged = mergeCokeGifts(burgerLine("d", "doble", 1, [ORIGINAL]), burgerLine("d", "doble", 1, [ZERO]));
    expect(merged).toEqual([ORIGINAL, ZERO]);
  });

  it("personalizar una unidad se lleva su variedad y la otra conserva la suya", () => {
    const items = toMap([burgerLine("d", "doble", 2, [ORIGINAL, ZERO])]);
    const next = updateBurgerLineUnits(items, "d", { key: "d:sin-cebolla", meta: items.d.meta }, 1);
    expect(getLineCokeGifts(next.d)).toEqual([ORIGINAL]);
    expect(getLineCokeGifts(next["d:sin-cebolla"])).toEqual([ZERO]);
  });
});
