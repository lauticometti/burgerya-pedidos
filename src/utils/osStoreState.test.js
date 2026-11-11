import { describe, expect, it } from "vitest";
import { applyStoreState, stockFieldsFor } from "./osStoreState";
import { getEffectiveForcedRemovals, getEffectiveNotice, isItemAvailable } from "./availability";

const american = () => ({
  id: "american",
  name: "American",
  // Marcas viejas de menu.js: con el OS dejan de contar.
  notice: "Sin pepinos",
  noticeUntil: "2099-01-01T00:00:00-03:00",
  forcedRemovals: [{ id: "pickles", label: "Pepinos agridulces" }],
  removableIngredients: [
    { id: "pickles", label: "Pepinos agridulces" },
    { id: "lettuce", label: "Lechuga" },
  ],
  isAvailable: 1,
});
const later = new Date(Date.now() + 3600_000).toISOString();

describe("stock del OS (una sola fuente)", () => {
  it("sin marcas en el OS: lo de menu.js se ignora y todo queda disponible", () => {
    const lists = { burgers: [american()], dips: [{ id: "dip_mil_islas", isAvailable: 0, unavailableReason: "Vuelve mañana" }] };
    applyStoreState({ stock: { products: {}, ingredients: {} } }, lists);
    expect(lists.burgers[0].forcedRemovals).toBeUndefined();
    expect(getEffectiveNotice(lists.burgers[0])).toBeNull();
    expect(isItemAvailable(lists.dips[0])).toBe(true);
  });

  it("producto sin stock en el OS: no disponible, con su aviso y hora", () => {
    const f = stockFieldsFor({ id: "dip_mil_islas" }, { products: { dip_mil_islas: { until: later, notice: "Vuelve mañana" } }, ingredients: {} });
    expect(f).toEqual({ isAvailable: 0, unavailableUntil: later, unavailableReason: "Vuelve mañana" });
    expect(isItemAvailable(f)).toBe(false);
  });

  it("ingrediente sin stock: se saca sí o sí de la burger, con aviso 'Sin ...'", () => {
    const item = { ...american(), ...stockFieldsFor(american(), { products: {}, ingredients: { lettuce: { until: later } } }) };
    expect(item.forcedRemovals).toEqual([{ id: "lettuce", label: "Lechuga" }]);
    expect(getEffectiveForcedRemovals(item)).toHaveLength(1);
    expect(item.notice).toBe("Sin lechuga");
    expect(item.noticeUntil).toBe(later);
  });

  it("'hasta reponer' (sin hora): no vence solo", () => {
    const f = stockFieldsFor(american(), { products: {}, ingredients: { pickles: { until: null } } });
    expect(f.forcedRemovalsUntil).toBeUndefined();
    expect(f.notice).toBe("Sin pepinos agridulces");
  });

  it("si el OS no mandó estado, no se toca nada", () => {
    const lists = { burgers: [american()] };
    applyStoreState(null, lists);
    expect(lists.burgers[0].notice).toBe("Sin pepinos");
  });
});
