import React from "react";
import { AutoGrowTextField } from "../ui/FormFields";
import GooglePlacesAttribution from "./GooglePlacesAttribution";
import { safeRandomUUID } from "../../utils/uuid";
import { classifyLocationResponse } from "../../utils/locationApiResult";
import styles from "./DeliveryAddressField.module.css";

// Minimo de caracteres antes de consultar (evita busquedas por cada letra) y
// debounce en ms — deben coincidir en espiritu con lo que valida el server,
// aunque el server siempre revalida por su cuenta.
const MIN_QUERY_LENGTH = 4;
const DEBOUNCE_MS = 500;

async function postJson(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, data: { message: "No pudimos buscar direcciones en este momento. Escribinos por WhatsApp." } };
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

// value/onTextChange/onResolved: mismo contrato de siempre (onResolved recibe
// {lat,lng} o null). El componente padre (DeliveryLocationPicker) es quien
// le agrega el source:"search" antes de guardarlo como selectedLocation.
export default function DeliveryAddressField({ value, onTextChange, onResolved }) {
  const [suggestions, setSuggestions] = React.useState([]);
  const [status, setStatus] = React.useState("idle"); // idle | loading | ok | limited | unavailable
  const [message, setMessage] = React.useState("");

  const sessionTokenRef = React.useRef(null);
  const debounceRef = React.useRef(null);
  const requestSeqRef = React.useRef(0);
  const listRef = React.useRef(null);
  const hasSuggestions = suggestions.length > 0;

  // Cuando aparece la lista, que quede a la vista y no debajo de la barra fija
  // de abajo (scroll-margin-bottom en el CSS deja lugar para esa barra).
  React.useEffect(() => {
    if (hasSuggestions) listRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [hasSuggestions]);

  const getOrCreateSessionToken = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = safeRandomUUID();
    }
    return sessionTokenRef.current;
  };

  const runSearch = React.useCallback(async (text) => {
    const seq = ++requestSeqRef.current;
    setStatus("loading");
    try {
      const sessionToken = getOrCreateSessionToken();
      const response = await postJson("/api/location/autocomplete", {
        input: text,
        sessionToken,
      });
      if (seq !== requestSeqRef.current) return; // llego una respuesta vieja, se descarta

      // Un limite de uso ("limited") es un estado propio con su mensaje, no un
      // servicio caido. En ningun caso se toca el texto ni la ubicacion ya
      // elegidos: solo se informa.
      const result = classifyLocationResponse(response);
      if (result.kind !== "ok") {
        setSuggestions([]);
        setStatus(result.kind);
        setMessage(result.message);
        return;
      }
      const { data } = response;

      setSuggestions(data.suggestions || []);
      setStatus("ok");
      setMessage("");
    } catch {
      // Cualquier fallo inesperado: nunca dejar la pantalla en "Buscando..."
      if (seq !== requestSeqRef.current) return;
      setSuggestions([]);
      setStatus("unavailable");
      setMessage("No pudimos buscar direcciones en este momento. Escribinos por WhatsApp.");
    }
  }, []);

  const handleTextChange = (text) => {
    onTextChange(text);
    onResolved(null); // limpia el quote anterior de inmediato al editar el texto

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      sessionTokenRef.current = null; // se borro todo: la proxima busqueda es nueva
      requestSeqRef.current += 1;
      setSuggestions([]);
      setStatus("idle");
      setMessage("");
      return;
    }

    if (trimmed.length < MIN_QUERY_LENGTH) {
      requestSeqRef.current += 1;
      setSuggestions([]);
      setStatus("idle");
      setMessage("");
      return;
    }

    debounceRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS);
  };

  const handleSelectSuggestion = async (suggestion) => {
    const sessionToken = sessionTokenRef.current;
    const previousSuggestions = suggestions;
    setSuggestions([]);
    setStatus("loading");
    const response = await postJson("/api/location/retrieve", {
      id: suggestion.id,
      sessionToken,
    });
    const { data } = response;

    const result = classifyLocationResponse(response);
    if (result.kind !== "ok" || data?.lat == null || data?.lng == null) {
      // No se toca el texto ni la ubicacion: la lista vuelve para reintentar
      // (con el mismo session token) o elegir otro metodo.
      setSuggestions(previousSuggestions);
      setStatus(result.kind === "limited" ? "limited" : "unavailable");
      setMessage(
        result.kind === "ok" ? "No pudimos ubicar esa dirección. Probá con otra o elegí tu ubicación en el mapa." : result.message,
      );
      return;
    }
    sessionTokenRef.current = null; // la busqueda termino, la proxima es nueva

    // El texto de la sugerencia es corto (calle, altura y localidad); el de
    // retrieve trae provincia y codigo postal. Este texto termina en el pedido
    // de WhatsApp.
    const chosenText = suggestion.text || data.formattedAddress;
    onTextChange(chosenText);
    onResolved({ lat: data.lat, lng: data.lng }, chosenText);
    setStatus("idle");
    setMessage("");
  };

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={styles.wrap}>
      <AutoGrowTextField
        placeholder="Calle y altura"
        value={value}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(e) => handleTextChange(e.target.value)}
      />

      {status === "loading" ? <div className={styles.hint}>Buscando...</div> : null}
      {status === "limited" ? (
        <div className={styles.limited} role="status">
          {message}
        </div>
      ) : null}
      {status === "unavailable" ? <div className={styles.errorText}>{message}</div> : null}
      {status === "ok" && suggestions.length === 0 ? (
        <div className={styles.hint}>
          No encontramos esa dirección. Escribí calle y número, o elegí tu ubicación en el mapa.
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <ul ref={listRef} className={styles.suggestions}>
          {suggestions.map((s) => (
            <li key={s.id}>
              <button type="button" className={styles.suggestionBtn} onClick={() => handleSelectSuggestion(s)}>
                {s.text}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <GooglePlacesAttribution />
    </div>
  );
}
