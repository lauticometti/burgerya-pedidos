import { useEffect, useState } from "react";
import { getFlash15EndTimestamp } from "../../utils/storeClosedMode";
import styles from "./Flash15Banner.module.css";

function getRemainingSeconds() {
  return Math.max(Math.round((getFlash15EndTimestamp() - Date.now()) / 1000), 0);
}

// "1:04:30" con horas, "4:30" sin. Ancho estable (tabular-nums en el CSS)
// para que no salte al cambiar de dígito.
function formatRemaining(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

// Banner de la promo flash 30% off (ver utils/storeClosedMode.js para la
// ventana de fecha/hora). Solo se renderiza mientras isFlash15Active esté
// prendido — lo decide quien lo usa con useStoreStatus(). La cuenta
// regresiva corre acá misma, segundo a segundo, con timer propio: el reloj
// que usa el resto del sitio solo tickea una vez por minuto.
export default function Flash15Banner() {
  const [remainingSeconds, setRemainingSeconds] = useState(getRemainingSeconds);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemainingSeconds(getRemainingSeconds());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className={styles.wrapper} aria-live="polite">
      <div className={styles.text}>
        <p className={styles.title}>30% OFF en simples y dobles</p>
        <p className={styles.sub}>Todas las burgers · Solo por hoy</p>
      </div>
      <div className={styles.countdown}>
        <span className={styles.countdownLabel}>Termina en</span>
        <span className={styles.countdownValue}>{formatRemaining(remainingSeconds)}</span>
      </div>
    </section>
  );
}
