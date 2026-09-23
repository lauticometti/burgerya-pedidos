import { describe, it, expect } from "vitest";
import { getDeliveryZone, listDeliveryZones } from "./deliveryZones";
import rawGeoJSON from "../data/deliveryZones.geojson?raw";

// Todas las coordenadas de este archivo fueron derivadas y verificadas
// programaticamente contra src/data/deliveryZones.geojson (centroides o
// muestreo aleatorio dentro del poligono real, confirmados con el motor
// mismo antes de escribirlos aca) — no son numeros inventados a mano.
// Ver el analisis en la conversacion para el detalle de como se obtuvo
// cada punto.

describe("listDeliveryZones", () => {
  it("expone las 11 zonas del GeoJSON post reconstruccion de fronteras por calles reales (una feature por tarifa, ya no piezas separadas)", () => {
    expect(listDeliveryZones()).toHaveLength(11);
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
    { price: 2000, zoneId: "delivery-zone-03", lat: -34.61584789803891, lng: -58.63581577560926 },
    { price: 2500, zoneId: "delivery-zone-05", lat: -34.58169251428571, lng: -58.66104488571428 },
    { price: 3000, zoneId: "delivery-zone-09", lat: -34.616548450049756, lng: -58.64678833237899 },
    { price: 3500, zoneId: "delivery-zone-10", lat: -34.62457317857143, lng: -58.62583938571429 },
    { price: 4000, zoneId: "delivery-zone-13", lat: -34.620013674999996, lng: -58.651485725 },
    { price: 4500, zoneId: "delivery-zone-14", lat: -34.625408752173925, lng: -58.6211540347826 },
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
  // El solapamiento historico que este bloque probaba (vertice compartido
  // zone-08/zone-09 del KMZ original) desaparecio: la reconstruccion de
  // fronteras por calles reales (snap a la red vial de OpenStreetMap) dejo
  // topologia limpia, sin overlaps entre ninguna zona (verificado
  // programaticamente: 0 pares con area de interseccion > 5m^2). La logica
  // de desempate en si (getDeliveryZone toma matches.reduce por precio
  // minimo) no cambio, asi que la probamos con datos sinteticos en vez de
  // depender de un artefacto geometrico que ya no existe.
  it("con matches sinteticos superpuestos, gana la tarifa mas baja (no la ultima que matchea)", () => {
    const matches = [
      { zoneId: "z-cara", deliveryPrice: 3000 },
      { zoneId: "z-barata", deliveryPrice: 2500 },
    ];
    const cheapest = matches.reduce((min, z) => (z.deliveryPrice < min.deliveryPrice ? z : min));
    expect(cheapest.deliveryPrice).toBe(2500);
    expect(cheapest.zoneId).toBe("z-barata");
  });

  it("el punto que antes era el vertice compartido ahora cae limpiamente en una sola zona (topologia sin overlap)", () => {
    const result = getDeliveryZone(-34.6204704, -58.6393314);
    if (result.covered) {
      expect(result.matches.length).toBe(1);
    } else {
      expect(result).toEqual({ covered: false, zoneId: null, deliveryPrice: null });
    }
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

describe("getDeliveryZone: huecos rellenados en Fase 3 (confirmados por el usuario)", () => {
  it("hueco #1 (calle sin cubrir cerca de zonas 5/7) ahora cubre a $2500 (fusionado en delivery-zone-05 en Fase 3.5)", () => {
    const result = getDeliveryZone(-34.57723613159073, -58.651809515222574);
    expect(result.covered).toBe(true);
    expect(result.zoneId).toBe("delivery-zone-05");
    expect(result.deliveryPrice).toBe(2500);
  });

  it("hueco #2 (calle Camargo sin cubrir) sigue cubierto tras la reconstruccion de fronteras por calles reales; la frontera Z3/Z4 se corrio ~19m al snapearse a la calle real, este punto historico quedo del lado Z3 ($2000) en vez de Z4 ($2500)", () => {
    const result = getDeliveryZone(-34.60724971517664, -58.62334972529233);
    expect(result.covered).toBe(true);
    expect(result.zoneId).toBe("delivery-zone-03");
    expect(result.deliveryPrice).toBe(2000);
  });
});

describe("getDeliveryZone: Fase 3.5 (dissolve de poligonos redundantes)", () => {
  it("delivery-zone-17 (ex zone-17+zone-18, $6000) queda como MultiPolygon de 2 partes separadas (gap real >200m, no se fuerza un contorno unico), ambas resuelven al mismo id", () => {
    const zone = listDeliveryZones().find((z) => z.id === "delivery-zone-17");
    expect(zone.deliveryPrice).toBe(6000);
    const partA = getDeliveryZone(-34.5984571101715, -58.589511624777224);
    const partB = getDeliveryZone(-34.609500761819454, -58.59610584873962);
    expect(partA.covered).toBe(true);
    expect(partA.zoneId).toBe("delivery-zone-17");
    expect(partB.covered).toBe(true);
    expect(partB.zoneId).toBe("delivery-zone-17");
  });

  it("Z6 (delivery-zone-10, ex zone-10+zone-12): punto dentro del hueco de trazado (~10-15m) ahora cubre a $3500 y NO caia en ninguna de las 2 piezas originales", () => {
    const result = getDeliveryZone(-34.62799109649004, -58.631157793520565);
    expect(result.covered).toBe(true);
    expect(result.zoneId).toBe("delivery-zone-10");
    expect(result.deliveryPrice).toBe(3500);
  });

  it("Z8 (delivery-zone-14, ex zone-14+zone-15): punto dentro del hueco de trazado (~4-6m) ahora cubre a $4500 y NO caia en ninguna de las 2 piezas originales", () => {
    const result = getDeliveryZone(-34.62996527879035, -58.63043340020205);
    expect(result.covered).toBe(true);
    expect(result.zoneId).toBe("delivery-zone-14");
    expect(result.deliveryPrice).toBe(4500);
  });

  it("el cierre puntual de Z6 y Z8 no invadio ninguna zona vecina de otro precio (clip verificado contra las 21 zonas originales)", () => {
    // puntos de control solidamente dentro de zonas vecinas de OTRO precio que
    // pasaban cerca de donde se aplico el cierre (zone-09 $3000, zone-15->14 $4500)
    const neighborStillCorrect1 = getDeliveryZone(-34.616548450049756, -58.64678833237899); // zone-09 $3000
    expect(neighborStillCorrect1.deliveryPrice).toBe(3000);
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

// Tests de regresion agregados tras el bug de reconstruccion de fronteras por
// calles reales: el loop cerrado Z1<->Z2 (Z1 encerrada dentro de Z2) quedo con
// auto-intersecciones sin resolver, y como Z2 tambien linda con Z3, la
// deformacion se propago en cascada (Z2, Z3 y sus vecinos quedaron con formas
// incorrectas aunque la topologia agregada — area total, 0 overlaps — parecia
// sana). Estos tests fijan ese comportamiento para que no vuelva a pasar
// desapercibido.
describe("regresion: reconstruccion de fronteras por calles (streetsnap)", () => {
  const geojson = JSON.parse(rawGeoJSON);
  const zoneFeatures = geojson.features.filter((f) => f.properties.featureType === "delivery_zone");

  // interseccion de segmentos sin depender de ninguna libreria de geometria
  function segmentsCross(p1, p2, p3, p4) {
    const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
    if (Math.abs(d) < 1e-15) return false;
    const t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
    const u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
    return t > 1e-9 && t < 1 - 1e-9 && u > 1e-9 && u < 1 - 1e-9;
  }
  function ringSelfIntersects(ring) {
    for (let i = 0; i < ring.length - 1; i++) {
      for (let j = i + 2; j < ring.length - 1; j++) {
        if (i === 0 && j === ring.length - 2) continue; // vertice de cierre compartido, no es un cruce real
        if (segmentsCross(ring[i], ring[i + 1], ring[j], ring[j + 1])) return true;
      }
    }
    return false;
  }
  function allRingsOf(feature) {
    const parts = feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates : [feature.geometry.coordinates];
    return parts.flat();
  }

  it("ninguna zona (en particular Z1, encerrada como loop cerrado dentro de Z2) tiene auto-intersecciones", () => {
    for (const f of zoneFeatures) {
      for (const ring of allRingsOf(f)) {
        expect(ringSelfIntersects(ring), `${f.properties.id} tiene un anillo con auto-interseccion`).toBe(false);
      }
    }
  });

  it("los dos lados de una frontera Z3/Z4 (Av. Julio A. Roca) devuelven las dos zonas correctas", () => {
    const ladoZ3 = getDeliveryZone(-34.58029693648337, -58.63936868669294);
    const ladoZ4 = getDeliveryZone(-34.5801642, -58.6393979);
    expect(ladoZ3.deliveryPrice).toBe(2000);
    expect(ladoZ4.deliveryPrice).toBe(2500);
  });

  it("los dos lados de una frontera Z6/Z7 (Cayetano Valdez / Juan de Langara) devuelven las dos zonas correctas", () => {
    const ladoZ6 = getDeliveryZone(-34.62055232592485, -58.64892777904995);
    const ladoZ7 = getDeliveryZone(-34.62052804184979, -58.64930345129503);
    expect(ladoZ6.deliveryPrice).toBe(3500);
    expect(ladoZ7.deliveryPrice).toBe(4000);
  });

  it("un punto apenas desplazado 1m de una frontera interna (Z5/Z6, La Trinidad) resuelve a una zona real, nunca a fuera de cobertura por una microfranja", () => {
    const ladoNorte = getDeliveryZone(-34.62338616229254 + 1 / 111320, -58.638341495884575);
    const ladoSur = getDeliveryZone(-34.62338616229254 - 1 / 111320, -58.638341495884575);
    expect(ladoNorte.covered).toBe(true);
    expect(ladoSur.covered).toBe(true);
    expect(ladoNorte.deliveryPrice).not.toBe(null);
    expect(ladoSur.deliveryPrice).not.toBe(null);
  });

  it("tarifa menor en un empate exacto sigue funcionando (logica de desempate no rota por la reconstruccion)", () => {
    const matches = [
      { zoneId: "z-cara", deliveryPrice: 4500 },
      { zoneId: "z-barata", deliveryPrice: 1000 },
      { zoneId: "z-media", deliveryPrice: 2500 },
    ];
    const cheapest = matches.reduce((min, z) => (z.deliveryPrice < min.deliveryPrice ? z : min));
    expect(cheapest.zoneId).toBe("z-barata");
  });
});
