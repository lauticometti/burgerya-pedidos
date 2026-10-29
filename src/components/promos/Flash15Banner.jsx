import styles from "./Flash15Banner.module.css";

// Cuenta regresiva en base a los minutos que quedan (useStoreStatus ya
// re-renderiza este componente cada minuto, así que no hace falta timer propio).
function formatRemaining(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Banner de la promo flash 15% off (ver utils/storeClosedMode.js para la
// ventana de fecha/hora). Solo se renderiza mientras isFlash15Active esté
// prendido — lo decide quien lo usa con useStoreStatus().
export default function Flash15Banner({ remainingMinutes }) {
  return (
    <section className={styles.wrapper} aria-live="polite">
      <span className={styles.bolt} aria-hidden="true">⚡</span>
      <div className={styles.text}>
        <p className={styles.title}>15% OFF en simples y dobles</p>
        <p className={styles.sub}>Todas las burgers · Solo por hoy</p>
      </div>
      <div className={styles.countdown}>
        <span className={styles.countdownLabel}>Termina en</span>
        <span className={styles.countdownValue}>{formatRemaining(remainingMinutes)}</span>
      </div>
    </section>
  );
}
