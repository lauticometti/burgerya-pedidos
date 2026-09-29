import React from "react";
import { getCoverageBounds } from "../../utils/deliveryZones";
import { loadGoogleMaps } from "../../utils/googleMapsLoader";
import styles from "./DeliveryMapPicker.module.css";

// OJO costos: este componente solo se monta cuando hace falta (el cliente
// abre "Elegir en el mapa" o ya eligio una ubicacion para confirmarla; ver
// DeliveryLocationPicker), y el SDK de Google Maps se baja recien ahi — nunca
// al entrar al checkout. Cada carga del mapa es una consulta facturable. Este
// archivo nunca hace fetch ni llama a los endpoints de busqueda de
// direcciones: mover o arrastrar el pin solo dispara getDeliveryZone
// (sincronico, local, gratis) via onLocationChange -> useDeliveryQuote. La
// direccion del pin la pide el componente padre, y solo cuando la ubicacion
// queda confirmada (toque final o fin de arrastre): pan, zoom y el arrastre en
// curso no consultan nada.

// Key PUBLICA de Maps JavaScript API, restringida por HTTP referrer en la
// cuenta de Google. No es la key de busqueda de direcciones: esa vive solo en
// el servidor.
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const MAX_INITIAL_ZOOM = 15;
const PIN_ZOOM = 16;
const SAME_POINT_EPSILON = 1e-7;
const CIRCLE_COLOR = "#ffc62a";

