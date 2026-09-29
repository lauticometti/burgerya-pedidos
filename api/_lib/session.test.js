import { describe, it, expect } from "vitest";
import { createSessionId, buildSessionCookie, readSessionId, hashIp } from "./session.js";

function reqFromSetCookie(setCookieHeader) {
  const nameValue = setCookieHeader.split(";")[0]; // "bya_sid=<value>"
  return { headers: { cookie: nameValue } };
}

describe("cookie de sesion firmada", () => {
  it("firma y verifica correctamente un sessionId propio", () => {
    const sessionId = createSessionId();
    const setCookie = buildSessionCookie(sessionId);
    const req = reqFromSetCookie(setCookie);
    expect(readSessionId(req)).toBe(sessionId);
  });

  it("rechaza una cookie forjada (firma que no corresponde al valor)", () => {
    const req = { headers: { cookie: `bya_sid=${encodeURIComponent("cualquier-id.firma-inventada")}` } };
    expect(readSessionId(req)).toBe(null);
  });

  it("rechaza un sessionId alterado aunque se reuse una firma valida de otra sesion", () => {
    const sessionId = createSessionId();
    const setCookie = buildSessionCookie(sessionId);
    const rawValue = decodeURIComponent(setCookie.split(";")[0].split("=")[1]);
    const signature = rawValue.slice(rawValue.lastIndexOf(".") + 1);
    const tampered = `bya_sid=${encodeURIComponent(`otro-id-distinto.${signature}`)}`;
    const req = { headers: { cookie: tampered } };
    expect(readSessionId(req)).toBe(null);
  });

  it("devuelve null si no hay cookie en la request", () => {
    expect(readSessionId({ headers: {} })).toBe(null);
  });

  it("devuelve null si el header cookie no trae el nombre esperado", () => {
    expect(readSessionId({ headers: { cookie: "otra_cookie=algo" } })).toBe(null);
  });

  it("genera sessionId distintos en cada llamada", () => {
    expect(createSessionId()).not.toBe(createSessionId());
  });
});

describe("hashIp", () => {
  it("es deterministico para la misma IP", () => {
    expect(hashIp("190.1.2.3")).toBe(hashIp("190.1.2.3"));
  });

  it("no expone la IP en claro en el resultado", () => {
    expect(hashIp("190.1.2.3")).not.toContain("190.1.2.3");
  });

  it("IPs distintas producen hashes distintos", () => {
    expect(hashIp("190.1.2.3")).not.toBe(hashIp("190.1.2.4"));
  });
});
