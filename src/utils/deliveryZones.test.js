import { describe, it, expect } from "vitest";
import { getDeliveryZone, listDeliveryZones } from "./deliveryZones";

// Todas las coordenadas de este archivo fueron derivadas y verificadas
// programaticamente contra src/data/deliveryZones.geojson (centroides o
// muestreo aleatorio dentro del poligono real, confirmados con el motor
// mismo antes de escribirlos aca) — no son numeros inventados a mano.
// Ver el analisis en la conversacion para el detalle de como se obtuvo
// cada punto.

describe("listDeliveryZones", () => {
  it("expone las 19 zonas del GeoJSON", () => {
    expect(listDeliveryZones()).toHaveLength(19);
  });

  it("no inventa tarifas: solo las 10 que existen en el archivo", () => {
    const prices = new Set(listDeliveryZones().map((z) => z.deliveryPrice));
    expect([...prices].sort((a, b) => a - b)).toEqual([
      1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 6000, 7000,
    ]);
  });
});

describe("getDeliveryZone: un punto limpio por cada tarifa", () => {
  const cases = [
    { price: 1000, zoneId: "delivery-zone-01", lat: -34.60181774705883, lng: -58.64558098823529 },
    { price: 1500, zoneId: "delivery-zone-02", lat: -34.60904995421206, lng: -58.638436680948566 },
    { price: 2000, zoneId: "delivery-zone-04", lat: -34.61584789803891, lng: -58.63581577560926 },
    { price: 2500, zoneId: "delivery-zone-05", lat: -34.58169251428571, lng: -58.66104488571428 },
    { price: 3000, zoneId: "delivery-zone-09", lat: -34.616548450049756, lng: -58.64678833237899 },
    { price: 3500, zoneId: "delivery-zone-10", lat: -34.62457317857143, lng: -58.62583938571429 },
    { price: 4000, zoneId: "delivery-zone-13", lat: -34.620013674999996, lng: -58.651485725 },
    { price: 4500, zoneId: "delivery-zone-15", lat: -34.625408752173925, lng: -58.6211540347826 },
    { price: 6000, zoneId: "delivery-zone-16", lat: -34.58314165263158, lng: -58.615104557894746 },
    { price: 7000, zoneId: "delivery-zone-19", lat: -34.579174720000005, lng: -58.60830494 },
  ];

  for (const c of cases) {
    it(`$${c.price} en ${c.zoneId}`, () => {
      const result = getDeliveryZone(c.lat, c.lng);
      expect(result.covered).toBe(true);
      expect(result.zoneId).toBe(c.zoneId);
      expect(result.deliveryPrice).toBe(c.price);
    });
  }
});

describe("getDeliveryZone: solapamientos, gana la tarifa mas baja", () => {
  it("un vertice compartido entre zone-08 ($2500) y zone-09 ($3000) devuelve $2500", () => {
    const result = getDeliveryZone(-34.6204704, -58.6393314);
    expect(result.covered).toBe(true);
    expect(result.matches.length).toBeGreaterThan(1);
    expect(result.deliveryPrice).toBe(2500);
    expect(result.zoneId).toBe("delivery-zone-08");
  });

  it("nunca elige la mas cara entre las que matchean", () => {
    const result = getDeliveryZone(-34.6204704, -58.6393314);
    const prices = result.matches.map((m) => m.deliveryPrice);
    expect(result.deliveryPrice).toBe(Math.min(...prices));
  });
});

describe("getDeliveryZone: huecos respetados (poligono con huecos)", () => {
  it("Zona 1 ($1000), que geometricamente vive dentro de un hueco de Zona 2, no cuenta tambien como Zona 2", () => {
    const result = getDeliveryZone(-34.60181774705883, -58.64558098823529);
    expect(result.covered).toBe(true);
    expect(result.zoneId).toBe("delivery-zone-01");
    expect(result.matches).toEqual([{ zoneId: "delivery-zone-01", deliveryPrice: 1000 }]);
  });
});

describe("getDeliveryZone: fuera de cobertura", () => {
  it("un punto claramente al oeste de todas las zonas (direccion Leloir) da uncovered", () => {
    const result = getDeliveryZone(-34.6489, -58.6564);
    expect(result).toEqual({ covered: false, zoneId: null, deliveryPrice: null });
  });

  it("un punto muy lejano (margen de seguridad) tambien da uncovered", () => {
    const result = getDeliveryZone(-34.6, -58.75);
    expect(result).toEqual({ covered: false, zoneId: null, deliveryPrice: null });
  });
});
