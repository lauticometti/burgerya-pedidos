import React from "react";
import { getCoverageBounds } from "../../utils/deliveryZones";
import styles from "./DeliveryMapPicker.module.css";

// PROVEEDOR ESTACIONADO: hoy el mapa activo es el de Google
// (DeliveryMapPicker.jsx). Este queda para poder volver a Mapbox y no lo
// importa nadie.
//
// OJO costos: este componente solo se monta cuando hace falta (el cliente
// abre "Elegir en el mapa" o ya eligio una ubicacion para confirmarla; ver
// DeliveryLocationPicker), y mapbox-gl (JS y CSS) se baja recien ahi con
// import() dinamico — nunca al entrar al checkout. Este archivo nunca hace
// fetch ni llama a los endpoints de busqueda de direcciones: mover o
// arrastrar el pin solo dispara getDeliveryZone (sincronico, local, gratis)
// via onLocationChange -> useDeliveryQuote. La direccion del pin la pide el
// componente padre, ya asentado el pin.

// Token PUBLICO de Mapbox GL JS (pk.*), restringible por URL en la cuenta de
// Mapbox. No es el token de busqueda: ese vive solo en el servidor.
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const MAX_INITIAL_ZOOM = 15;
const PIN_ZOOM = 16;
const PIN_COLOR = "#ff3131";
const SAME_POINT_EPSILON = 1e-7;

export default function DeliveryMapboxMapPicker({ visible = true, selectedLocation, onLocationChange }) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const placeMarkerRef = React.useRef(null);
  const onLocationChangeRef = React.useRef(onLocationChange);
  React.useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  });
  const initialLocationRef = React.useRef(selectedLocation);
  const [status, setStatus] = React.useState(MAPBOX_TOKEN ? "loading" : "no-key");

  const lat = selectedLocation?.lat ?? null;
  const lng = selectedLocation?.lng ?? null;

  React.useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;
    let cancelled = false;
    let map = null;

    // El CSS se carga junto con el JS y ANTES de crear el mapa: sin el CSS de
    // mapbox-gl el mapa se ve roto (cuadros vacios / controles desarmados).
    Promise.all([import("mapbox-gl"), import("mapbox-gl/dist/mapbox-gl.css")])
      .then(([mod]) => {
        if (cancelled || !containerRef.current) return;
        const mapboxgl = mod.default ?? mod;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const initial = initialLocationRef.current;
        const hasInitial = initial?.lat != null && initial?.lng != null;
        const coverage = getCoverageBounds();

        // Si ya hay una ubicacion elegida el mapa arranca centrado ahi; si
        // no, encuadra toda la cobertura calculada desde el GeoJSON, con un
        // zoom maximo razonable.
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          ...(hasInitial
            ? { center: [initial.lng, initial.lat], zoom: PIN_ZOOM }
            : {
                bounds: [
                  [coverage.west, coverage.south],
                  [coverage.east, coverage.north],
                ],
                fitBoundsOptions: { padding: 24, maxZoom: MAX_INITIAL_ZOOM },
              }),
        });
        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        const placeMarker = (lngValue, latValue) => {
          if (markerRef.current) {
            markerRef.current.setLngLat([lngValue, latValue]);
            return;
          }
          const marker = new mapboxgl.Marker({ draggable: true, color: PIN_COLOR, scale: 1.4 })
            .setLngLat([lngValue, latValue])
            .addTo(map);
          marker.on("dragend", () => {
            const pos = marker.getLngLat();
            onLocationChangeRef.current({ lat: pos.lat, lng: pos.lng, source: "map" });
          });
          markerRef.current = marker;
        };
        placeMarkerRef.current = placeMarker;

        if (hasInitial) placeMarker(initial.lng, initial.lat);

        map.on("click", (e) => {
          const { lng: clickLng, lat: clickLat } = e.lngLat;
          placeMarker(clickLng, clickLat);
          onLocationChangeRef.current({ lat: clickLat, lng: clickLng, source: "map" });
        });

        let loaded = false;
        map.on("load", () => {
          loaded = true;
          if (!cancelled) setStatus("ready");
        });
        // Token invalido / restringido / sin red antes de cargar el estilo.
        map.on("error", () => {
          if (!loaded && !cancelled) setStatus("error");
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      markerRef.current = null;
      placeMarkerRef.current = null;
      if (map) map.remove();
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
    if (lat == null || lng == null) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }
    const current = markerRef.current?.getLngLat();
    if (
      current &&
      Math.abs(current.lat - lat) < SAME_POINT_EPSILON &&
      Math.abs(current.lng - lng) < SAME_POINT_EPSILON
    ) {
      return;
    }
    placeMarkerRef.current?.(lng, lat);
    const map = mapRef.current;
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), PIN_ZOOM), essential: true });
  }, [status, lat, lng]);

  // Estando oculto el contenedor mide 0x0: al mostrarlo hay que redimensionar.
  React.useEffect(() => {
    if (visible && status === "ready") mapRef.current?.resize();
  }, [visible, status]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={styles.notice}>
        Falta configurar VITE_MAPBOX_TOKEN para mostrar el mapa.
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
          {lat != null
            ? "Confirmá que el pin esté en tu puerta. Si no, tocá el mapa o arrastralo."
            : "Tocá el mapa o arrastrá el pin para marcar tu ubicación."}
        </div>
      ) : null}
    </div>
  );
}
