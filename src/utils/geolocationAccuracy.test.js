import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  classifyAccuracy,
  decideGeolocation,
  startGeolocationSampling,
  ACCURACY_TRUSTED_M,
  ACCURACY_CONFIRM_M,
  GEOLOCATION_TIMEOUT_MS,
} from "./geolocationAccuracy";
import { computeDeliveryQuote } from "../hooks/useDeliveryQuote";

// Malaspina 1602 (Zona 1, $1.000): coordenadas ya verificadas contra el motor real.
const EN_COBERTURA = { lat: -34.600409, lng: -58.64632975 };
// ~10 km al noroeste de la cobertura: lo que paso con la PC "10 km corrida".
const A_10_KM = { lat: -34.53, lng: -58.72 };

// navigator.geolocation falso: emite lecturas a mano.
function fakeGeolocation() {
  let onSuccess;
  let onError;
  return {
    watchPosition: vi.fn((success, error) => {
      onSuccess = success;
      onError = error;
      return 42;
    }),
    clearWatch: vi.fn(),
    emit(accuracy, { lat, lng } = EN_COBERTURA) {
      onSuccess({ coords: { latitude: lat, longitude: lng, accuracy } });
    },
    fail(code) {
      onError({ code });
    },
  };
}

let geo;
let onResult;
let onError;

const start = (options = {}) => startGeolocationSampling({ geolocation: geo, onResult, onError, ...options });

