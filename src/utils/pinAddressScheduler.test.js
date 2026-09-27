import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinAddressScheduler, REVERSE_DEBOUNCE_MS } from "./pinAddressScheduler";
import { computeDeliveryQuote } from "../hooks/useDeliveryQuote";

// Beethoven 1234 (Zona 1, $1.000): coordenadas ya verificadas contra el motor real.
const Z1 = { lat: -34.600409, lng: -58.64632975 };
const OTRO = { lat: -34.6023, lng: -58.6429 };

let lookup;
let onFound;
let onFailed;
let scheduler;

const confirmed = (p, source = "map") => ({ ...p, source });
const moving = (p) => ({ ...p, source: "map", moving: true });

beforeEach(() => {
  vi.useFakeTimers();
  lookup = vi.fn(async () => ({ address: "Beethoven 1234, Hurlingham", kind: "address" }));
  onFound = vi.fn();
  onFailed = vi.fn();
  scheduler = createPinAddressScheduler({ lookup, onFound, onFailed });
});

afterEach(() => {
  scheduler.cancel();
  vi.useRealTimers();
});

const settle = (ms = REVERSE_DEBOUNCE_MS + 10) => vi.advanceTimersByTimeAsync(ms);

describe("mover el pin: 0 llamadas a Geocoding mientras se mueve", () => {
  it("cientos de posiciones de arrastre (moving) nunca consultan, ni esperando mucho despues", async () => {
    for (let i = 0; i < 300; i++) {
      scheduler.schedule(moving({ lat: Z1.lat + i * 0.00001, lng: Z1.lng }));
      await vi.advanceTimersByTimeAsync(16); // ~un cuadro
    }
    await settle(10_000);
    expect(lookup).not.toHaveBeenCalled();
    expect(onFound).not.toHaveBeenCalled();
  });

  it("dragend: tras muchos movimientos, UNA sola consulta, con la posicion final", async () => {
    for (let i = 0; i < 100; i++) {
      scheduler.schedule(moving({ lat: Z1.lat + i * 0.00001, lng: Z1.lng }));
      await vi.advanceTimersByTimeAsync(16);
    }
    expect(lookup).not.toHaveBeenCalled();

    const finalPos = { lat: Z1.lat + 99 * 0.00001, lng: Z1.lng };
    scheduler.schedule(confirmed(finalPos)); // dragend
    await settle();
    await settle(5_000);

    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith(finalPos.lat, finalPos.lng);
    expect(onFound).toHaveBeenCalledTimes(1);
  });

  it("la consulta espera al debounce: no sale inmediatamente al confirmar", async () => {
    scheduler.schedule(confirmed(Z1));
    await vi.advanceTimersByTimeAsync(REVERSE_DEBOUNCE_MS - 50);
    expect(lookup).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("empezar a arrastrar cancela la consulta pendiente del punto anterior", async () => {
    scheduler.schedule(confirmed(Z1));
    await vi.advanceTimersByTimeAsync(200);
    scheduler.schedule(moving(OTRO)); // el cliente agarro el pin otra vez
    await settle(5_000);
    expect(lookup).not.toHaveBeenCalled();
  });
});

describe("confirmar la ubicacion: maximo 1 consulta", () => {
  it("varios toques finales seguidos (menos de 600 ms entre si) hacen una sola consulta, con el ultimo punto", async () => {
    scheduler.schedule(confirmed(Z1));
    await vi.advanceTimersByTimeAsync(200);
    scheduler.schedule(confirmed(OTRO));
    await vi.advanceTimersByTimeAsync(200);
    scheduler.schedule(confirmed({ lat: Z1.lat, lng: Z1.lng + 0.0005 }));
    await settle();

    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith(Z1.lat, Z1.lng + 0.0005);
  });

  it("geolocation: una sola consulta; repetir la misma posicion no consulta de nuevo", async () => {
    scheduler.schedule(confirmed(Z1, "geolocation"));
    await settle();
    scheduler.schedule(confirmed(Z1, "geolocation")); // mismo punto otra vez
    scheduler.schedule(confirmed({ lat: Z1.lat + 0.0000001, lng: Z1.lng }, "geolocation")); // < 1 m
    await settle(5_000);

    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("pasar de geolocation a mapa en el mismo punto no vuelve a consultar", async () => {
    scheduler.schedule(confirmed(Z1, "geolocation"));
    await settle();
    scheduler.schedule(confirmed(Z1, "map"));
    await settle(5_000);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("un punto distinto si consulta", async () => {
    scheduler.schedule(confirmed(Z1));
    await settle();
    scheduler.schedule(confirmed(OTRO));
    await settle();
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it("una ubicacion de la busqueda de direcciones o sin ubicacion nunca consulta", async () => {
    scheduler.schedule({ ...Z1, source: "search" });
    scheduler.schedule(null);
    scheduler.schedule({ lat: NaN, lng: 1, source: "map" });
    await settle(5_000);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("quitar la ubicacion cancela lo pendiente", async () => {
    scheduler.schedule(confirmed(Z1));
    scheduler.schedule(null);
    await settle(5_000);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("cancel() (al cerrar el componente) descarta lo pendiente", async () => {
    scheduler.schedule(confirmed(Z1));
    scheduler.cancel();
    await settle(5_000);
    expect(lookup).not.toHaveBeenCalled();
  });
});

describe("respuestas viejas", () => {
  it("si el pin cambia mientras una consulta esta en vuelo, esa respuesta se descarta", async () => {
    let resolveA;
    lookup.mockImplementationOnce(() => new Promise((r) => (resolveA = r)));

    scheduler.schedule(confirmed(Z1));
    await settle(); // la consulta de A ya salio y sigue en vuelo
    expect(lookup).toHaveBeenCalledTimes(1);

    scheduler.schedule(confirmed(OTRO));
    await settle(); // sale la de B (resuelve sola con la direccion por defecto)
    resolveA({ address: "Direccion vieja", kind: "address" });
    await settle();

    expect(onFound).toHaveBeenCalledTimes(1);
    expect(onFound.mock.calls[0][0].address).toBe("Beethoven 1234, Hurlingham");
    expect(onFound).not.toHaveBeenCalledWith({ address: "Direccion vieja", kind: "address" }, expect.anything());
  });
});

describe("si Geocoding falla, la ubicacion y la cotizacion siguen intactas", () => {
  it("un fallo (sin resultado o excepcion) avisa con onFailed y nunca con onFound", async () => {
    lookup.mockResolvedValueOnce(null);
    scheduler.schedule(confirmed(Z1));
    await settle();
    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onFound).not.toHaveBeenCalled();

    lookup.mockRejectedValueOnce(new Error("red caida"));
    scheduler.schedule(confirmed(OTRO));
    await settle();
    expect(onFailed).toHaveBeenCalledTimes(2);
    expect(onFound).not.toHaveBeenCalled();
  });

  it("NO se pierde lat/lng ni el precio: la cotizacion es local y no depende de la consulta", async () => {
    // Estado tal como lo lleva el carrito: la ubicacion es del cliente/mapa; el
    // planificador solo puede reportar un fallo, no modificarla.
    const state = { location: Object.freeze(confirmed(Z1)), failedKey: null };
    const before = computeDeliveryQuote(state.location, "Delivery");
    expect(before).toMatchObject({ status: "covered", zoneLabel: "Zona 1", deliveryPrice: 1000 });

    lookup.mockRejectedValue(new Error("OVER_QUERY_LIMIT"));
    const failing = createPinAddressScheduler({ lookup, onFound, onFailed: (key) => (state.failedKey = key) });
    failing.schedule(state.location);
    await settle();

    expect(state.failedKey).toBe(`${Z1.lat.toFixed(5)},${Z1.lng.toFixed(5)}`);
    expect(state.location).toEqual(confirmed(Z1)); // sigue el mismo lat/lng
    expect(computeDeliveryQuote(state.location, "Delivery")).toEqual(before); // sigue Zona 1 / $1.000
    failing.cancel();
  });

  it("onFailed recibe el motivo (p.ej. un limite de uso con su mensaje) para mostrarlo tal cual", async () => {
    const limited = Object.assign(new Error("limited"), { userMessage: "Estás consultando muchas direcciones seguidas." });
    lookup.mockRejectedValueOnce(limited);
    scheduler.schedule(confirmed(Z1));
    await settle();

    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onFailed.mock.calls[0][1].userMessage).toBe("Estás consultando muchas direcciones seguidas.");
    expect(onFound).not.toHaveBeenCalled();
  });

  it("tras un fallo se puede reintentar tocando otra vez el mismo punto", async () => {
    lookup.mockResolvedValueOnce(null);
    scheduler.schedule(confirmed(Z1));
    await settle();
    expect(onFailed).toHaveBeenCalledTimes(1);

    scheduler.schedule(confirmed(Z1));
    await settle();
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(onFound).toHaveBeenCalledTimes(1);
  });
});

describe("zona y precio siguen calculandose localmente, en vivo", () => {
  it("mover el pin (muchas posiciones) recotiza en cada una sin ninguna consulta a Geocoding", async () => {
    const statuses = new Set();
    for (let i = 0; i <= 40; i++) {
      // de Malaspina (cubierto) hacia el oeste, hasta salir de la cobertura
      const loc = moving({ lat: Z1.lat, lng: Z1.lng - i * 0.002 });
      statuses.add(computeDeliveryQuote(loc, "Delivery").status);
      scheduler.schedule(loc);
      await vi.advanceTimersByTimeAsync(16);
    }
    expect(statuses).toEqual(new Set(["covered", "uncovered"])); // recotiza en vivo, y sabe cuando no llega
    await settle(5_000);
    expect(lookup).not.toHaveBeenCalled();
  });
});
