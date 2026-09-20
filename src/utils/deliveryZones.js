// Motor de zonas de delivery. Fuente de verdad: src/data/deliveryZones.geojson
// (conversion directa del ultimo KMZ de Google My Maps de Burger Ya).
//
// Politica de precios (confirmada): el cliente paga el costo completo del
// envio. customerDeliveryFee === deliveryPrice, sin subsidio ni offset.
//
// Se importa como texto crudo (?raw) en vez de depender de que Vite
// reconozca la extension .geojson como JSON: ?raw esta garantizado para
// cualquier extension.
import rawGeoJSON from "../data/deliveryZones.geojson?raw";

const geojson = JSON.parse(rawGeoJSON);

const ZONES = geojson.features
  .filter((f) => f.properties.featureType === "delivery_zone")
  .map((f) => ({
    id: f.properties.id,
    name: f.properties.name,
    deliveryPrice: f.properties.deliveryPrice,
    // Cada "parte" es un array de anillos [ [lng,lat], ... ] (el primero es
    // el contorno exterior, los siguientes son huecos). Polygon -> una sola
    // parte. MultiPolygon (dos zonas del mismo precio que NO se tocan, ej.
    // Fase 3.5) -> una parte por cada pieza disjunta.
    parts:
      f.geometry.type === "MultiPolygon"
        ? f.geometry.coordinates
        : [f.geometry.coordinates],
  }));

// Ray-casting sobre UN anillo (regla even-odd, no depende del sentido de
// dibujado del anillo).
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// Even-odd combinado sobre TODOS los anillos de un poligono: cada anillo que
// contiene al punto invierte el resultado. Un contorno exterior + un hueco
// que tambien lo contiene se cancelan (el punto queda "afuera" del hueco),
// que es exactamente la semantica GeoJSON de poligono-con-huecos. Funciona
// sin necesidad de saber cual anillo es "el" exterior.
function pointInPolygonRings(lng, lat, rings) {
  let inside = false;
  for (const ring of rings) {
    if (pointInRing(lng, lat, ring)) inside = !inside;
  }
  return inside;
}

// Un punto esta "en" una zona si cae dentro de CUALQUIERA de sus partes
// (siempre una sola parte, salvo MultiPolygon).
function pointInZone(lng, lat, zone) {
  return zone.parts.some((rings) => pointInPolygonRings(lng, lat, rings));
}

/**
 * Resuelve la zona de delivery para una coordenada.
 *
 * Si el punto cae dentro de mas de un poligono (solapamientos de bordes
 * dibujados a mano), gana la tarifa mas baja — nunca "el ultimo que matchea".
 *
 * No aplica ninguna heuristica de "zona mas cercana" para puntos que no
 * caen en ningun poligono: eso queda para una fase posterior, revisada
 * explicitamente antes de tocar geometria.
 */
export function getDeliveryZone(lat, lng) {
  const matches = ZONES.filter((z) => pointInZone(lng, lat, z));

  if (matches.length === 0) {
    return { covered: false, zoneId: null, deliveryPrice: null };
  }

  const cheapest = matches.reduce((min, z) =>
    z.deliveryPrice < min.deliveryPrice ? z : min,
  );

  return {
    covered: true,
    zoneId: cheapest.id,
    deliveryPrice: cheapest.deliveryPrice,
    // Info de diagnostico: todas las zonas que matchearon, no solo la ganadora.
    matches: matches.map((z) => ({ zoneId: z.id, deliveryPrice: z.deliveryPrice })),
  };
}

export function listDeliveryZones() {
  return ZONES.map(({ id, name, deliveryPrice }) => ({ id, name, deliveryPrice }));
}
