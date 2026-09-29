// Wrapper minimo para Mapbox Search Box API (/suggest y /retrieve). Sin
// reintentos: si Mapbox devuelve 429 u otro error se propaga tal cual para
// que el endpoint lo traduzca a una respuesta segura — nunca reintentamos en
// loop contra la cuota.
//
// El token se lee en cada llamada (no al cargar el modulo) para que un
// cambio de env var en dev se note sin reiniciar el proceso.
//
// PROVEEDOR ESTACIONADO: hoy la busqueda activa es Google (googleLocation.js).
// Este modulo queda para poder volver.

import { SEARCH_BBOX } from "./searchArea.js";

const SUGGEST_URL = "https://api.mapbox.com/search/searchbox/v1/suggest";
const RETRIEVE_URL_BASE = "https://api.mapbox.com/search/searchbox/v1/retrieve";
const REVERSE_URL = "https://api.mapbox.com/search/geocode/v6/reverse";

// Sesgo geografico (Mapbox usa lng,lat): Hurlingham / Villa Tesei / William
// C. Morris. Prioriza, no restringe.
const PROXIMITY = "-58.645,-34.611";

// Solo direcciones con altura. Un resultado tipo "calle" (sin numero) devuelve
// UN unico punto para toda la calle (medido: "Paso Morales, Hurlingham" da
// -34.576102,-58.64784, cerca del borde norte de la cobertura), que puede
// caer en otra zona de reparto que la casa real y dar un precio de envio
// equivocado. Si Mapbox no tiene ese domicilio devuelve cero y la UI lo
// avisa; el cliente puede marcarlo en el mapa.
const SEARCH_TYPES = "address";

function getToken() {
  return process.env.MAPBOX_SEARCH_TOKEN;
}

export function isConfigured() {
  return Boolean(getToken());
}

export class MapboxSearchError extends Error {
  constructor(status, body) {
    super(`Mapbox Search error ${status}`);
    this.status = status;
    this.body = body;
  }
}

function suggestionText(s) {
  if (s.full_address) return s.full_address;
  return [s.name, s.place_formatted].filter(Boolean).join(", ");
}

/**
 * Sugerencias de direcciones. `sessionToken` es el mismo UUID que el cliente
 * reusa durante toda una busqueda (y en el retrieve() final): asi Mapbox
 * factura la sesion de busqueda una sola vez.
 */
export async function suggest(query, sessionToken) {
  const token = getToken();
  if (!token) throw new Error("MAPBOX_SEARCH_TOKEN no configurado");

  const params = new URLSearchParams({
    q: query,
    session_token: sessionToken,
    access_token: token,
    language: "es",
    country: "ar",
    proximity: PROXIMITY,
    bbox: SEARCH_BBOX,
    types: SEARCH_TYPES,
    limit: "5",
  });

  const res = await fetch(`${SUGGEST_URL}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MapboxSearchError(res.status, body);
  }

  const data = await res.json();
  return (data.suggestions || [])
    .filter((s) => s.mapbox_id)
    .map((s) => ({ id: s.mapbox_id, text: suggestionText(s) }));
}

// Distancia maxima (m) entre el pin y una direccion con altura para darla por
// buena. Medido en la zona: pidiendo "address,street" juntos Mapbox devolvia
// la calle (sin numero) cada vez que el eje de la calle quedaba mas cerca del
// pin que cualquier casa, o sea casi siempre que se tocaba sobre la calle. Por
// eso se piden las direcciones solas y se acepta la mas cercana si esta a
// esta distancia; mas lejos ya suele ser otra cuadra u otra calle.
export const MAX_ADDRESS_DISTANCE_M = 50;
const NEAREST_ADDRESS_CANDIDATES = "5";

function distanceMeters(lat1, lng1, lat2, lng2) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

async function reverseRequest(lat, lng, types, limit) {
  const params = new URLSearchParams({
    longitude: String(lng),
    latitude: String(lat),
    language: "es",
    country: "ar",
    types,
    limit,
    access_token: getToken(),
  });
  const res = await fetch(`${REVERSE_URL}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MapboxSearchError(res.status, body);
  }
  const data = await res.json();
  return data.features || [];
}

/**
 * Direccion legible de un pin (geocodificacion inversa, Geocoding v6).
 * Devuelve la direccion CONOCIDA mas cercana a <= MAX_ADDRESS_DISTANCE_M (pin
 * en Beethoven 1234 -> "Beethoven 1202, Hurlingham", kind "address"); si no
 * hay ninguna tan cerca, solo el nombre de la calle sin numero (kind
 * "street") para que el cliente complete la altura. null si no hay nada. La UI
 * la muestra editable y el precio de envio sale del pin, nunca de este texto.
 * Hace una llamada, o dos si la primera no encontro una direccion cercana.
 */
export async function reverse(lat, lng) {
  if (!getToken()) throw new Error("MAPBOX_SEARCH_TOKEN no configurado");

  const addresses = await reverseRequest(lat, lng, "address", NEAREST_ADDRESS_CANDIDATES);
  let nearest = null;
  for (const feature of addresses) {
    const [featureLng, featureLat] = feature.geometry?.coordinates || [];
    if (!Number.isFinite(featureLat) || !Number.isFinite(featureLng)) continue;
    const meters = distanceMeters(lat, lng, featureLat, featureLng);
    if (!nearest || meters < nearest.meters) nearest = { feature, meters };
  }
  if (nearest && nearest.meters <= MAX_ADDRESS_DISTANCE_M) {
    // "Beethoven 1202, Hurlingham, Provincia de Buenos Aires, B1686, Argentina"
    // -> "Beethoven 1202, Hurlingham": calle + localidad, lo que necesita el repartidor.
    const props = nearest.feature.properties || {};
    const address = (props.full_address || props.name || "").split(", ").slice(0, 2).join(", ");
    if (address) return { address, kind: "address" };
  }

  const streets = await reverseRequest(lat, lng, "street", "1");
  const street = streets[0]?.properties;
  const streetName = (street?.name || street?.full_address || "").split(", ")[0];
  if (!streetName) return null;
  return { address: streetName, kind: "street" };
}

/**
 * Resuelve una sugerencia elegida a lat/lng + direccion mostrable. Devuelve
 * null si Mapbox no trae ningun feature con coordenadas validas.
 */
export async function retrieve(id, sessionToken) {
  const token = getToken();
  if (!token) throw new Error("MAPBOX_SEARCH_TOKEN no configurado");

  const params = new URLSearchParams({
    session_token: sessionToken,
    access_token: token,
  });

  const res = await fetch(
    `${RETRIEVE_URL_BASE}/${encodeURIComponent(id)}?${params.toString()}`,
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MapboxSearchError(res.status, body);
  }

  const data = await res.json();
  const feature = data.features?.[0];
  const [lng, lat] = feature?.geometry?.coordinates || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const props = feature.properties || {};
  return {
    formattedAddress: props.full_address || suggestionText(props),
    lat,
    lng,
  };
}
