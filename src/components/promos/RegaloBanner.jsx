import { REGALO_SUBTITLE, REGALO_TITLE } from "../../utils/regaloCampaign";
import styles from "./RegaloBanner.module.css";

// Bloque de la campaña regalo (ver utils/regaloCampaign.js). Solo se renderiza mientras la
// ventana esta activa (lo decide quien lo usa con getRegaloState).
// `message` = aviso segun el horario elegido (precio habitual, falta horario).
// title/subtitle en null (ver uso en el carrito) para no repetir el
// encabezado donde ya se mostro antes: queda solo el mensaje de estado.
export default function RegaloBanner({
  message = "",
  tone = "info",
  compact = false,
  title = REGALO_TITLE,
  subtitle = REGALO_SUBTITLE,
}) {
  return (
    <section className={`${styles.wrapper}${compact ? ` ${styles.compact}` : ""}`} aria-live="polite">
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {subtitle ? <p className={styles.sub}>{subtitle}</p> : null}
      {message ? (
        <p className={`${styles.message}${tone === "warn" ? ` ${styles.messageWarn}` : ""}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
