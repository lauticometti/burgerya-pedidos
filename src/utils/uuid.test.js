import { describe, it, expect, vi, afterEach } from "vitest";
import { safeRandomUUID } from "./uuid";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => vi.unstubAllGlobals());

describe("safeRandomUUID", () => {
  it("usa crypto.randomUUID cuando existe (contexto seguro)", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "11111111-2222-4333-8444-555555555555", getRandomValues: () => {} });
    expect(safeRandomUUID()).toBe("11111111-2222-4333-8444-555555555555");
  });

  it("sin crypto.randomUUID (http en un celular) genera igual un UUID v4 valido", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: real.getRandomValues.bind(real) });
    const id = safeRandomUUID();
    expect(id).toMatch(UUID_V4);
  });

  it("dos llamadas sin randomUUID dan valores distintos", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: real.getRandomValues.bind(real) });
    expect(safeRandomUUID()).not.toBe(safeRandomUUID());
  });
});
