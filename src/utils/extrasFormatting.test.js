import { describe, expect, it } from "vitest";
import { formatExtrasNames } from "./extrasFormatting";

describe("formatExtrasNames", () => {
  it("un solo agregado: sin sufijo de cantidad", () => {
    expect(formatExtrasNames([{ id: "cheddar", name: "Cheddar", price: 500 }])).toBe("Cheddar");
  });

  it("agregado repetido: agrupa con 'xN'", () => {
    const extras = Array(3).fill({ id: "carne_cheddar", name: "Carne c/cheddar", price: 4000 });
    expect(formatExtrasNames(extras)).toBe("Carne c/cheddar x3");
  });

  it("mezcla de repetidos y unicos, conserva el orden del primer agregado de cada nombre", () => {
    const extras = [
      { id: "cheddar", name: "Cheddar", price: 500 },
      { id: "carne_cheddar", name: "Carne c/cheddar", price: 4000 },
      { id: "carne_cheddar", name: "Carne c/cheddar", price: 4000 },
    ];
    expect(formatExtrasNames(extras)).toBe("Cheddar + Carne c/cheddar x2");
  });

  it("joiner personalizado (ej. promos, ' / ')", () => {
    const extras = [
      { id: "a", name: "A", price: 100 },
      { id: "b", name: "B", price: 100 },
    ];
    expect(formatExtrasNames(extras, " / ")).toBe("A / B");
  });

  it("lista vacia da string vacio", () => {
    expect(formatExtrasNames([])).toBe("");
    expect(formatExtrasNames()).toBe("");
  });
});
