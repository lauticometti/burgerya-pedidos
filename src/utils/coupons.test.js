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

describe("REGALITO", () => {
  it("acepta el codigo sin importar mayusculas ni espacios", () => {
    for (const input of ["REGALITO", "regalito", "  Regalito ", "rega lito"]) {
      expect(evalCode(input, [DOBLE]).appliedCode).toBe("REGALITO");
    }
  });

  it("1 carne por pedido sobre una doble normal, sin recargo, con su mensaje", () => {
    const result = evalCode("REGALITO", [SIMPLE, DOBLE]);
    expect(result.discount).toBe(0);
    expect(result.surcharge).toBe(0);
    expect(result.freeMeat).toMatchObject({ lineKey: DOBLE.key, burgerName: "Cheese", lineQty: 2 });
    expect(result.message).toBe("Código aplicado: tu doble pasa a triple 🍔");
  });

  it("doble con promo del dia: vuelve a precio normal (1 unidad) y pasa a triple", () => {
    const result = evalCode("REGALITO", [AMERICAN_PROMO_SIMPLE, AMERICAN_PROMO]);
    expect(result.error).toBeUndefined();
    expect(result.surcharge).toBe(1500);
    expect(result.freeMeat.lineKey).toBe(AMERICAN_PROMO.key);
    expect(result.message).toBe("Código aplicado: tu doble pasa a triple 🍔");
  });

  it("prioriza la doble a precio normal para no quitar la promo del dia", () => {
    const result = evalCode("REGALITO", [AMERICAN_PROMO, CHEESE_NORMAL]);
    expect(result.freeMeat.lineKey).toBe(CHEESE_NORMAL.key);
    expect(result.surcharge).toBe(0);
  });

  it("sin doble pide agregar una", () => {
    expect(evalCode("REGALITO", [SIMPLE, TRIPLE]).error).toBe(
      "REGALITO es para hamburguesas dobles: agregá una doble al carrito",
    );
  });

  it("vale hasta el jueves 01/10 23:59 y vence el viernes 02/10 00:00 (BA)", () => {
    expect(evalCode("REGALITO", [DOBLE], new Date("2026-10-01T23:59:59-03:00")).appliedCode).toBe("REGALITO");
    expect(evalCode("REGALITO", [DOBLE], new Date("2026-10-02T00:00:00-03:00")).error).toBe("La promo REGALITO finalizó");
  });
});

describe("TRIPLE", () => {
  const NOW = new Date("2026-10-07T20:00:00-03:00"); // miercoles 7/10

  it("acepta el codigo sin importar mayusculas ni espacios", () => {
    for (const input of ["TRIPLE", "triple", "  Triple "]) {
      expect(evalCode(input, [DOBLE], NOW).appliedCode).toBe("TRIPLE");
    }
  });

  it("pasa una doble a triple, 1 carne por pedido, sin recargo", () => {
    const result = evalCode("TRIPLE", [SIMPLE, DOBLE], NOW);
    expect(result.discount).toBe(0);
    expect(result.surcharge).toBe(0);
    expect(result.freeMeat).toMatchObject({ lineKey: DOBLE.key, lineQty: 2 });
    expect(result.message).toBe("Código aplicado: tu doble pasa a triple 🍔");
  });

  it("doble con promo del dia: vuelve a precio normal y pasa a triple; prioriza la doble normal", () => {
    expect(evalCode("TRIPLE", [AMERICAN_PROMO], NOW).surcharge).toBe(1500);
    expect(evalCode("TRIPLE", [AMERICAN_PROMO, CHEESE_NORMAL], NOW).freeMeat.lineKey).toBe(CHEESE_NORMAL.key);
  });

  it("sin doble pide agregar una", () => {
    expect(evalCode("TRIPLE", [SIMPLE, TRIPLE], NOW).error).toBe(
      "TRIPLE es para hamburguesas dobles: agregá una doble al carrito",
    );
  });

  it("vale hasta el jueves 08/10 23:59 y vence el viernes 09/10 00:00 (BA)", () => {
    expect(evalCode("TRIPLE", [DOBLE], new Date("2026-10-08T23:59:59-03:00")).appliedCode).toBe("TRIPLE");
    expect(evalCode("TRIPLE", [DOBLE], new Date("2026-10-09T00:00:00-03:00")).error).toBe("La promo TRIPLE finalizó");
  });
});

