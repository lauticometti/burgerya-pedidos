import { getArgentinaNameEntries } from "../../utils/argentinaNames";
import styles from "./ArgentinaNamesNotice.module.css";

// TEMP ARGENTINA MATCH DAY: aviso informativo sobre el cambio de nombres.
// Se apaga solo cuando ARGENTINA_NAMES_CAMPAIGN pasa a false. Revertir:
// borrar este componente y su uso en Menu.jsx / Burgers.jsx.
export default function ArgentinaNamesNotice({ className = "" }) {
  const entries = getArgentinaNameEntries();

  if (!entries.length) return null;

  return (
    <div className={`${styles.notice} ${className}`.trim()}>
      <div className={styles.title}>INGLÉS, HOY NO</div>
      <div className={styles.subtitle}>
        Por Argentina–Inglaterra, las burgers tienen nombre nuevo.{" "}
        <span className={styles.highlight}>Son las mismas de siempre.</span>
      </div>
    </div>
  );
}
