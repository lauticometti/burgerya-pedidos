import { describe, it, expect } from "vitest";
import { classifyLocationResponse } from "./locationApiResult";

describe("classifyLocationResponse", () => {
  it("una respuesta correcta es ok", () => {
    expect(classifyLocationResponse({ ok: true, status: 200, data: { suggestions: [] } })).toEqual({ kind: "ok" });
  });

  it("rate_limited y suspicious_activity son 'limited': usan el mensaje del servidor y la espera", () => {
    const rate = classifyLocationResponse({
      ok: false,
      status: 429,
      data: { error: "rate_limited", message: "Estás haciendo muchas búsquedas seguidas. Esperá unos minutos o elegí tu ubicación en el mapa.", retryAfterSeconds: 300 },
    });
    expect(rate).toEqual({
      kind: "limited",
      message: "Estás haciendo muchas búsquedas seguidas. Esperá unos minutos o elegí tu ubicación en el mapa.",
      retryAfterSeconds: 300,
    });

    const susp = classifyLocationResponse({ ok: false, status: 429, data: { error: "suspicious_activity", message: "x", retryAfterSeconds: 60 } });
    expect(susp.kind).toBe("limited");
  });

  it("un limite sin mensaje igual muestra el texto pedido, nunca vacio", () => {
    const r = classifyLocationResponse({ ok: false, status: 429, data: { error: "rate_limited" } });
    expect(r.kind).toBe("limited");
    expect(r.message).toMatch(/Estás haciendo muchas búsquedas seguidas\./);
    expect(r.message).toMatch(/Esperá unos segundos o elegí tu ubicación en el mapa\./);
    expect(r.retryAfterSeconds).toBe(null);
  });

  it("un limite NUNCA se clasifica como servicio caido", () => {
    for (const error of ["rate_limited", "suspicious_activity"]) {
      expect(classifyLocationResponse({ ok: false, status: 429, data: { error } }).kind).not.toBe("unavailable");
    }
  });

  it("errores reales del proveedor o del servidor si son 'unavailable'", () => {
    for (const [status, error] of [[503, "not_configured"], [503, "provider_quota_exhausted"], [502, "upstream_error"], [503, "service_unavailable"]]) {
      expect(classifyLocationResponse({ ok: false, status, data: { error, message: "boom" } })).toEqual({ kind: "unavailable", message: "boom" });
    }
  });

  it("sin cuerpo (red caida, respuesta no JSON) es 'unavailable' con un mensaje", () => {
    const r = classifyLocationResponse({ ok: false, status: 0, data: null });
    expect(r.kind).toBe("unavailable");
    expect(r.message.length).toBeGreaterThan(10);
  });

  it("un 429 que no es un estado de limite conocido no se toma por limite", () => {
    expect(classifyLocationResponse({ ok: false, status: 429, data: { error: "otra_cosa" } }).kind).toBe("unavailable");
  });
});
