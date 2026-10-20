import { describe, expect, it } from "vitest";
import { getCartLineUnitTotal, getCartItemsTotal } from "./cartLineTotals";

describe("getCartLineUnitTotal: agregados repetidos (ej. carne extra) suman una vez por unidad", () => {
  it("3 'Carne c/cheddar' en una burger suman las 3 al precio de la linea", () => {
    const item = {
      unitPrice: 11500, // Cheese simple
      extras: Array(3).fill({ id: "carne_cheddar", name: "Carne c/cheddar", price: 4000 }),
      papas: [],
    };
    expect(getCartLineUnitTotal(item)).toBe(11500 + 3 * 4000);
  });

  it("el total del carrito multiplica la linea completa por la cantidad de unidades", () => {
    const item = {
      qty: 2,
      unitPrice: 11500,
      extras: [{ id: "carne_cheddar", name: "Carne c/cheddar", price: 4000 }],
      papas: [],
    };
    expect(getCartItemsTotal([item])).toBe(2 * (11500 + 4000));
  });
});
