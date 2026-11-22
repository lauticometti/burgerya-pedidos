import { describe, it, expect } from "vitest";
import { evaluateCoupon, evaluateDbardoStack } from "./coupons";

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
  const WEDNESDAY = new Date("2026-11-04T20:00:00-03:00");
  const THURSDAY = new Date("2026-11-05T20:00:00-03:00");
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
    expect(result.message).toBe("BURGER10 aplicado: 10% off en todas las burgers");
  });

  it("NO se aplica sobre los agregados (ej. cebolla): solo la burger", () => {
    const result = evalCode("BURGER10", [SIMPLE_CON_CEBOLLA], WEDNESDAY);
    expect(result.discount).toBe(1100); // 10% de 11000, sin contar la cebolla
  });

  it("sin burgers en el carrito pide agregar una", () => {
    expect(evalCode("BURGER10", [], WEDNESDAY).error).toBe(
      "BURGER10 es 10% off en burgers: agregá una burger al carrito",
    );
  });

  it("vale miercoles 4/11 y jueves 5/11, no antes ni despues (BA)", () => {
    expect(evalCode("BURGER10", [DOBLE], WEDNESDAY).appliedCode).toBe("BURGER10");
    expect(evalCode("BURGER10", [DOBLE], THURSDAY).appliedCode).toBe("BURGER10");
    expect(evalCode("BURGER10", [DOBLE], new Date("2026-11-03T23:59:59-03:00")).error).toBe(
      "BURGER10 es válido miércoles 4/11 y jueves 5/11 (BA)",
    );
    expect(evalCode("BURGER10", [DOBLE], new Date("2026-11-06T00:00:00-03:00")).error).toBe(
      "BURGER10 es válido miércoles 4/11 y jueves 5/11 (BA)",
    );
  });
});

