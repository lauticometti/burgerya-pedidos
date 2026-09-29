// Reglas de cuando hay que pedir la direccion de una ubicacion (pin -> texto).
// La direccion es SOLO para mostrar calle, numero y localidad: la zona y el
// precio salen de lat/lng con getDeliveryZone, local y gratis, sin Google.

// Solo las ubicaciones que NO traen su propio texto (las de la busqueda de
// direcciones ya vienen con la direccion elegida por el cliente) y que ya
// estan CONFIRMADAS: mientras el pin se arrastra la ubicacion llega marcada
// `moving: true` (solo para cotizar en vivo) y nunca pide direccion.
export function needsReverseGeocode(location) {
  return (
    !!location &&
    location.moving !== true &&
    (location.source === "map" || location.source === "geolocation") &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  );
}

// A veces el proveedor solo devuelve la calle ("Malaspina"), sin altura. Un
// texto sin ningun digito es una calle sin altura.
export function addressLacksNumber(text) {
  const value = String(text ?? "").trim();
  return value !== "" && !/\d/.test(value);
}

// Hay que pedirle la altura al cliente cuando el texto no tiene digitos, o
// cuando es exactamente la calle sin altura que devolvio el servidor
// (`streetOnlyText`): calles como "Calle 5" o "25 de Mayo" ya traen un digito
// y la regla de los digitos sola no las detectaria. Apenas el cliente edita el
// texto (agrega la altura) deja de coincidir y el aviso desaparece.
export function needsHouseNumber(address, streetOnlyText) {
  if (addressLacksNumber(address)) return true;
  return streetOnlyText != null && String(address ?? "").trim() === streetOnlyText;
}

// Clave por posicion (~1 m): dos pines en el mismo lugar no repiten la consulta.
export function locationKey(location) {
  return `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`;
}

// Mismo punto (a ~1 m) entre dos ubicaciones confirmadas.
export function isSamePoint(a, b) {
  return (
    needsReverseGeocode(a) && needsReverseGeocode(b) && locationKey(a) === locationKey(b)
  );
}

// Distancia aproximada en metros entre dos { lat, lng } (haversine).
export function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Radio dentro del cual ajustar el pin de una direccion de Places se considera
// "confirmar la misma puerta" y no "elegir otro lugar".
export const PLACES_KEEP_RADIUS_M = 25;

// La direccion elegida en Places es la principal. Si despues el cliente solo
// retoca el pin unos metros (confirma su puerta), NO se reemplaza por un
// reverse geocoding: Google puede devolver la casa de al lado (caso
// "Beethoven 1234"). El pin igual manda para zona y precio. `anchor` es
// { lat, lng, text } de la seleccion de Places; solo aplica mientras el texto
// siga siendo exactamente el elegido.
export function keepsPlacesAddress(anchor, location, address) {
  return (
    !!anchor &&
    needsReverseGeocode(location) &&
    location.source === "map" &&
    String(address ?? "").trim() !== "" &&
    String(address).trim() === String(anchor.text ?? "").trim() &&
    distanceMeters(anchor, location) <= PLACES_KEEP_RADIUS_M
  );
}
