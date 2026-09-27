import { needsReverseGeocode, locationKey } from "./reverseGeocodeRules";

// Cuando se llama a Google Geocoding. UNA sola vez por ubicacion CONFIRMADA:
//   - fin de arrastre del pin (dragend), toque final en el mapa, o ubicacion
//     obtenida por navigator.geolocation.
// Nunca mientras el pin se mueve, ni por pan/zoom, ni para calcular el precio
// (la zona y el precio salen de lat/lng con getDeliveryZone, local y gratis).
//
// Mientras se arrastra, la ubicacion llega con `moving: true`: no es elegible
// (needsReverseGeocode = false) y cancela cualquier consulta pendiente o en
// vuelo. El debounce evita dobles llamadas si se confirma varias veces muy
// seguido, y una misma posicion (a ~1 m) no se vuelve a consultar.
//
// Si la consulta falla NO se toca la ubicacion ni la cotizacion: solo se avisa
// con onFailed(key, error) para que la UI pida escribir la calle a mano.

export const REVERSE_DEBOUNCE_MS = 600;

export function createPinAddressScheduler({ lookup, onFound, onFailed, delayMs = REVERSE_DEBOUNCE_MS }) {
  let timer = null;
  let seq = 0;
  let lastKey = null;

  const cancelPending = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    seq += 1; // invalida tambien una consulta ya en vuelo
  };

  return {
    schedule(location) {
      if (!needsReverseGeocode(location)) {
        // Sin ubicacion, de la busqueda, o arrastrando: nada que consultar.
        cancelPending();
        lastKey = null;
        return;
      }
      const key = locationKey(location);
      if (key === lastKey) return; // mismo punto: ya pedido, en vuelo o resuelto

      cancelPending();
      lastKey = key;
      const mySeq = seq;
      timer = setTimeout(async () => {
        timer = null;
        let found = null;
        let failure = null;
        try {
          found = await lookup(location.lat, location.lng);
        } catch (err) {
          failure = err; // p.ej. un limite de uso: trae el mensaje para el cliente
        }
        if (mySeq !== seq) return; // el pin ya se movio: respuesta vieja
        if (found) {
          onFound(found, key);
        } else {
          lastKey = null; // permite reintentar tocando de nuevo el mismo punto
          onFailed(key, failure);
        }
      }, delayMs);
    },

    cancel() {
      cancelPending();
      lastKey = null;
    },
  };
}
