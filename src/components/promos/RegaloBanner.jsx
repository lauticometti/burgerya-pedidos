import {
  REGALO_FOOTNOTE,
  REGALO_SUBTITLE,
  REGALO_TITLE,
} from "../../utils/regaloCampaign";
import styles from "./RegaloBanner.module.css";

// Bloque de la campaña TU REGALO 40% OFF. Solo se renderiza mientras la
// ventana esta activa (lo decide quien lo usa con getRegaloState).
// `message` = aviso segun el horario elegido (precio habitual, falta horario).
export default function RegaloBanner({ message = "", tone = "info", compact = false }) {
  return (
    <section className={`${styles.wrapper}${compact ? ` ${styles.compact}` : ""}`} aria-live="polite">
      <h2 className={styles.title}>{REGALO_TITLE}</h2>
      <p className={styles.sub}>{REGALO_SUBTITLE}</p>
      <p className={styles.footnote}>{REGALO_FOOTNOTE}</p>
      {message ? (
        <p className={`${styles.message}${tone === "warn" ? ` ${styles.messageWarn}` : ""}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
