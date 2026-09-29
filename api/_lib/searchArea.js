// SESGO de la busqueda de direcciones (Google Places): un circulo centrado en
// la cobertura de reparto (W -58.674, S -34.632, E -58.576, N -34.568) con ~2 km
// de margen sobre las esquinas, para que Hurlingham / William C. Morris /
// Villa Tesei / El Palomar / Podesta y alrededores salgan primero. Es un SESGO,
// no una restriccion: una direccion apenas afuera de la cobertura igualmente
// aparece y se puede elegir; despues getDeliveryZone decide si llegamos.
// "Google no encuentra la direccion" y "Burger Ya no llega" son cosas
// distintas y no se mezclan. Si cambian las zonas, mantenerlo sincronizado (hay
// un test que verifica que el circulo contenga toda la cobertura).
export const SEARCH_BIAS = {
  center: { latitude: -34.6003, longitude: -58.625 },
  radiusMeters: 8000,
};

// Caja (minLng,minLat,maxLng,maxLat): cobertura + ~5 km de margen. NO se usa
// para la busqueda de direcciones. Solo acota el geocodificado inverso (pin ->
// calle/numero): un pin fuera de esta caja no tiene reparto posible y no vale
// una consulta facturable. Tambien la usa el proveedor Mapbox estacionado.
export const SEARCH_BBOX = "-58.7240,-34.6824,-58.5261,-34.5183";

const [MIN_LNG, MIN_LAT, MAX_LNG, MAX_LAT] = SEARCH_BBOX.split(",").map(Number);

export function isInsideSearchArea(lat, lng) {
  return lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG;
}
