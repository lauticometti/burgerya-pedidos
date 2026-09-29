// Wrapper minimo para Google: Places API (New) para buscar direcciones
// (autocomplete + detalle) y Geocoding API para pin -> direccion. Sin
// reintentos: si Google devuelve 429 / OVER_QUERY_LIMIT u otro error se
// propaga tal cual para que el endpoint lo traduzca a una respuesta segura —
// nunca reintentamos en loop contra la cuota.
//
// La key se lee en cada llamada (no al cargar el modulo) para que un cambio de
// env var en dev se note sin reiniciar el proceso. Es una key SOLO de servidor
// (nunca llega al navegador), restringida a "Places API (New)" y "Geocoding
// API".

import { SEARCH_BIAS } from "./searchArea.js";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_URL_BASE = "https://places.googleapis.com/v1/places";
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

function getKey() {
  return process.env.GOOGLE_PLACES_API_KEY;
}

export function isConfigured() {
  return Boolean(getKey());
}

export class GooglePlacesError extends Error {
  constructor(status, body) {
    super(`Google error ${status}`);
    this.status = status;
    this.body = body;
  }
}

// Tipos de lugar que si tienen un punto real (una casa, un local). Una
// prediccion que es SOLO una calle ("route") devuelve un unico punto para
// toda la calle, que puede caer en otra zona de reparto que la casa real y dar
// un precio de envio equivocado: no se ofrece, el cliente tiene que poner la
// altura.
const ADDRESS_LIKE_TYPES = ["street_address", "premise", "subpremise", "establishment", "point_of_interest"];

function isBareStreet(types) {
  if (!Array.isArray(types) || types.length === 0) return false;
  return types.includes("route") && !types.some((t) => ADDRESS_LIKE_TYPES.includes(t));
}

// "B1686 Hurlingham" / "1686 Hurlingham" -> "Hurlingham" (sin codigo postal).
function stripPostalCode(text) {
  return text.replace(/^([A-Z]\d{4}[A-Z]{0,3}|\d{4})\s+/, "").trim();
}

// "Beethoven 1234" + "B1686 Hurlingham, Provincia de Buenos Aires, Argentina"
// -> "Beethoven 1234, Hurlingham": calle + altura + localidad, lo que necesita
// el repartidor (sin provincia, codigo postal ni pais).
function suggestionText(prediction) {
  const main = prediction.structuredFormat?.mainText?.text;
  const secondary = prediction.structuredFormat?.secondaryText?.text;
  if (main) {
    const locality = secondary ? stripPostalCode(secondary.split(", ")[0]) : "";
    return locality ? `${main}, ${locality}` : main;
  }
  return prediction.text?.text || "";
}

// El sesgo de Google no alcanza con calles que existen en varios partidos: para
// "Gobernador Vergara 1799" Google puso primero la de Florida (~15 km) y
// despues la de Villa Tesei (dentro de la cobertura). Orden estable: primero
// las predicciones a <= radio del sesgo, despues el resto, cada grupo en el
// orden original de Google. Nada se descarta (una direccion lejos igual se
// puede elegir y getDeliveryZone decide).
export function nearbyFirst(predictions) {
  const isNear = (p) => Number.isFinite(p.distanceMeters) && p.distanceMeters <= SEARCH_BIAS.radiusMeters;
  return [...predictions.filter(isNear), ...predictions.filter((p) => !isNear(p))];
}

async function fail(res) {
  const body = await res.text().catch(() => "");
  throw new GooglePlacesError(res.status, body);
}

/**
 * Autocomplete de direcciones -> [{ id, text }]. `sessionToken` es el mismo
 * string que el cliente reusa durante toda una busqueda (y en retrieve()), tal
 * como pide Google para agrupar la facturacion por sesion.
 */