describe("CORTASEMANA10", () => {
  const WEDNESDAY = new Date("2026-10-28T20:00:00-03:00");
  const THURSDAY = new Date("2026-10-29T20:00:00-03:00");
  const SIMPLE_CON_CEBOLLA = {
    ...SIMPLE,
    key: "burger:cheese:simple:cebolla",
    extras: [{ id: "cebolla", name: "Cebolla", price: 500 }],
  };
  it("acepta el codigo sin importar mayusculas ni espacios", () => {
    for (const input of ["CORTASEMANA10", "cortasemana10", "  CortaSemana10 "]) {
      expect(evalCode(input, [DOBLE], WEDNESDAY).appliedCode).toBe("CORTASEMANA10");
    }
  });

  it("10% off sobre todas las burgers del carrito", () => {
    const result = evalCode("CORTASEMANA10", [SIMPLE, DOBLE], WEDNESDAY);
    expect(result.discount).toBe(1100 + 2900); // 10% de 11000 y de 2x14500
    expect(result.message).toBe("CORTASEMANA10 aplicado: 10% off en todas las burgers");
  });

  it("NO se aplica sobre los agregados (ej. cebolla): solo la burger", () => {
    const result = evalCode("CORTASEMANA10", [SIMPLE_CON_CEBOLLA], WEDNESDAY);
    expect(result.discount).toBe(1100); // 10% de 11000, sin contar la cebolla
  });

  it("sin burgers en el carrito pide agregar una", () => {
    expect(evalCode("CORTASEMANA10", [], WEDNESDAY).error).toBe(
      "CORTASEMANA10 es 10% off en burgers: agregá una burger al carrito",
    );
  });

  it("vale miercoles 28/10 y jueves 29/10, no antes ni despues (BA)", () => {
    expect(evalCode("CORTASEMANA10", [DOBLE], WEDNESDAY).appliedCode).toBe("CORTASEMANA10");
    expect(evalCode("CORTASEMANA10", [DOBLE], THURSDAY).appliedCode).toBe("CORTASEMANA10");
    expect(evalCode("CORTASEMANA10", [DOBLE], new Date("2026-10-27T23:59:59-03:00")).error).toBe(
      "CORTASEMANA10 es válido miércoles 28/10 y jueves 29/10 (BA)",
    );
    expect(evalCode("CORTASEMANA10", [DOBLE], new Date("2026-10-30T00:00:00-03:00")).error).toBe(
      "CORTASEMANA10 es válido miércoles 28/10 y jueves 29/10 (BA)",
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

describe("UNAMAS: valor de la carne regalada", () => {
  it("es triple - doble a precio habitual de esa burger", () => {
    const smo = { key: "burger:smoklahoma:doble", name: "Smoklahoma", qty: 1, unitPrice: 17000, meta: { type: "burger", burgerId: "smoklahoma", size: "doble" } };
    const r = evalCode("UNAMAS", [smo], new Date("2026-10-21T20:00:00-03:00"));
    expect(r.freeMeat.meatValue).toBe(4000);
  });
});

// evaluateCoupon ya NO reconoce códigos D BARDO (DB-XXXX): esos se acumulan
// de a varios por pedido y se evalúan con evaluateDbardoStack.
describe("D BARDO: evaluateCoupon ya no los reconoce", () => {
  it("un código D BARDO vía evaluateCoupon da 'Código inválido'", () => {
    expect(evalCode("DB-BT3N", [DOBLE], VALID_NOW).error).toBe("Código inválido");
  });
});

function evalDbardo(codes, cartItems, cartTotal, now = VALID_NOW) {
  return evaluateDbardoStack({ codes, cartItems, cartTotal, now });
}

describe("D BARDO: códigos % off (tragos)", () => {
  it("DB-BT3N (10%) aplica sobre el total", () => {
    const result = evalDbardo(["DB-BT3N"], [], 10000);
    expect(result.entries).toEqual([{ code: "DB-BT3N", tier: 10, discount: 1000 }]);
    expect(result.totalDiscount).toBe(1000);
  });

  it("acepta el código sin importar mayúsculas ni espacios", () => {
    for (const input of ["db-bt3n", " DB BT3N ", "db bt3n"]) {
      expect(evalDbardo([input], [], 10000).entries[0].code).toBe("DB-BT3N");
    }
  });

  it("DB-U9N6 (50%) respeta el tope de $30.000 en el total aplicado", () => {
    const result = evalDbardo(["DB-U9N6"], [], 100000);
    expect(result.entries[0].discount).toBe(50000); // nominal, sin topear
    expect(result.totalDiscount).toBe(30000); // lo que realmente se descuenta
    expect(result.capped).toBe(true);
  });

  it("DB-PJT4 (30%) sin tope cuando el pedido es chico", () => {
    const result = evalDbardo(["DB-PJT4"], [], 10000);
    expect(result.totalDiscount).toBe(3000);
    expect(result.capped).toBe(false);
  });

  it("vale hasta el 30/11/2026 y vence el 01/12/2026 00:00 (BA)", () => {
    expect(
      evalDbardo(["DB-BT3N"], [], 10000, new Date("2026-11-30T23:59:59-03:00")).entries[0].error,
    ).toBeUndefined();
    expect(
      evalDbardo(["DB-BT3N"], [], 10000, new Date("2026-12-01T00:00:00-03:00")).entries[0].error,
    ).toBe("Ese código de D BARDO venció");
  });

  it("código D BARDO inexistente da error por entrada", () => {
    expect(evalDbardo(["DB-NOEXISTE"], [], 10000).entries[0].error).toBe("Código inválido");
  });
});

describe("D BARDO: burger doble gratis", () => {
  it("DB-28TL regala la doble más cara del carrito, no acepta simple ni triple", () => {
    const result = evalDbardo(["DB-28TL"], [SIMPLE, DOBLE, TRIPLE], 0);
    const entry = result.entries[0];
    expect(entry.code).toBe("DB-28TL");
    expect(entry.targetLineKey).toBe(DOBLE.key);
    expect(entry.targetSize).toBe("doble");
    expect(entry.discount).toBe(15500); // precio de Cheese doble en menu.js
    expect(result.totalDiscount).toBe(15500);
  });

  it("sin ninguna doble en el carrito, pide agregar una", () => {
    const result = evalDbardo(["DB-28TL"], [SIMPLE, TRIPLE], 0);
    expect(result.entries[0].error).toBe(
      "No hay más burgers dobles en el carrito para regalar: agregá otra doble",
    );
  });

  it("vence el 01/12/2026 00:00 (BA)", () => {
    const result = evalDbardo(["DB-28TL"], [DOBLE], 0, new Date("2026-12-01T00:00:00-03:00"));
    expect(result.entries[0].error).toBe("Ese código de D BARDO venció");
  });
});

describe("D BARDO: varios códigos acumulados en el mismo pedido", () => {
  it("suma el descuento de varios códigos de %", () => {
    const result = evalDbardo(["DB-BT3N", "DB-SEVS"], [], 10000); // 10% + 15%
    expect(result.entries.map((e) => e.discount)).toEqual([1000, 1500]);
    expect(result.totalDiscount).toBe(2500);
    expect(result.capped).toBe(false);
  });

  it("el tope de $30.000 es total, no por código", () => {
    // 2x 50% sobre 40000 = 20000 + 20000 = 40000 nominal, tope real 30000
    const result = evalDbardo(["DB-U9N6", "DB-N4HA"], [], 40000);
    expect(result.rawTotal).toBe(40000);
    expect(result.totalDiscount).toBe(30000);
    expect(result.capped).toBe(true);
  });

  it("dos códigos 'burger' regalan dos dobles distintas (la más cara primero), con tope total", () => {
    const cheese = { key: "burger:cheese:doble", name: "Cheese", qty: 1, unitPrice: 15500, meta: { type: "burger", burgerId: "cheese", size: "doble" } };
    const otra = { key: "burger:bacon:doble", name: "Bacon", qty: 1, unitPrice: 16500, meta: { type: "burger", burgerId: "bacon", size: "doble" } };
    const result = evalDbardo(["DB-28TL", "DB-PLV7"], [cheese, otra], 0);
    expect(result.entries[0].targetLineKey).toBe(otra.key); // la más cara (Bacon $16.500) primero
    expect(result.entries[0].discount).toBe(16500);
    expect(result.entries[1].targetLineKey).toBe(cheese.key);
    expect(result.entries[1].discount).toBe(15500);
    expect(result.rawTotal).toBe(32000);
    expect(result.totalDiscount).toBe(30000); // tope $30.000 total
    expect(result.capped).toBe(true);
  });

  it("un tercer código 'burger' sin más dobles disponibles da error, sin tocar los otros dos", () => {
    const unaSolaDoble = { key: "burger:cheese:doble", name: "Cheese", qty: 1, unitPrice: 15500, meta: { type: "burger", burgerId: "cheese", size: "doble" } };
    const result = evalDbardo(["DB-28TL", "DB-PLV7", "DB-5GXG"], [unaSolaDoble], 0);
    expect(result.entries[0].error).toBeUndefined();
    expect(result.entries[1].error).toBe(
      "No hay más burgers dobles en el carrito para regalar: agregá otra doble",
    );
    expect(result.totalDiscount).toBe(15500);
  });

  it("no deja aplicar el mismo código dos veces", () => {
    const result = evalDbardo(["DB-BT3N", "DB-BT3N"], [], 10000);
    expect(result.entries[1].error).toBe("Ese código ya está aplicado");
    expect(result.totalDiscount).toBe(1000);
  });
});

describe("FELIPE", () => {
  const SAT = new Date("2026-11-21T20:00:00-03:00"); // sábado 21/11
  const SUN = new Date("2026-11-22T22:00:00-03:00"); // domingo 22/11
  const CHEESE_DOBLE = { key: "burger:cheese:doble", name: "Cheese", qty: 1, unitPrice: 15500, meta: { type: "burger", burgerId: "cheese", size: "doble" } };
  const CHEESE_SIMPLE = { key: "burger:cheese:simple", name: "Cheese", qty: 1, unitPrice: 11500, meta: { type: "burger", burgerId: "cheese", size: "simple" } };
  const SMOK_DOBLE = { key: "burger:smoklahoma:doble", name: "Smoklahoma", qty: 1, unitPrice: 17000, meta: { type: "burger", burgerId: "smoklahoma", size: "doble" } };
  const SMOK_TRIPLE = { key: "burger:smoklahoma:triple", name: "Smoklahoma", qty: 1, unitPrice: 21000, meta: { type: "burger", burgerId: "smoklahoma", size: "triple" } };

  it("acepta el código sin importar mayúsculas ni espacios", () => {
    for (const input of ["FELIPE", "felipe", "  Felipe ", " FeLiPe "]) {
      expect(evalCode(input, [CHEESE_DOBLE], SAT).appliedCode).toBe("FELIPE");
    }
  });

  it("caso 1: una doble de la más barata -> descuenta su precio entero", () => {
    const result = evalCode("FELIPE", [CHEESE_DOBLE], SAT);
    expect(result.appliedCode).toBe("FELIPE");
    expect(result.targetLineKey).toBe(CHEESE_DOBLE.key);
    expect(result.discount).toBe(15500);
  });

  it("caso 2: una triple de la más cara -> descuenta el precio de SU doble, no el de la triple", () => {
    const result = evalCode("FELIPE", [SMOK_TRIPLE], SAT);
    expect(result.targetLineKey).toBe(SMOK_TRIPLE.key);
    expect(result.targetSize).toBe("triple");
    expect(result.discount).toBe(17000); // doble de Smoklahoma, no los 21000 de la triple
  });

  it("caso 3: dos dobles de distinto precio -> gana la más cara, una sola unidad", () => {
    const result = evalCode("FELIPE", [CHEESE_DOBLE, SMOK_DOBLE], SAT);
    expect(result.targetLineKey).toBe(SMOK_DOBLE.key);
    expect(result.discount).toBe(17000);
  });

  it("caso 4: solo simples -> rechazado con el mensaje pedido", () => {
    const result = evalCode("FELIPE", [CHEESE_SIMPLE], SAT);
    expect(result.error).toBe("este código aplica a burgers dobles o superiores");
    expect(result.appliedCode).toBeUndefined();
  });

  it("carrito vacío (sin burgers) -> mismo rechazo", () => {
    expect(evalCode("FELIPE", [], SAT).error).toBe("este código aplica a burgers dobles o superiores");
  });

  it("caso 7: acepta en minúsculas y con espacios alrededor (ya cubierto arriba, repetido explícito)", () => {
    expect(evalCode(" felipe ", [CHEESE_DOBLE], SAT).appliedCode).toBe("FELIPE");
  });

  it("vale sábado 21 y domingo 22/11, vence el lunes 23/11 00:00 (BA)", () => {
    expect(evalCode("FELIPE", [CHEESE_DOBLE], SAT).appliedCode).toBe("FELIPE");
    expect(evalCode("FELIPE", [CHEESE_DOBLE], SUN).appliedCode).toBe("FELIPE");
    expect(evalCode("FELIPE", [CHEESE_DOBLE], new Date("2026-11-22T23:59:59-03:00")).appliedCode).toBe("FELIPE");
    expect(evalCode("FELIPE", [CHEESE_DOBLE], new Date("2026-11-23T00:00:00-03:00")).error).toBe(
      "este código ya venció",
    );
  });

  it("caso 8: fecha simulada posterior al vencimiento -> rechazado", () => {
    const result = evalCode("FELIPE", [CHEESE_DOBLE], new Date("2026-11-24T12:00:00-03:00"));
    expect(result.error).toBe("este código ya venció");
    expect(result.appliedCode).toBeUndefined();
  });

  it("no descuenta adicionales: el campo discount es solo el valor de la burger", () => {
    // extras/papas no entran en cartItems de este test porque el descuento
    // de FELIPE nunca los toca (se calcula solo sobre meta.type==='burger');
    // acá solo confirmamos que el discount no cambia si hay otras líneas no-burger.
    const dipExtra = { key: "dip:1", name: "Dip extra", qty: 1, unitPrice: 1000, meta: { type: "dip" } };
    const result = evalCode("FELIPE", [CHEESE_DOBLE, dipExtra], SAT);
    expect(result.discount).toBe(15500);
  });
});
