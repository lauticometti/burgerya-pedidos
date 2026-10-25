import { resolvePublicPath } from "../../utils/assetPath";
import styles from "./CokeGiftRecap.module.css";

// Cierre de la promo "doble/triple + Coca de regalo": cuenta lo que paso,
// hasta el fin del dia (ver isCokeGiftRecapActive en utils/cokePromo.js).
// Imagen distinta a la de la promo en vivo (una sola Coca, no el combo con
// la burger): esto ya no es una oferta, es solo el resumen de la noche.
export default function CokeGiftRecap() {
  return (
    <section className={styles.wrapper} aria-labelledby="coke-recap-title">
      <p className={styles.eyebrow}>
        Domingo <span className={styles.dot} aria-hidden="true">·</span> Cerrada
      </p>

      <div className={styles.body}>
        <img
          className={styles.bottle}
          src={resolvePublicPath("/bebidas/coca-cola-600ml.webp")}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className={styles.info}>
          <h2 id="coke-recap-title" className={styles.title}>Hoy estuvo épico</h2>
          <p className={styles.desc}>
            Agotamos casi todas las Cocas 🥤. Gracias por bancarnos a full.
          </p>
        </div>
      </div>
    </section>
  );
}