export async function suggest(query, sessionToken) {
  const key = getKey();
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY no configurada");

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
    body: JSON.stringify({
      input: query,
      sessionToken,
      // SESGO fuerte hacia Hurlingham y la cobertura, a proposito NO una
      // restriccion: alguien apenas afuera igual tiene que poder elegir su
      // direccion (getDeliveryZone decide despues si llegamos).
      locationBias: {
        circle: {
          center: SEARCH_BIAS.center,
          radius: SEARCH_BIAS.radiusMeters,
        },
      },
      // Con origin Google devuelve distanceMeters por prediccion (sin costo
      // extra): lo usamos para subir las que caen en la zona de reparto.
      origin: SEARCH_BIAS.center,
      includedRegionCodes: ["ar"],
      languageCode: "es",
      regionCode: "ar",
    }),
  });
  if (!res.ok) await fail(res);

  const data = await res.json();
  const predictions = (data.suggestions || [])
    .map((s) => s.placePrediction)
    .filter((p) => p && p.placeId && !isBareStreet(p.types));
  return nearbyFirst(predictions).map((p) => ({ id: p.placeId, text: suggestionText(p) }));
}

/**
 * Resuelve un placeId a lat/lng + direccion formateada. Reusa el sessionToken
 * de la busqueda para que Google la facture como una sola sesion. Devuelve
 * null si Google no trae coordenadas validas.
 */
export async function retrieve(placeId, sessionToken) {
  const key = getKey();
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY no configurada");

  const url = `${DETAILS_URL_BASE}/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=es`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "id,formattedAddress,location" },
  });
  if (!res.ok) await fail(res);

  const data = await res.json();
  const lat = data.location?.latitude;
  const lng = data.location?.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { formattedAddress: data.formattedAddress || "", lat, lng };
}

function component(result, ...types) {
  return result.address_components?.find((c) => types.some((t) => c.types?.includes(t)))?.long_name || "";
}

const UNNAMED_ROAD = /^(unnamed road|camino sin nombre|calle sin nombre)$/i;

// Estados de la Geocoding API que llegan con HTTP 200 pero son un error.
const GEOCODE_ERROR_STATUS = {
  OVER_QUERY_LIMIT: 429,
  OVER_DAILY_LIMIT: 429,
  REQUEST_DENIED: 403,
  INVALID_REQUEST: 400,
  UNKNOWN_ERROR: 500,
};

/**
 * Direccion legible de un pin (Geocoding API, reverse). Google interpola la
 * altura entre casas conocidas, asi que casi siempre hay numero. Devuelve
 * { address: "Beethoven 1234, Hurlingham", kind: "address" }, o solo la calle
 * (kind "street", sin numero) si Google no encontro una direccion puntual; null
 * si no hay nada. La UI la muestra editable y el precio de envio sale del pin,
 * nunca de este texto. Una sola llamada.
 */
export async function reverse(lat, lng) {
  const key = getKey();
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY no configurada");

  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    language: "es",
    region: "ar",
    result_type: "street_address|premise|route",
    key,
  });
  const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
  if (!res.ok) await fail(res);

  const data = await res.json();
  if (GEOCODE_ERROR_STATUS[data.status]) {
    throw new GooglePlacesError(GEOCODE_ERROR_STATUS[data.status], data.error_message || data.status);
  }
  const results = data.results || [];
  if (data.status === "ZERO_RESULTS" || results.length === 0) return null;

  // Google llama "Unnamed Road" a los caminos sin nombre: no le sirve a nadie
  // como direccion, se descartan.
  const named = results.filter((r) => !UNNAMED_ROAD.test(component(r, "route")));
  const result =
    named.find((r) => r.types?.includes("street_address") || r.types?.includes("premise")) ||
    named.find((r) => r.types?.includes("route")) ||
    named[0];
  if (!result) return null;

  const route = component(result, "route");
  const number = component(result, "street_number");
  const locality = component(result, "locality", "sublocality_level_1", "sublocality", "administrative_area_level_2");

  if (!route) {
    const fallback = (result.formatted_address || "").split(", ")[0];
    return fallback ? { address: fallback, kind: "street" } : null;
  }
  if (!number) return { address: route, kind: "street" };
  return { address: `${route} ${number}${locality ? `, ${locality}` : ""}`, kind: "address" };
}
