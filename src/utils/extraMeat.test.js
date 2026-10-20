import { describe, expect, it } from "vitest";
import { EXTRA_MEAT_ID, MAX_TOTAL_PATTIES, getMaxExtraMeat } from "./extraMeat";

describe("getMaxExtraMeat: tope de carne extra segun el talle", () => {
  it("simple (1 carne de base) admite hasta 5 extras (total 6)", () => {
    expect(getMaxExtraMeat("simple")).toBe(5);
  });

  it("doble (2 carnes de base) admite hasta 4 extras (total 6)", () => {
    expect(getMaxExtraMeat("doble")).toBe(4);
  });

  it("triple (3 carnes de base) admite hasta 3 extras (total 6)", () => {
    expect(getMaxExtraMeat("triple")).toBe(3);
  });

  it("talle desconocido (ej. undefined) usa el fallback mas permisivo, no bloquea", () => {
    expect(getMaxExtraMeat(undefined)).toBe(5);
    expect(getMaxExtraMeat("otro")).toBe(5);
  });

  it("el total nunca pasa de 6 carnes para ningun talle conocido", () => {
    for (const size of ["simple", "doble", "triple"]) {
      const base = { simple: 1, doble: 2, triple: 3 }[size];
      expect(base + getMaxExtraMeat(size)).toBe(MAX_TOTAL_PATTIES);
    }
  });

  it("EXTRA_MEAT_ID apunta al extra real del menu", () => {
    expect(EXTRA_MEAT_ID).toBe("carne_cheddar");
  });
});
