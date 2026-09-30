import { describe, it, expect } from "vitest";
import { evaluateCoupon } from "./coupons";

const DOBLE = { key: "burger:cheese:doble", name: "Cheese", qty: 2, unitPrice: 14500, meta: { type: "burger", burgerId: "cheese", size: "doble" } };
const SIMPLE = { key: "burger:cheese:simple", name: "Cheese", qty: 1, unitPrice: 11000, meta: { type: "burger", burgerId: "cheese", size: "simple" } };
const TRIPLE = { key: "burger:cheese:triple", name: "Cheese", qty: 1, unitPrice: 18000, meta: { type: "burger", burgerId: "cheese", size: "triple" } };
const VALID_NOW = new Date("2026-10-01T23:59:00-03:00");

function evalCode(code, cartItems, now = VALID_NOW) {
  return evaluateCoupon({ code, cartItems, now });
}

describe("TEDEBEMOSUNA", () => {
  it("acepta el codigo sin importar mayusculas ni espacios", () => {
    for (const code of ["TEDEBEMOSUNA", "tedebemosuna", "  TeDebemosUna ", "t edebemosuna"]) {
      expect(evalCode(code, [DOBLE]).appliedCode).toBe("TEDEBEMOSUNA");
    }
  });

  it("es 1 carne por pedido sobre la primera doble, sin descuento de plata", () => {
    const result = evalCode("TEDEBEMOSUNA", [SIMPLE, DOBLE]);
    expect(result.discount).toBe(0);
    expect(result.freeMeat).toEqual({ lineKey: DOBLE.key, burgerName: "Cheese", lineQty: 2 });
    expect(result.message).toBe("Promo aplicada: tu doble se convierte en triple gratis 🍔");
  });

  it("sin doble en el carrito no aplica", () => {
    const result = evalCode("TEDEBEMOSUNA", [SIMPLE, TRIPLE]);
    expect(result.appliedCode).toBeUndefined();
    expect(result.error).toMatch(/dobles/);
  });

  it("vence el viernes 02/10 00:00 (BA)", () => {
    const result = evalCode("TEDEBEMOSUNA", [DOBLE], new Date("2026-10-02T00:00:00-03:00"));
    expect(result.error).toBe("La promo TEDEBEMOSUNA finalizó");
  });

  it("codigo inexistente", () => {
    expect(evalCode("TEDEBEMOSDOS", [DOBLE]).error).toBe("Código inválido");
  });
});
