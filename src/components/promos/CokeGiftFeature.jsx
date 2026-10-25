import { resolvePublicPath } from "../../utils/assetPath";
import styles from "./CokeGiftFeature.module.css";

// Destacado de la promo "doble o triple + Coca 600 de regalo". Ocupa el lugar
// de la recomendada del dia mientras la promo esta activa (ver cokePromo.js).
export default function CokeGiftFeature({ onCta }) {
  return (
    <section className={styles.wrapper} aria-labelledby="coke-gift-title">
      <p className={styles.eyebrow}>
        Domingo <span className={styles.dot} aria-hidden="true">·</span>{" "}
        <span className={styles.until}>Hasta las 21</span>
      </p>

      <div className={styles.body}>
        <div className={styles.visual} aria-hidden="true">
          <img
            className={styles.burger}
            src={resolvePublicPath("/burgers/bacon.svg")}
            alt=""
            loading="eager"
            decoding="async"
          />
          <span className={styles.plus}>+</span>
          <div className={styles.bottles}>
            <img
              className={styles.bottle}
              src={resolvePublicPath("/bebidas/coca-cola-600ml.webp")}
              alt=""
              decoding="async"
            />
            <img
              className={`${styles.bottle} ${styles.bottleBack}`}
              src={resolvePublicPath("/bebidas/coca-cola-zero-600.webp")}
              alt=""
              decoding="async"
            />
          </div>
        </div>

        <div className={styles.info}>
          <h2 id="coke-gift-title" className={styles.title}>
            Doble o triple
            <span className={styles.titleAccent}>+ Coca 600 de regalo</span>
          </h2>
          <p className={styles.desc}>Va con todas las burgers.</p>
          <button type="button" className={styles.cta} onClick={onCta}>
            Elegí tu burger
          </button>
          <p className={styles.footnote}>No incluye simples.</p>
        </div>
      </div>
    </section>
  );
}
