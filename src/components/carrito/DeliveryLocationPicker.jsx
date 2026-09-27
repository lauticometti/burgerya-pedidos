import React from "react";
import DeliveryAddressField from "./DeliveryAddressField";
import DeliveryGeolocationPicker from "./DeliveryGeolocationPicker";
import DeliveryMapPicker from "./DeliveryMapPicker";
import DeliveryQuoteCard from "./DeliveryQuoteCard";
import { SearchIcon, CrosshairIcon, MapIcon } from "../ui/icons";
import {
  needsReverseGeocode,
  locationKey,
  needsHouseNumber,
  isSamePoint,
  keepsPlacesAddress,
} from "../../utils/reverseGeocodeRules";
import { createPinAddressScheduler } from "../../utils/pinAddressScheduler";
import { classifyLocationResponse } from "../../utils/locationApiResult";
import { decideGeolocation } from "../../utils/geolocationAccuracy";
import { AutoGrowTextField } from "../ui/FormFields";
import styles from "./DeliveryLocationPicker.module.css";

const METHODS = [
  { id: "search", label: "Buscar dirección", Icon: SearchIcon },
  { id: "geolocation", label: "Usar mi ubicación", Icon: CrosshairIcon },
  { id: "map", label: "Elegir en el mapa", Icon: MapIcon },
];

// Devuelve { address, kind } o null. Un limite de uso se lanza como error con
// el mensaje del servidor (para mostrarlo tal cual, sin pasar por "servicio
// caido"). El pin y el precio no dependen de esto.
async function fetchPinAddress(lat, lng) {
  let res;
  try {
    res = await fetch("/api/location/reverse", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });
  } catch {
    return null;
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  const result = classifyLocationResponse({ ok: res.ok, status: res.status, data });
  if (result.kind === "limited") throw Object.assign(new Error("limited"), { userMessage: result.message });
  return res.ok && data?.address ? { address: data.address, kind: data.kind } : null;
}

