import {
  REGALO_FOOTNOTE,
  REGALO_SUBTITLE,
  REGALO_TITLE,
} from "../../utils/regaloCampaign";
import styles from "./RegaloBanner.module.css";

// Bloque de la campaña regalo (ver utils/regaloCampaign.js). Solo se renderiza mientras la
// ventana esta activa (lo decide quien lo usa con getRegaloState).
// `message` = aviso segun el horario elegido (precio habitual, falta horario).
export default function RegaloBanner({
  message = "",
  tone = "info",
  compact = false,
  title = REGALO_TITLE,
  subtitle = REGALO_SUBTITLE,
  footnote = REGALO_FOOTNOTE,
}) {
  return (
    <section className={`${styles.wrapper}${compact ? ` ${styles.compact}` : ""}`} aria-live="polite">
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.sub}>{subtitle}</p>
      {footnote ? <p className={styles.footnote}>{footnote}</p> : null}
      {message ? (
        <p className={`${styles.message}${tone === "warn" ? ` ${styles.messageWarn}` : ""}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
