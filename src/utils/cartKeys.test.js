import { describe, expect, it } from "vitest";
import { buildBurgerLineKey, buildBurgerVariantDraft } from "./cartKeys";

describe("buildBurgerLineKey: cantidad de un mismo agregado (ej. carne extra)", () => {
  it("2 y 5 unidades del mismo extra dan claves DISTINTAS (no se mergean en la misma linea)", () => {
    const base = { burgerId: "cheese", size: "simple" };
    const key2 = buildBurgerLineKey({ ...base, extrasIds: ["carne_cheddar", "carne_cheddar"] });
    const key5 = buildBurgerLineKey({
      ...base,
      extrasIds: Array(5).fill("carne_cheddar"),
    });
    expect(key2).not.toBe(key5);
  });

  it("el orden en que se agregaron no importa: misma cantidad = misma clave", () => {
    const base = { burgerId: "cheese", size: "doble" };
    const keyA = buildBurgerLineKey({ ...base, extrasIds: ["cheddar", "carne_cheddar", "carne_cheddar"] });
    const keyB = buildBurgerLineKey({ ...base, extrasIds: ["carne_cheddar", "cheddar", "carne_cheddar"] });
    expect(keyA).toBe(keyB);
  });

  it("extras sin repetir se comportan como siempre (una sola unidad de cada uno)", () => {
    const base = { burgerId: "cheese", size: "simple" };
    const keyA = buildBurgerLineKey({ ...base, extrasIds: ["cheddar", "bacon_crocante"] });
    const keyB = buildBurgerLineKey({ ...base, extrasIds: ["bacon_crocante", "cheddar"] });
    expect(keyA).toBe(keyB);
  });

  it("removedIds y papasIds (sin repetidos esperados) no cambian de comportamiento", () => {
    const key = buildBurgerLineKey({
      burgerId: "american",
      size: "triple",
      removedIds: ["lettuce", "tomato"],
      papasIds: ["fries_upgrade"],
    });
    expect(key).toBe("burger:american|size:triple|extras:|removed:lettuce,tomato|papas:fries_upgrade|note:");
  });
});

describe("buildBurgerVariantDraft: conserva agregados repetidos", () => {
  it("3 'Carne c/cheddar' llegan completas al draft.extras (no se deduplican)", () => {
    const item = { meta: { burgerId: "cheese", size: "simple" } };
    const extras = [
      { id: "carne_cheddar", name: "Carne c/cheddar", price: 4000 },
      { id: "carne_cheddar", name: "Carne c/cheddar", price: 4000 },
      { id: "carne_cheddar", name: "Carne c/cheddar", price: 4000 },
    ];
    const draft = buildBurgerVariantDraft(item, { extras });
    expect(draft.extras).toHaveLength(3);
    expect(draft.meta.extrasIds).toEqual(["carne_cheddar", "carne_cheddar", "carne_cheddar"]);
  });
});
