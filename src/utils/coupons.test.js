import { describe, it, expect } from "vitest";
import { evaluateCoupon } from "./coupons";

const DOBLE = { key: "burger:cheese:doble", name: "Cheese", qty: 2, unitPrice: 14500, meta: { type: "burger", burgerId: "cheese", size: "doble" } };
const SIMPLE = { key: "burger:cheese:simple", name: "Cheese", qty: 1, unitPrice: 11000, meta: { type: "burger", burgerId: "cheese", size: "simple" } };
const TRIPLE = { key: "burger:cheese:triple", name: "Cheese", qty: 1, unitPrice: 18000, meta: { type: "burger", burgerId: "cheese", size: "triple" } };
const VALID_NOW = new Date("2026-10-01T23:59:00-03:00");

function evalCode(code, cartItems, now = VALID_NOW) {
  return evaluateCoupon({ code, cartItems, now });
}

describe.each([
  ["TEDEBEMOSUNA", ["tedebemosuna", "  TeDebemosUna ", "t edebemosuna"]],
  ["VOLVEYA", ["volveya", "  VolveYa ", "volve ya", "VOLVE-YA"]],
])("doble -> triple gratis: %s", (code, variants) => {
  it("acepta el codigo sin importar mayusculas ni espacios", () => {
    for (const input of [code, ...variants]) {
      expect(evalCode(input, [DOBLE]).appliedCode).toBe(code);
    }
  });

  it("es 1 carne por pedido sobre la primera doble, sin descuento de plata", () => {
    const result = evalCode(code, [SIMPLE, DOBLE]);
    expect(result.discount).toBe(0);
    expect(result.freeMeat).toMatchObject({ lineKey: DOBLE.key, burgerName: "Cheese", lineQty: 2, surcharge: 0 });
    expect(result.surcharge).toBe(0);
    expect(result.message).toBe("Promo aplicada: tu doble se convierte en triple gratis 🍔");
  });

  it("sin doble en el carrito pide agregar una", () => {
    const result = evalCode(code, [SIMPLE, TRIPLE]);
    expect(result.appliedCode).toBeUndefined();
    expect(result.error).toBe(`${code} es para hamburguesas dobles: agregá una doble al carrito`);
  });

  it("vale hasta el jueves 01/10 23:59 y vence el viernes 02/10 00:00 (BA)", () => {
    expect(evalCode(code, [DOBLE], new Date("2026-10-01T23:59:59-03:00")).appliedCode).toBe(code);
    expect(evalCode(code, [DOBLE], new Date("2026-10-02T00:00:00-03:00")).error).toBe(`La promo ${code} finalizó`);
  });
});

describe("codigos invalidos", () => {
  it("codigo inexistente", () => {
    expect(evalCode("TEDEBEMOSDOS", [DOBLE]).error).toBe("Código inválido");
    expect(evalCode("VOLVEMOS", [DOBLE]).error).toBe("Código inválido");
  });
});

// Doble con promo del dia: unitPrice ya viene con la oferta, basePrice es el normal.
const AMERICAN_PROMO = {
  key: "burger:american:doble",
  name: "American",
  qty: 2,
  unitPrice: 14000,
  meta: { type: "burger", burgerId: "american", size: "doble", basePrice: 15500, discountAmount: 1500, offerId: "daily_feature" },
};
const AMERICAN_PROMO_SIMPLE = {
  key: "burger:american:simple",
  name: "American",
  qty: 1,
  unitPrice: 11500,
  meta: { type: "burger", burgerId: "american", size: "simple", basePrice: 12000, discountAmount: 500, offerId: "daily_feature" },
};
const CHEESE_NORMAL = { ...DOBLE, qty: 1, meta: { ...DOBLE.meta, basePrice: 14500, discountAmount: 0, offerId: null } };

describe.each(["TEDEBEMOSUNA", "VOLVEYA"])("+1 carne con promo del dia: %s", (code) => {
  it("no rechaza: la doble con promo vuelve a precio normal (1 unidad) y pasa a triple", () => {
    const result = evalCode(code, [AMERICAN_PROMO]);
    expect(result.error).toBeUndefined();
    expect(result.appliedCode).toBe(code);
    expect(result.discount).toBe(0);
    expect(result.surcharge).toBe(1500); // 15500 normal - 14000 promo, solo 1 unidad
    expect(result.freeMeat.lineKey).toBe(AMERICAN_PROMO.key);
    expect(result.message).toBe("Código aplicado: tu doble pasa a triple 🍔");
  });

  it("los otros productos con promo del dia no cambian de precio", () => {
    const result = evalCode(code, [AMERICAN_PROMO_SIMPLE, AMERICAN_PROMO]);
    expect(result.surcharge).toBe(1500); // la simple con promo no suma nada
  });

  it("si hay una doble a precio normal, usa esa y no toca la promo del dia", () => {
    const result = evalCode(code, [AMERICAN_PROMO, CHEESE_NORMAL]);
    expect(result.freeMeat.lineKey).toBe(CHEESE_NORMAL.key);
    expect(result.surcharge).toBe(0);
    expect(result.message).toBe("Promo aplicada: tu doble se convierte en triple gratis 🍔");
  });
});
