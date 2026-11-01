import styles from "./Flash15Banner.module.css";

// Reemplaza al Flash15Banner cuando la promo se corta antes de horario (se
// vendió todo) — ver isFlash15SoldOut en utils/storeClosedMode.js. Mismos
// estilos que el banner del flash, sin cuenta regresiva.
export default function PromoSoldOutBanner() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.text}>
        <p className={styles.title}>Promo sold out</p>
        <p className={styles.sub}>Seguimos hasta las 00hs</p>
      </div>
    </section>
  );
}
