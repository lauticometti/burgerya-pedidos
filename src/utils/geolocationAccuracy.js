// "Usar mi ubicacion": la precision (`coords.accuracy`, en metros) es parte
// OBLIGATORIA de la decision. Una PC sin GPS puede ubicar a kilometros de
// distancia; una coordenada de mala precision JAMAS puede terminar en "Todavia
// no llegamos": no se usa para decidir delivery.
//
//   accuracy <= 50 m          -> "trusted": ubicacion confiable, se cotiza sola.
//   50 m < accuracy <= 150 m  -> "confirm": se muestra en el mapa y la persona
//                                confirma o ajusta el pin; recien ahi se cotiza.
//   accuracy > 150 m          -> "poor": no se usa para decidir nada; se pide
//                                marcar el pin en el mapa (centrado ahi).
//
// Una vez que la persona toca, mueve o confirma el pin, ese pin es la fuente de
// verdad.

export const ACCURACY_TRUSTED_M = 50;
export const ACCURACY_CONFIRM_M = 150;
export const GEOLOCATION_TIMEOUT_MS = 10_000;

export function classifyAccuracy(accuracy) {
  // Sin dato de precision no hay motivo para confiar.
  if (!Number.isFinite(accuracy) || accuracy < 0) return "poor";
  if (accuracy <= ACCURACY_TRUSTED_M) return "trusted";
  if (accuracy <= ACCURACY_CONFIRM_M) return "confirm";
  return "poor";
}

// Gana la lectura de menor `accuracy` (a igual precision, la mas nueva). Una
// lectura sin precision es siempre la peor.
function isBetterReading(candidate, current) {
  if (!current) return true;
  const a = Number.isFinite(candidate.accuracy) ? candidate.accuracy : Infinity;
  const b = Number.isFinite(current.accuracy) ? current.accuracy : Infinity;
  return a <= b;
}

/**
 * Que hacer con la mejor lectura obtenida. `location` (con source
 * "geolocation") solo existe si es CONFIABLE: es lo unico que puede cotizar
 * envio. Para "confirm" y "poor" `location` es null: no hay cotizacion ni
 * "fuera de cobertura" hasta que la persona ponga o confirme el pin.
 */
export function decideGeolocation(fix) {
  const level = classifyAccuracy(fix?.accuracy);
  return {
    level,
    fix: { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy },
    location: level === "trusted" ? { lat: fix.lat, lng: fix.lng, source: "geolocation" } : null,
  };
}

/**
 * Pide la ubicacion con `watchPosition` (alta precision) durante unos segundos y
 * se queda con la MEJOR lectura. Corta antes si llega una lectura confiable
 * (<= 50 m). Al vencer el tiempo entrega la mejor que tenga (aunque sea mala:
 * el que llama decide con `decideGeolocation`); si no hubo ninguna, error.
 *
 * `geolocation` es navigator.geolocation (inyectable para testear).
 * Devuelve una funcion para cancelar sin llamar a ningun callback.
 */
export function startGeolocationSampling({ geolocation, timeoutMs = GEOLOCATION_TIMEOUT_MS, onResult, onError }) {
  let best = null;
  let done = false;
  let watchId = null;
  let timer = null;

  const stopWatching = () => {
    clearTimeout(timer);
    if (watchId != null) geolocation.clearWatch(watchId);
  };

  const finish = () => {
    if (done) return;
    done = true;
    stopWatching();
    if (best) onResult(best);
    else onError({ permissionDenied: false, timedOut: true });
  };

  timer = setTimeout(finish, timeoutMs);

  watchId = geolocation.watchPosition(
    (position) => {
      if (done) return;
      const coords = position?.coords;
      const reading = { lat: coords?.latitude, lng: coords?.longitude, accuracy: coords?.accuracy };
      if (!Number.isFinite(reading.lat) || !Number.isFinite(reading.lng)) return;
      if (isBetterReading(reading, best)) best = reading;
      if (classifyAccuracy(best.accuracy) === "trusted") finish(); // suficientemente buena: no hace falta seguir
    },
    (error) => {
      // Sin permiso no hay nada mas que esperar. Otros errores (sin señal
      // momentanea, timeout de una lectura) pueden resolverse solos: se sigue
      // hasta que venza el tiempo total.
      if (error?.code === 1 && !done) {
        done = true;
        stopWatching();
        onError({ permissionDenied: true, timedOut: false });
      }
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs },
  );
  // El navegador pudo llamar al callback antes de devolver el id del watch.
  if (done) geolocation.clearWatch(watchId);

  return () => {
    if (done) return;
    done = true;
    stopWatching();
  };
}
