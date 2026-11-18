import { afterEach, describe, expect, it } from "vitest";
import { getStoreStatus, setOsStoreStatus } from "./storeClosedMode";

// Miércoles 18/11/2026 21:00 en Buenos Aires (el horario local dice abierto).
const OPEN_LOCAL = new Date("2026-11-18T21:00:00-03:00");
// Martes 17/11/2026 21:00 (el horario local dice cerrado).
const CLOSED_LOCAL = new Date("2026-11-17T21:00:00-03:00");

afterEach(() => setOsStoreStatus(null));

describe("estado de la tienda que manda el OS", () => {
  it("sin respuesta del OS vale el horario local de siempre", () => {
    expect(getStoreStatus(OPEN_LOCAL).isClosed).toBeFalsy();
    expect(getStoreStatus(CLOSED_LOCAL).isClosed).toBe(true);
  });

  it("cierre manual del OS: cerrado, con su mensaje, aunque el horario local diga abierto", () => {
    setOsStoreStatus({ open: false, message: "La plancha está saturada. Volvemos a las 22:45." });
    const s = getStoreStatus(OPEN_LOCAL);
    expect(s.isClosed).toBe(true);
    expect(s.isOpenNow).toBe(false);
    expect(s.bannerState).toEqual({ type: "closed", message: "La plancha está saturada. Volvemos a las 22:45." });
  });

  it("el OS manda también para abrir: sin cartel de cerrado del horario local", () => {
    setOsStoreStatus({ open: true });
    const s = getStoreStatus(CLOSED_LOCAL);
    expect(s.isClosed).toBeFalsy();
    expect(s.showClosedBanner).toBe(false);
  });

  it("un estado inválido se ignora", () => {
    setOsStoreStatus({ nope: 1 });
    expect(getStoreStatus(CLOSED_LOCAL).isClosed).toBe(true);
  });
});