// `approx` = mejor lectura de "Usar mi ubicacion" { lat, lng, accuracy, level }.
// Solo se DIBUJA (circulo con el radio de la precision; y, si es "confirm", un
// pin provisorio para confirmar). Nunca cotiza: eso solo lo hace selectedLocation.
export default function DeliveryMapPicker({ visible = true, selectedLocation, approx = null, onLocationChange }) {
  const containerRef = React.useRef(null);
  const mapsRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const placeMarkerRef = React.useRef(null);
  const dragFrameRef = React.useRef(0);
  const circleClassRef = React.useRef(null);
  const circleRef = React.useRef(null);
  const onLocationChangeRef = React.useRef(onLocationChange);
  React.useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  });
  const initialLocationRef = React.useRef(selectedLocation);
  const [status, setStatus] = React.useState(GOOGLE_MAPS_KEY ? "loading" : "no-key");

  const lat = selectedLocation?.lat ?? null;
  const lng = selectedLocation?.lng ?? null;
  const moving = selectedLocation?.moving === true;
  // Lectura aproximada (50-150 m) sin pin todavia: se muestra un pin provisorio
  // en el mapa para que la persona lo confirme o lo ajuste.
  const pendingPin = lat == null && approx?.level === "confirm" ? approx : null;
  const pinLat = lat ?? pendingPin?.lat ?? null;
  const pinLng = lng ?? pendingPin?.lng ?? null;

  React.useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !containerRef.current) return;
    let cancelled = false;
    let map = null;

    // Google avisa de una key invalida / restringida / sin facturacion con
    // este callback global (el mapa sale gris con un cartel de error).
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      if (!cancelled) setStatus("error");
    };

    loadGoogleMaps(GOOGLE_MAPS_KEY)
      .then(async (maps) => {
        // Con loading=async las clases se piden por libreria.
        const [{ Map: GoogleMap, Circle }, { Marker }] = await Promise.all([
          maps.importLibrary("maps"),
          maps.importLibrary("marker"),
        ]);
        if (cancelled || !containerRef.current) return;
        mapsRef.current = maps;
        circleClassRef.current = Circle;

        const initial = initialLocationRef.current;
        const hasInitial = initial?.lat != null && initial?.lng != null;
        const coverage = getCoverageBounds();

        // Si ya hay una ubicacion elegida el mapa arranca centrado ahi; si
        // no, encuadra toda la cobertura calculada desde el GeoJSON.
        map = new GoogleMap(containerRef.current, {
          center: hasInitial
            ? { lat: initial.lat, lng: initial.lng }
            : { lat: (coverage.north + coverage.south) / 2, lng: (coverage.east + coverage.west) / 2 },
          zoom: hasInitial ? PIN_ZOOM : 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          // Sin esto tocar un comercio del mapa abre su ficha en vez de
          // marcar el punto.
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        mapRef.current = map;

        if (!hasInitial) {
          map.fitBounds(
            { north: coverage.north, south: coverage.south, east: coverage.east, west: coverage.west },
            24,
          );
        }

        const placeMarker = (latValue, lngValue) => {
          if (markerRef.current) {
            markerRef.current.setPosition({ lat: latValue, lng: lngValue });
            return;
          }
          const marker = new Marker({ map, position: { lat: latValue, lng: lngValue }, draggable: true });
          // Mientras se arrastra: zona y precio en vivo (local, gratis). La
          // ubicacion va marcada `moving` para que el padre NO pida la
          // direccion; como mucho una actualizacion por cuadro.
          marker.addListener("drag", () => {
            if (dragFrameRef.current) return;
            dragFrameRef.current = requestAnimationFrame(() => {
              dragFrameRef.current = 0;
              const pos = marker.getPosition();
              onLocationChangeRef.current({ lat: pos.lat(), lng: pos.lng(), source: "map", moving: true });
            });
          });
          // Al soltar, la ubicacion queda confirmada.
          marker.addListener("dragend", () => {
            cancelAnimationFrame(dragFrameRef.current);
            dragFrameRef.current = 0;
            const pos = marker.getPosition();
            onLocationChangeRef.current({ lat: pos.lat(), lng: pos.lng(), source: "map" });
          });
          markerRef.current = marker;
        };
        placeMarkerRef.current = placeMarker;

        if (hasInitial) placeMarker(initial.lat, initial.lng);

        map.addListener("click", (e) => {
          const clickLat = e.latLng.lat();
          const clickLng = e.latLng.lng();
          placeMarker(clickLat, clickLng);
          onLocationChangeRef.current({ lat: clickLat, lng: clickLng, source: "map" });
        });

        // Primera vez que el mapa queda quieto: ya se dibujo. Sin ubicacion
        // previa, fitBounds puede acercar de mas en una cobertura chica.
        maps.event.addListenerOnce(map, "idle", () => {
          if (cancelled) return;
          if (!hasInitial && map.getZoom() > MAX_INITIAL_ZOOM) map.setZoom(MAX_INITIAL_ZOOM);
          setStatus("ready");
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(dragFrameRef.current);
      window.gm_authFailure = previousAuthFailure;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      circleRef.current?.setMap(null);
      circleRef.current = null;
      placeMarkerRef.current = null;
      if (map) mapsRef.current?.event.clearInstanceListeners(map);
      mapRef.current = null;
    };
    // Montaje unico a proposito: una sola inicializacion del mapa mientras el
    // componente vive, sin re-crearlo por cada cambio de ubicacion.
  }, []);

  // Cuando la ubicacion cambia desde afuera (busqueda, ubicacion actual) el
  // pin se mueve y el mapa se centra ahi para que el cliente lo confirme. Si
  // el cambio vino del propio mapa (pin ya en ese punto), no se toca nada.
  React.useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    // Arrastrando, el pin ya esta donde el cliente lo lleva: moverlo desde
    // aca lo pelearia con el arrastre.
    if (moving) return;
    if (pinLat == null || pinLng == null) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      return;
    }
    const current = markerRef.current?.getPosition();
    if (
      current &&
      Math.abs(current.lat() - pinLat) < SAME_POINT_EPSILON &&
      Math.abs(current.lng() - pinLng) < SAME_POINT_EPSILON
    ) {
      return;
    }
    placeMarkerRef.current?.(pinLat, pinLng);
    // Pin provisorio: lo encuadra el circulo de precision (efecto de abajo).
    if (pendingPin) return;
    const map = mapRef.current;
    map.setZoom(Math.max(map.getZoom() ?? 0, PIN_ZOOM));
    map.panTo({ lat: pinLat, lng: pinLng });
  }, [status, pinLat, pinLng, moving, pendingPin]);

  // Circulo de precision de la geolocalizacion. Con una lectura aproximada o
  // mala se encuadra toda el area de incertidumbre para que la persona ponga el
  // pin; con una confiable (circulo chico) el efecto del pin centra el mapa.
  React.useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) return;
    if (!approx) {
      circleRef.current?.setMap(null);
      circleRef.current = null;
      return;
    }
    const center = { lat: approx.lat, lng: approx.lng };
    const radius = Math.max(Number.isFinite(approx.accuracy) ? approx.accuracy : 0, 10);
    if (circleRef.current) {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radius);
    } else if (circleClassRef.current) {
      circleRef.current = new circleClassRef.current({
        map,
        center,
        radius,
        clickable: false,
        strokeColor: CIRCLE_COLOR,
        strokeOpacity: 0.9,
        strokeWeight: 1,
        fillColor: CIRCLE_COLOR,
        fillOpacity: 0.15,
      });
    }
    if (approx.level !== "trusted" && circleRef.current) map.fitBounds(circleRef.current.getBounds(), 24);
  }, [status, approx]);

  // Estando oculto el contenedor mide 0x0: al mostrarlo hay que redibujar.
  React.useEffect(() => {
    if (visible && status === "ready" && mapRef.current) {
      mapsRef.current?.event.trigger(mapRef.current, "resize");
    }
  }, [visible, status]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className={styles.notice}>
        Falta configurar VITE_GOOGLE_MAPS_API_KEY para mostrar el mapa.
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {status === "loading" ? <div className={styles.notice}>Cargando mapa...</div> : null}
      {status === "error" ? (
        <div className={styles.notice}>No pudimos cargar el mapa. Probá con otro método.</div>
      ) : null}
      <div ref={containerRef} className={styles.mapContainer} />
      {status === "ready" ? (
        <div className={styles.hint}>
          {lat != null || pendingPin
            ? "Confirmá que el pin esté en tu puerta. Si no, tocá el mapa o arrastralo."
            : "Tocá el mapa o arrastrá el pin para marcar tu ubicación."}
        </div>
      ) : null}
    </div>
  );
}
