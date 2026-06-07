import styles from "./BurgerNotice.module.css";

/**
 * Chip informativo para avisos temporales por producto.
 * Reusable: recibe el texto (`burger.notice`) y no conoce ninguna burger en particular.
 * Ejemplos: "Hoy sin pepinos", "Sin bacon hoy", "Stock limitado", "Solo doble".
 */
export default function BurgerNotice({ notice, className = "" }) {
  if (!notice) return null;
  return (
    <span className={`${styles.notice} ${className}`}>
      <span className={styles.dot} aria-hidden="true" />
      {notice}
    </span>
  );
}
