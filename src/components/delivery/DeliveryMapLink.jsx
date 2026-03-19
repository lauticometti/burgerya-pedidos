import { Link } from "react-router-dom";
import styles from "./DeliveryMapLink.module.css";

export default function DeliveryMapLink({
  variant = "default",
  className = "",
}) {
  const classes = [
    styles.card,
    variant === "compact" ? styles.compact : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link to="/envios" className={classes}>
      <div className={styles.texts}>
        <span className={styles.kicker}>Zonas de entrega</span>
        <span className={styles.title}>Revisa si llegamos a tu direccion</span>
        <span className={styles.caption}>
          Abri el mapa, busca tu calle y conoce el costo orientativo del envio.
        </span>
      </div>
      <span className={styles.cta}>Ver mapa</span>
    </Link>
  );
}
