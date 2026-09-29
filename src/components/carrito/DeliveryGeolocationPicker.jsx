import React from "react";
import { CrosshairIcon } from "../ui/icons";
import { startGeolocationSampling } from "../../utils/geolocationAccuracy";
import styles from "./DeliveryGeolocationPicker.module.css";

// Usa navigator.geolocation directo (via startGeolocationSampling: varias
// lecturas de alta precision durante unos segundos, se queda con la mejor).
// A proposito NUNCA llama a nuestros endpoints ni decide delivery por su
// cuenta: entrega la mejor lectura con su `accuracy` (onFix) y el componente
// padre decide segun la precision. Cero costo de Google.
export default function DeliveryGeolocationPicker({ onStart, onFix }) {
  const [status, setStatus] = React.useState("idle"); // idle | loading | error
  const [errorMessage, setErrorMessage] = React.useState("");
  const stopRef = React.useRef(null);

  React.useEffect(() => () => stopRef.current?.(), []);

  const handleClick = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Tu navegador no permite compartir ubicación.");
      return;
    }

    // Los navegadores solo dejan pedir la ubicacion en conexiones seguras
    // (https o localhost). Por http desde otro dispositivo ni siquiera
    // muestran el cartel de permiso: devuelven "denegado" directo. Avisamos
    // la causa real en vez de culpar al usuario.
    if (window.isSecureContext === false) {
      setStatus("error");
      setErrorMessage(
        "Para usar tu ubicación hace falta abrir la página con conexión segura (https). Podés buscar tu dirección o marcarla en el mapa.",
      );
      return;
    }

    // Nunca dejar una cotizacion vieja pegada mientras se resuelve una nueva.
    onStart();
    setStatus("loading");
    setErrorMessage("");

    stopRef.current = startGeolocationSampling({
      geolocation: navigator.geolocation,
      onResult: (fix) => {
        setStatus("idle");
        onFix(fix);
      },
      onError: ({ permissionDenied }) => {
        setStatus("error");
        setErrorMessage(
          permissionDenied
            ? "No tenemos permiso para usar tu ubicación. Activalo en los ajustes del navegador para este sitio, o buscá tu dirección / marcala en el mapa."
            : "No pudimos obtener tu ubicación. Probá con otro método.",
        );
      },
    });
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.button}
        onClick={handleClick}
        disabled={status === "loading"}>
        <CrosshairIcon />
        <span>{status === "loading" ? "Buscando tu ubicación..." : "Usar mi ubicación actual"}</span>
      </button>
      {status === "error" ? <div className={styles.error}>{errorMessage}</div> : null}
    </div>
  );
}