beforeEach(() => {
  vi.useFakeTimers();
  geo = fakeGeolocation();
  onResult = vi.fn();
  onError = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("classifyAccuracy: reglas iniciales", () => {
  it("<= 50 m es confiable", () => {
    expect(classifyAccuracy(5)).toBe("trusted");
    expect(classifyAccuracy(20)).toBe("trusted");
    expect(classifyAccuracy(50)).toBe("trusted");
  });

  it("entre 50 y 150 m hay que confirmar el pin", () => {
    expect(classifyAccuracy(50.1)).toBe("confirm");
    expect(classifyAccuracy(80)).toBe("confirm");
    expect(classifyAccuracy(150)).toBe("confirm");
  });

  it("mas de 150 m es demasiado imprecisa", () => {
    expect(classifyAccuracy(150.1)).toBe("poor");
    expect(classifyAccuracy(500)).toBe("poor");
    expect(classifyAccuracy(10_000)).toBe("poor");
  });

  it("sin dato de precision (undefined, NaN, negativa) no se confia", () => {
    for (const value of [undefined, null, NaN, -1]) expect(classifyAccuracy(value)).toBe("poor");
  });

  it("los umbrales son los pedidos", () => {
    expect(ACCURACY_TRUSTED_M).toBe(50);
    expect(ACCURACY_CONFIRM_M).toBe(150);
    expect(GEOLOCATION_TIMEOUT_MS).toBeGreaterThanOrEqual(8000);
    expect(GEOLOCATION_TIMEOUT_MS).toBeLessThanOrEqual(10_000);
  });
});

describe("decideGeolocation + cotizacion", () => {
  it("accuracy 20 m -> confiable: entrega una ubicacion y cotiza directamente", () => {
    const decision = decideGeolocation({ ...EN_COBERTURA, accuracy: 20 });
    expect(decision.level).toBe("trusted");
    expect(decision.location).toEqual({ ...EN_COBERTURA, source: "geolocation" });
    expect(computeDeliveryQuote(decision.location, "Delivery")).toMatchObject({ status: "covered", zoneLabel: "Zona 1", deliveryPrice: 1000 });
  });

  it("accuracy 80 m -> exige confirmar el pin: NO hay ubicacion ni cotizacion hasta que se confirme", () => {
    const decision = decideGeolocation({ ...EN_COBERTURA, accuracy: 80 });
    expect(decision.level).toBe("confirm");
    expect(decision.location).toBe(null);
    expect(computeDeliveryQuote(decision.location, "Delivery").status).toBe("idle");

    // recien al confirmarlo (o moverlo) el pin es la fuente de verdad y cotiza
    const confirmed = { ...decision.fix, source: "map" };
    expect(computeDeliveryQuote(confirmed, "Delivery").status).toBe("covered");
  });

  it("accuracy 500 m -> NUNCA dice 'fuera de cobertura', aunque las coordenadas caigan afuera", () => {
    const decision = decideGeolocation({ ...A_10_KM, accuracy: 500 });
    expect(decision.level).toBe("poor");
    expect(decision.location).toBe(null);
    // sin ubicacion decidida no hay cotizacion: ni cubierto ni "uncovered"
    const quote = computeDeliveryQuote(decision.location, "Delivery");
    expect(quote.status).toBe("idle");
    expect(quote.status).not.toBe("uncovered");
    // el mapa igual se centra ahi: el fix queda disponible
    expect(decision.fix).toEqual({ ...A_10_KM, accuracy: 500 });
  });

  it("PC ubicada 10 km mal con mala precision: no se decide delivery; con buena precision fuera de cobertura si es 'no llegamos'", () => {
    expect(decideGeolocation({ ...A_10_KM, accuracy: 3000 }).location).toBe(null);
    const good = decideGeolocation({ ...A_10_KM, accuracy: 15 });
    expect(computeDeliveryQuote(good.location, "Delivery").status).toBe("uncovered");
  });
});

describe("startGeolocationSampling", () => {
  it("pide alta precision y un timeout razonable", () => {
    start();
    const options = geo.watchPosition.mock.calls[0][2];
    expect(options.enableHighAccuracy).toBe(true);
    expect(options.maximumAge).toBe(0);
    expect(options.timeout).toBe(GEOLOCATION_TIMEOUT_MS);
    expect(options.timeout).toBeLessThanOrEqual(10_000);
  });

  it("accuracy 20 m: corta enseguida con esa lectura y deja de escuchar", () => {
    start();
    geo.emit(20);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ ...EN_COBERTURA, accuracy: 20 });
    expect(geo.clearWatch).toHaveBeenCalledWith(42);
    expect(onError).not.toHaveBeenCalled();
  });

  it("accuracy 80 m: NO corta, espera por si mejora; al vencer el tiempo entrega esa lectura", () => {
    start();
    geo.emit(80);
    expect(onResult).not.toHaveBeenCalled();
    vi.advanceTimersByTime(GEOLOCATION_TIMEOUT_MS - 1);
    expect(onResult).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0][0].accuracy).toBe(80);
    expect(geo.clearWatch).toHaveBeenCalledWith(42);
  });

  it("varias lecturas: se queda con la de MEJOR accuracy, no con la ultima", () => {
    start();
    geo.emit(500, { lat: -34.5, lng: -58.7 });
    geo.emit(120, { lat: -34.6, lng: -58.64 }); // la mejor
    geo.emit(300, { lat: -34.55, lng: -58.7 }); // llega despues pero es peor
    vi.advanceTimersByTime(GEOLOCATION_TIMEOUT_MS + 1);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0][0]).toEqual({ lat: -34.6, lng: -58.64, accuracy: 120 });
  });

  it("si mejora hasta ser confiable corta antes del timeout con esa lectura", () => {
    start();
    geo.emit(300);
    vi.advanceTimersByTime(3000);
    geo.emit(90);
    expect(onResult).not.toHaveBeenCalled();
    geo.emit(35, { lat: -34.6004, lng: -58.6463 });
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0][0].accuracy).toBe(35);

    // y ya no reacciona a lecturas posteriores ni al timeout
    geo.emit(10);
    vi.advanceTimersByTime(GEOLOCATION_TIMEOUT_MS * 2);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it("timeout con mala precision (500 m): entrega la lectura mala para ir al mapa/manual, no un error", () => {
    start();
    geo.emit(800);
    geo.emit(500);
    vi.advanceTimersByTime(GEOLOCATION_TIMEOUT_MS + 1);
    expect(onError).not.toHaveBeenCalled();
    const fix = onResult.mock.calls[0][0];
    expect(fix.accuracy).toBe(500);
    expect(decideGeolocation(fix)).toMatchObject({ level: "poor", location: null });
  });

  it("sin ninguna lectura al vencer el tiempo es un error de tiempo agotado", () => {
    start();
    vi.advanceTimersByTime(GEOLOCATION_TIMEOUT_MS + 1);
    expect(onResult).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith({ permissionDenied: false, timedOut: true });
  });

  it("permiso denegado corta enseguida con el motivo", () => {
    start();
    geo.fail(1);
    expect(onError).toHaveBeenCalledWith({ permissionDenied: true, timedOut: false });
    expect(geo.clearWatch).toHaveBeenCalledWith(42);
    vi.advanceTimersByTime(GEOLOCATION_TIMEOUT_MS * 2);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onResult).not.toHaveBeenCalled();
  });

  it("errores pasajeros (sin señal, timeout de una lectura) no cortan: se sigue esperando y puede llegar una lectura buena", () => {
    start();
    geo.fail(2);
    geo.fail(3);
    expect(onError).not.toHaveBeenCalled();
    geo.emit(25);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it("ignora lecturas sin coordenadas validas", () => {
    start();
    geo.emit(10, { lat: NaN, lng: NaN });
    expect(onResult).not.toHaveBeenCalled();
    vi.advanceTimersByTime(GEOLOCATION_TIMEOUT_MS + 1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("una lectura sin precision no le gana a una con precision", () => {
    start();
    geo.emit(200);
    // lectura sin accuracy (undefined)
    geo.emit(undefined, { lat: -1, lng: -1 });
    vi.advanceTimersByTime(GEOLOCATION_TIMEOUT_MS + 1);
    expect(onResult.mock.calls[0][0]).toEqual({ ...EN_COBERTURA, accuracy: 200 });
  });

  it("cancelar (cerrar el componente) no llama a ningun callback y deja de escuchar", () => {
    const stop = start();
    geo.emit(300);
    stop();
    expect(geo.clearWatch).toHaveBeenCalledWith(42);
    vi.advanceTimersByTime(GEOLOCATION_TIMEOUT_MS * 2);
    expect(onResult).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("si el navegador responde ANTES de devolver el id del watch, igual se detiene", () => {
    const syncGeo = {
      clearWatch: vi.fn(),
      watchPosition: vi.fn((success) => {
        success({ coords: { latitude: EN_COBERTURA.lat, longitude: EN_COBERTURA.lng, accuracy: 10 } });
        return 7;
      }),
    };
    startGeolocationSampling({ geolocation: syncGeo, onResult, onError });
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(syncGeo.clearWatch).toHaveBeenCalledWith(7);
  });
});