describe("BURGER10", () => {
  const WEDNESDAY = new Date("2026-10-21T20:00:00-03:00");
  const THURSDAY = new Date("2026-10-22T20:00:00-03:00");
  const SIMPLE_CON_CEBOLLA = {
    ...SIMPLE,
    key: "burger:cheese:simple:cebolla",
    extras: [{ id: "cebolla", name: "Cebolla", price: 500 }],
  };

  it("acepta el codigo sin importar mayusculas ni espacios", () => {
    for (const input of ["BURGER10", "burger10", "  Burger10 "]) {
      expect(evalCode(input, [DOBLE], WEDNESDAY).appliedCode).toBe("BURGER10");
    }
  });

  it("10% off sobre todas las burgers del carrito", () => {
    const result = evalCode("BURGER10", [SIMPLE, DOBLE], WEDNESDAY);
    expect(result.discount).toBe(1100 + 2900); // 10% de 11000 y de 2x14500
    expect(result.message).toBe("BURGER10 aplicado: 10% off en todas las burgers y sus agregados");
  });

  it("el 10% tambien se aplica sobre los agregados de la burger (ej. cebolla)", () => {
    const result = evalCode("BURGER10", [SIMPLE_CON_CEBOLLA], WEDNESDAY);
    expect(result.discount).toBe(1150); // 10% de (11000 + 500 de cebolla)
  });

  it("sin burgers en el carrito pide agregar una", () => {
    expect(evalCode("BURGER10", [], WEDNESDAY).error).toBe(
      "BURGER10 es 10% off en burgers (incluye agregados): agregá una burger al carrito",
    );
  });

  it("vale miercoles 21/10 y jueves 22/10, no antes ni despues (BA)", () => {
    expect(evalCode("BURGER10", [DOBLE], WEDNESDAY).appliedCode).toBe("BURGER10");
    expect(evalCode("BURGER10", [DOBLE], THURSDAY).appliedCode).toBe("BURGER10");
    expect(evalCode("BURGER10", [DOBLE], new Date("2026-10-20T23:59:59-03:00")).error).toBe(
      "BURGER10 es válido miércoles 21/10 y jueves 22/10 (BA)",
    );
    expect(evalCode("BURGER10", [DOBLE], new Date("2026-10-23T00:00:00-03:00")).error).toBe(
      "BURGER10 es válido miércoles 21/10 y jueves 22/10 (BA)",
    );
  });
});

describe("UNAMAS", () => {
  const NOW = new Date("2026-10-21T20:00:00-03:00"); // miercoles 21/10

  it("acepta el codigo sin importar mayusculas ni espacios", () => {
    for (const input of ["UNAMAS", "unamas", " Una Mas ", "UNAMÁS"]) {
      expect(evalCode(input, [DOBLE], NOW).appliedCode).toBe("UNAMAS");
    }
  });

  it("pasa una doble a triple, 1 carne por pedido, sin recargo", () => {
    const result = evalCode("UNAMAS", [SIMPLE, DOBLE], NOW);
    expect(result.discount).toBe(0);
    expect(result.surcharge).toBe(0);
    expect(result.freeMeat).toMatchObject({ lineKey: DOBLE.key, lineQty: 2 });
  });

  it("doble con promo del dia: se cobra a precio habitual (no acumulable)", () => {
    expect(evalCode("UNAMAS", [AMERICAN_PROMO], NOW).surcharge).toBe(1500);
  });

  it("sin doble pide agregar una", () => {
    expect(evalCode("UNAMAS", [SIMPLE, TRIPLE], NOW).error).toBe(
      "UNAMAS es para hamburguesas dobles: agregá una doble al carrito",
    );
  });

  it("vale hasta el miercoles 21/10 23:49 y vence a las 23:50 (BA)", () => {
    expect(evalCode("UNAMAS", [DOBLE], new Date("2026-10-21T23:49:59-03:00")).appliedCode).toBe("UNAMAS");
    expect(evalCode("UNAMAS", [DOBLE], new Date("2026-10-21T23:50:00-03:00")).error).toBe("La promo UNAMAS finalizó");
  });
});
