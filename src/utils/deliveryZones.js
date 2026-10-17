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

function zonesAt(lat, lng) {
  return ZONES.filter((z) => pointInZone(lng, lat, z));
}

function cheapestOf(zones) {
  return zones.reduce((min, z) => (z.deliveryPrice < min.deliveryPrice ? z : min));
}

// --- Costuras internas entre zonas -------------------------------------------
// La reconstruccion de fronteras por calles dejo franjas finas SIN zona entre
// dos zonas vecinas (ej. sobre Av. Gdor. Vergara, entre Z4 y Z5: 10-30 m de
// ancho). Son errores de trazado, no exclusiones: un barrido de toda la
// cobertura encontro ~290 franjas asi, todas de menos de 50 m de ancho.
//
// Regla: un punto sin zona que tiene zona cubierta en DOS direcciones opuestas
// a <= SEAM_MAX_M cada una esta dentro de una costura interna, y se cotiza con
// la tarifa mas baja de las zonas que lo rodean (misma politica que un
// solapamiento). Como exige zona a ambos lados, NO agranda el borde exterior de
// la cobertura ni tapa exclusiones reales anchas (el cementerio, ~550 m).
// 25 m es el minimo que cierra el 100% de las costuras del barrido.
export const SEAM_MAX_M = 25;
const SEAM_STEP_M = 5;
const METERS_PER_DEG_LAT = 111320;
// 8 direcciones; la i y la i+4 son opuestas.
const SEAM_DIRECTIONS = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
].map(([x, y]) => [x / Math.hypot(x, y), y / Math.hypot(x, y)]);

function firstZoneAlong(lat, lng, [dx, dy]) {
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
  for (let d = SEAM_STEP_M; d <= SEAM_MAX_M; d += SEAM_STEP_M) {
    const found = zonesAt(lat + (dy * d) / METERS_PER_DEG_LAT, lng + (dx * d) / metersPerDegLng);
    if (found.length) return cheapestOf(found);
  }
  return null;
}

function seamZone(lat, lng) {
  const hits = SEAM_DIRECTIONS.map((dir) => firstZoneAlong(lat, lng, dir));
  const enclosed = [0, 1, 2, 3].some((i) => hits[i] && hits[i + 4]);
  return enclosed ? cheapestOf(hits.filter(Boolean)) : null;
}

// --- Borde exterior: calles que sobresalen un poco del contorno dibujado ---
// El KMZ se trazo a mano sobre el borde visible de la cobertura (limite de un
// campo/club, una via, etc.), y en varios puntos de Hurlingham ese trazo
// corta la ultima cuadra de alguna calle real antes de su final (caso
// reportado: calles cerca de Morris Club, ej. Poeta Risso, que siguen un
// poco mas alla del borde dibujado). Esto NO es una costura entre dos zonas
// (ver SEAM_MAX_M arriba): es directamente afuera de toda zona, un solo lado
// cubierto. Un punto sin zona a <= OUTER_EDGE_BUFFER_M del borde de alguna
// zona se cotiza con la tarifa de la zona mas barata entre las que esten a
// esa distancia (`extended: true`). 100 m deja margen de sobra (~120 m)
// antes de tocar la exclusion real mas cercana (el cementerio, a ~220 m del
// borde mas proximo) y alcanza para una cuadra tipica de la zona.
export const OUTER_EDGE_BUFFER_M = 100;

function distancePointToSegmentM(lat, lng, [ax, ay], [bx, by]) {
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
  const px = lng * metersPerDegLng, py = lat * METERS_PER_DEG_LAT;
  const axm = ax * metersPerDegLng, aym = ay * METERS_PER_DEG_LAT;
  const bxm = bx * metersPerDegLng, bym = by * METERS_PER_DEG_LAT;
  const dx = bxm - axm, dy = bym - aym;
  if (dx === 0 && dy === 0) return Math.hypot(px - axm, py - aym);
  const t = Math.max(0, Math.min(1, ((px - axm) * dx + (py - aym) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (axm + t * dx), py - (aym + t * dy));
}

function distanceToZoneM(lat, lng, zone) {
  let min = Infinity;
  for (const rings of zone.parts) {
    for (const ring of rings) {
      for (let i = 1; i < ring.length; i++) {
        const d = distancePointToSegmentM(lat, lng, ring[i - 1], ring[i]);
        if (d < min) min = d;
      }
    }
  }
  return min;
}

function nearestZoneWithinBuffer(lat, lng) {
  const near = ZONES.map((z) => ({ zone: z, distM: distanceToZoneM(lat, lng, z) })).filter(
    (hit) => hit.distM <= OUTER_EDGE_BUFFER_M,
  );
  if (near.length === 0) return null;
  return cheapestOf(near.map((hit) => hit.zone));
}

/**
 * Resuelve la zona de delivery para una coordenada.
 *
 * Si el punto cae dentro de mas de un poligono (solapamientos de bordes
 * dibujados a mano), gana la tarifa mas baja — nunca "el ultimo que matchea".
 *
 * Si no cae en ningun poligono pero esta en una costura interna entre zonas
 * (ver SEAM_MAX_M), se cotiza con la zona mas barata que la rodea
 * (`seam: true`). Si tampoco es una costura pero esta cerca del borde
 * exterior de alguna zona (ver OUTER_EDGE_BUFFER_M), se cotiza con esa zona
 * (`extended: true`). Mas alla de eso no hay "zona mas cercana": un punto
 * afuera de la cobertura es uncovered.
 */
export function getDeliveryZone(lat, lng) {
  const matches = zonesAt(lat, lng);

  if (matches.length === 0) {
    const seam = seamZone(lat, lng);
    if (seam) {
      return {
        covered: true,
        zoneId: seam.id,
        deliveryPrice: seam.deliveryPrice,
        matches: [],
        seam: true,
      };
    }
    const extended = nearestZoneWithinBuffer(lat, lng);
    if (extended) {
      return {
        covered: true,
        zoneId: extended.id,
        deliveryPrice: extended.deliveryPrice,
        matches: [],
        extended: true,
      };
    }
    return { covered: false, zoneId: null, deliveryPrice: null };
  }

  const cheapest = cheapestOf(matches);

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

/**
 * Caja delimitadora (lat/lng min y max) de TODAS las zonas de cobertura.
 * Sirve para centrar el mapa (fitBounds) sin hardcodear un barrio a mano.
 */
export function getCoverageBounds() {
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  for (const zone of ZONES) {
    for (const rings of zone.parts) {
      for (const ring of rings) {
        for (const [lng, lat] of ring) {
          if (lat > north) north = lat;
          if (lat < south) south = lat;
          if (lng > east) east = lng;
          if (lng < west) west = lng;
        }
      }
    }
  }

  return { north, south, east, west };
}
