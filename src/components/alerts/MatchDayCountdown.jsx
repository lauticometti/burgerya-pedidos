import { useStoreStatus } from "../../utils/storeClosedMode";
import styles from "./MatchDayCountdown.module.css";

// TEMP ARGENTINA MATCH DAY FINAL: contador aparte, visible antes de abrir y
// en los últimos minutos antes del cierre de mediodía. Se actualiza solo
// (mismo reloj de useStoreStatus, sin timers propios). Revertir mañana 20/7:
// borrar este componente y su uso en Page.jsx.
export default function MatchDayCountdown() {
  const { matchDayCountdown } = useStoreStatus();

  if (!matchDayCountdown) return null;

  return (
    <div className={styles.countdown} role="status">
      <span className={styles.label}>{matchDayCountdown.label}</span>
      <span className={styles.value}>{matchDayCountdown.value}</span>
    </div>
  );
}