export default function DeliveryLocationPicker({
  address,
  onAddressChange,
  onAddressLabel,
  selectedLocation,
  onLocationChange,
  deliveryQuote,
}) {
  const [activeMethod, setActiveMethod] = React.useState("search");
  const [mapRequested, setMapRequested] = React.useState(false);
  // { key, message }: la consulta de la direccion del pin fallo. `message` solo
  // viene si fue un limite de uso (explicito); si no, se usa el texto generico.
  const [failure, setFailure] = React.useState(null);
  // Calle sin altura que devolvio el servidor: mientras el texto siga siendo
  // exactamente esa, hay que pedirle el numero al cliente.
  const [streetOnlyText, setStreetOnlyText] = React.useState(null);
  // Mejor lectura de "Usar mi ubicacion" { lat, lng, accuracy, level }. Solo
  // una lectura CONFIABLE (level "trusted") pasa a ser selectedLocation; una
  // aproximada o mala se muestra en el mapa para que la persona confirme o
  // ponga el pin, y mientras tanto no cotiza ni dice "fuera de cobertura".
  const [geoFix, setGeoFix] = React.useState(null);

  // El mapa se muestra en "Elegir en el mapa" y ademas cada vez que hay una
  // ubicacion elegida (por busqueda o ubicacion actual) para que el cliente
  // confirme que el pin cae donde corresponde. Se monta la primera vez que
  // hace falta (lazy) y despues queda montado, oculto si no se necesita.
  const mapVisible = activeMethod === "map" || selectedLocation != null || geoFix != null;
  if (mapVisible && !mapRequested) setMapRequested(true);

  const lat = selectedLocation?.lat ?? null;
  const lng = selectedLocation?.lng ?? null;
  const source = selectedLocation?.source ?? null;
  const moving = selectedLocation?.moving === true;

  const addressRef = React.useRef(address);
  const onAddressLabelRef = React.useRef(onAddressLabel);
  const selectedLocationRef = React.useRef(selectedLocation);
  const schedulerRef = React.useRef(null);
  // { lat, lng, text } de la ultima direccion elegida en Places (o null).
  const placesAnchorRef = React.useRef(null);
  // Siempre el ultimo valor, para que la consulta asincrona (que puede
  // terminar varios renders despues) lea el estado actual y no uno viejo.
  React.useEffect(() => {
    addressRef.current = address;
    onAddressLabelRef.current = onAddressLabel;
    selectedLocationRef.current = selectedLocation;
  });

  // Direccion del pin (mapa / ubicacion actual): SOLO para mostrar calle,
  // numero y localidad — la zona y el precio salen de lat/lng, local, sin
  // Google. El planificador consulta UNA vez por ubicacion confirmada (fin de
  // arrastre, toque final o ubicacion actual), nunca mientras el pin se mueve,
  // y si falla no toca la ubicacion ni la cotizacion (ver pinAddressScheduler).
  React.useEffect(() => {
    schedulerRef.current = createPinAddressScheduler({
      lookup: fetchPinAddress,
      onFound: (found) => {
        // Si el cliente ya empezo a escribir la direccion a mano, se respeta.
        if (addressRef.current !== "") return;
        onAddressLabelRef.current(found.address);
        setStreetOnlyText(found.kind === "street" ? found.address : null);
      },
      onFailed: (key, error) => setFailure({ key, message: error?.userMessage ?? null }),
    });
    return () => schedulerRef.current.cancel();
  }, []);

  React.useEffect(() => {
    schedulerRef.current.schedule({ lat, lng, source, moving });
  }, [lat, lng, source, moving]);

  const handleLocationChange = (location) => {
    // Retoque del pin de una direccion elegida en Places: la direccion elegida
    // se conserva (sin reverse geocoding) y el pin nuevo manda para el precio.
    if (keepsPlacesAddress(placesAnchorRef.current, location, addressRef.current)) {
      onLocationChange({ lat: location.lat, lng: location.lng, source: "search" });
      return;
    }
    // El texto de la direccion anterior ya no corresponde a un pin NUEVO. Si
    // es el mismo punto (o solo se esta arrastrando) se conserva.
    if (needsReverseGeocode(location) && !isSamePoint(location, selectedLocationRef.current)) {
      onAddressLabel("");
    }
    // Apenas la persona toca o mueve el pin, ese pin manda: la lectura de
    // geolocalizacion (y su circulo de precision) ya no cuenta.
    if (location?.source === "map") setGeoFix(null);
    onLocationChange(location);
  };

  const handleGeolocationStart = () => {
    setGeoFix(null);
    handleLocationChange(null); // nunca dejar una cotizacion vieja mientras se busca
  };

  // Segun la precision: confiable -> cotiza sola; aproximada -> confirmar el
  // pin; mala -> pin manual en el mapa. Nunca "fuera de cobertura" con mala
  // precision: sin ubicacion decidida no hay cotizacion.
  const handleGeolocationFix = (fix) => {
    const decision = decideGeolocation(fix);
    setGeoFix({ ...decision.fix, level: decision.level });
    if (decision.location) handleLocationChange(decision.location);
  };

  const confirmGeoFix = () => {
    if (!geoFix) return;
    handleLocationChange({ lat: geoFix.lat, lng: geoFix.lng, source: "map" });
  };

  const changeMethod = (id) => {
    setActiveMethod(id);
    if (id !== "geolocation") setGeoFix(null);
  };

  const pinLocation = { lat, lng, source, moving };
  const showAddressLabel = activeMethod !== "search" && selectedLocation != null;
  const addressFailed = needsReverseGeocode(pinLocation) && failure?.key === locationKey(pinLocation);
  const addressPending = needsReverseGeocode(pinLocation) && address === "" && !addressFailed;

  // eslint-disable-next-line no-unused-vars -- Icon is used as a JSX tag below; the base eslint config lacks JSX-uses-vars detection.
  const renderMethodButton = ({ id, label, Icon }) => (
    <button
      key={id}
      type="button"
      className={`${styles.methodButton} ${activeMethod === id ? styles.methodButtonActive : ""}`}
      aria-pressed={activeMethod === id}
      onClick={() => changeMethod(id)}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.methodRow}>{METHODS.map(renderMethodButton)}</div>

      <div className={styles.methodPanel}>
        {activeMethod === "search" ? (
          <DeliveryAddressField
            value={address}
            onTextChange={onAddressChange}
            onResolved={(coords, chosenText) => {
              setGeoFix(null);
              // La direccion de Places es la principal: se recuerda para no
              // pisarla si el cliente solo retoca el pin (ver keepsPlacesAddress).
              placesAnchorRef.current = coords ? { lat: coords.lat, lng: coords.lng, text: chosenText ?? "" } : null;
              onLocationChange(coords ? { ...coords, source: "search" } : null);
            }}
          />
        ) : null}

        {activeMethod === "geolocation" ? (
          <DeliveryGeolocationPicker onStart={handleGeolocationStart} onFix={handleGeolocationFix} />
        ) : null}
      </div>

      {geoFix?.level === "confirm" ? (
        <div className={styles.geoNotice}>
          <div>
            Tu ubicación es aproximada (±{Math.round(geoFix.accuracy)} m). Confirmá que el pin esté en tu puerta o
            ajustalo en el mapa.
          </div>
          <button type="button" className={styles.geoConfirm} onClick={confirmGeoFix}>
            Confirmar ubicación
          </button>
        </div>
      ) : null}
      {geoFix?.level === "poor" ? (
        <div className={styles.geoNotice}>
          <div>
            No pudimos ubicarte con suficiente precisión.
            <br />
            Ajustá tu ubicación en el mapa.
          </div>
        </div>
      ) : null}
      {geoFix?.level === "trusted" && deliveryQuote?.status === "uncovered" ? (
        <div className={styles.labelHint}>Si esta no es tu ubicación real, ajustá el pin en el mapa.</div>
      ) : null}

      {mapRequested ? (
        <div style={{ display: mapVisible ? "block" : "none" }}>
          <DeliveryMapPicker
            visible={mapVisible}
            selectedLocation={selectedLocation}
            approx={geoFix}
            onLocationChange={handleLocationChange}
          />
        </div>
      ) : null}

      {showAddressLabel ? (
        <div className={styles.labelField}>
          <div className={styles.labelTitle}>Dirección</div>
          <AutoGrowTextField
            value={address}
            autoComplete="off"
            placeholder={
              addressPending
                ? "Buscando la dirección..."
                : addressFailed
                  ? "No pudimos obtener la calle: escribila vos"
                  : "Calle y altura"
            }
            onChange={(e) => onAddressLabel(e.target.value)}
          />
          {addressFailed && address === "" ? (
            <div className={styles.labelHintWarn}>
              {failure?.message ??
                "No pudimos obtener la calle y el número de este punto. Escribí tu dirección o ajustá el pin."}
            </div>
          ) : needsHouseNumber(address, streetOnlyText) ? (
            <div className={styles.labelHintWarn}>
              Falta la altura: agregá el número de tu puerta para que el repartidor te encuentre.
            </div>
          ) : (
            <div className={styles.labelHint}>
              Revisá la altura: es la que ve el repartidor. El costo de envío sale de donde está el pin.
            </div>
          )}
        </div>
      ) : null}

      <DeliveryQuoteCard quote={deliveryQuote} />
    </div>
  );
}
