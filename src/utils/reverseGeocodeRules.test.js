import { describe, it, expect } from "vitest";
import {
  needsReverseGeocode,
  locationKey,
  addressLacksNumber,
  needsHouseNumber,
  isSamePoint,
  keepsPlacesAddress,
  distanceMeters,
  PLACES_KEEP_RADIUS_M,
} from "./reverseGeocodeRules";

describe("ubicaciones en movimiento (arrastrando el pin)", () => {
  it("una ubicacion `moving` nunca pide la direccion, sea del mapa o de la ubicacion actual", () => {
    expect(needsReverseGeocode({ lat: -34.6, lng: -58.6, source: "map", moving: true })).toBe(false);
    expect(needsReverseGeocode({ lat: -34.6, lng: -58.6, source: "geolocation", moving: true })).toBe(false);
  });

  it("confirmada (sin moving o moving:false) si la pide", () => {
    expect(needsReverseGeocode({ lat: -34.6, lng: -58.6, source: "map" })).toBe(true);
    expect(needsReverseGeocode({ lat: -34.6, lng: -58.6, source: "map", moving: false })).toBe(true);
  });
});

describe("isSamePoint", () => {
  const a = { lat: -34.602288, lng: -58.64289, source: "map" };

  it("mismo punto a menos de ~1 m, aunque cambie la fuente", () => {
    expect(isSamePoint(a, { ...a, lat: -34.6022881 })).toBe(true);
    expect(isSamePoint(a, { ...a, source: "geolocation" })).toBe(true);
  });

  it("puntos distintos, sin ubicacion, de la busqueda o en movimiento no son el mismo punto", () => {
    expect(isSamePoint(a, { ...a, lat: -34.6023 })).toBe(false);
    expect(isSamePoint(a, null)).toBe(false);
    expect(isSamePoint(null, null)).toBe(false);
    expect(isSamePoint(a, { ...a, source: "search" })).toBe(false);
    expect(isSamePoint(a, { ...a, moving: true })).toBe(false);
  });
});

describe("needsHouseNumber", () => {
  it("una calle con numero en el nombre ('Calle 5') pide la altura si es la calle sin altura que devolvio el servidor", () => {
    expect(needsHouseNumber("Calle 5", "Calle 5")).toBe(true);
    expect(needsHouseNumber("25 de Mayo", "25 de Mayo")).toBe(true);
  });

  it("apenas el cliente agrega la altura, el aviso desaparece", () => {
    expect(needsHouseNumber("Calle 5 1234", "Calle 5")).toBe(false);
    expect(needsHouseNumber("Calle 5, 1234", "Calle 5")).toBe(false);
  });

  it("sin calle-sin-altura del servidor solo cuenta la regla de los digitos", () => {
    expect(needsHouseNumber("Calle 5", null)).toBe(false);
    expect(needsHouseNumber("Malaspina", null)).toBe(true);
    expect(needsHouseNumber("Beethoven 1202, Hurlingham", null)).toBe(false);
    expect(needsHouseNumber("", "Calle 5")).toBe(false);
  });
});

describe("addressLacksNumber", () => {
  it("una calle sin altura pide el numero", () => {
    expect(addressLacksNumber("Malaspina")).toBe(true);
    expect(addressLacksNumber("  Paso Morales  ")).toBe(true);
  });

  it("con altura no lo pide, ni con el numero en cualquier parte", () => {
    expect(addressLacksNumber("Beethoven 1202, Hurlingham")).toBe(false);
    expect(addressLacksNumber("Malaspina 1602")).toBe(false);
    expect(addressLacksNumber("Calle 5")).toBe(false);
  });

  it("vacio o nulo no muestra el aviso (todavia no hay direccion)", () => {
    expect(addressLacksNumber("")).toBe(false);
    expect(addressLacksNumber("   ")).toBe(false);
    expect(addressLacksNumber(null)).toBe(false);
    expect(addressLacksNumber(undefined)).toBe(false);
  });
});

describe("needsReverseGeocode", () => {
  it("pide la direccion para un pin del mapa y para la ubicacion actual", () => {
    expect(needsReverseGeocode({ lat: -34.6, lng: -58.6, source: "map" })).toBe(true);
    expect(needsReverseGeocode({ lat: -34.6, lng: -58.6, source: "geolocation" })).toBe(true);
  });

  it("NO la pide si la ubicacion viene de la busqueda (ya trae la direccion elegida)", () => {
    expect(needsReverseGeocode({ lat: -34.6, lng: -58.6, source: "search" })).toBe(false);
  });

  it("NO la pide sin ubicacion, con coordenadas invalidas o con una fuente desconocida", () => {
    expect(needsReverseGeocode(null)).toBe(false);
    expect(needsReverseGeocode({ lat: NaN, lng: -58.6, source: "map" })).toBe(false);
    expect(needsReverseGeocode({ lat: -34.6, lng: undefined, source: "map" })).toBe(false);
    expect(needsReverseGeocode({ lat: -34.6, lng: -58.6, source: "otra" })).toBe(false);
  });
});

describe("locationKey", () => {
  it("dos pines a menos de ~1 m dan la misma clave (no repiten la consulta)", () => {
    const a = locationKey({ lat: -34.602288, lng: -58.64289 });
    const b = locationKey({ lat: -34.6022881, lng: -58.6428899 });
    expect(a).toBe(b);
  });

  it("pines a mas de ~10 m dan claves distintas", () => {
    const a = locationKey({ lat: -34.602288, lng: -58.64289 });
    const b = locationKey({ lat: -34.6023, lng: -58.64289 });
    expect(a).not.toBe(b);
  });
});

describe("keepsPlacesAddress: la direccion elegida en Places es la principal", () => {
  const anchor = { lat: -34.5901, lng: -58.6399, text: "Beethoven 1234, Hurlingham" };
  // ~11 m al norte / ~111 m al norte
  const nudge = { lat: -34.5900, lng: -58.6399, source: "map" };
  const far = { lat: -34.5891, lng: -58.6399, source: "map" };

  it("retocar el pin unos metros conserva el texto de Places (no se pide reverse: podria dar la casa vecina)", () => {
    expect(distanceMeters(anchor, nudge)).toBeLessThan(PLACES_KEEP_RADIUS_M);
    expect(keepsPlacesAddress(anchor, nudge, "Beethoven 1234, Hurlingham")).toBe(true);
  });

  it("mover el pin lejos es elegir otro lugar: se pide la direccion del pin nuevo", () => {
    expect(keepsPlacesAddress(anchor, far, "Beethoven 1234, Hurlingham")).toBe(false);
  });

  it("si el cliente edito el texto, ya no aplica", () => {
    expect(keepsPlacesAddress(anchor, nudge, "Beethoven 1236, Hurlingham")).toBe(false);
    expect(keepsPlacesAddress(anchor, nudge, "")).toBe(false);
  });

  it("mientras se arrastra (moving) no decide nada, y sin seleccion de Places tampoco", () => {
    expect(keepsPlacesAddress(anchor, { ...nudge, moving: true }, "Beethoven 1234, Hurlingham")).toBe(false);
    expect(keepsPlacesAddress(null, nudge, "Beethoven 1234, Hurlingham")).toBe(false);
  });

  it("la ubicacion de Places nunca dispara reverse geocoding", () => {
    expect(needsReverseGeocode({ lat: anchor.lat, lng: anchor.lng, source: "search" })).toBe(false);
  });
});
