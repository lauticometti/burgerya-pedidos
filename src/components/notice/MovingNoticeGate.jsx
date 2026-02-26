import { useEffect } from "react";
import Button from "../ui/Button";
import { resolvePublicPath } from "../../utils/assetPath";
import styles from "./MovingNoticeGate.module.css";

export default function MovingNoticeGate({ onContinue }) {
  const heroImageUrl = resolvePublicPath("/home/card-burgers-home-foto.jpg");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="moving-notice-title">
      <section className={styles.panel}>
        <div
          className={styles.hero}
          role="img"
          aria-label="Burger de Burgerya en primer plano">
          <img
            className={styles.heroImage}
            src={heroImageUrl}
            alt=""
            aria-hidden="true"
            loading="eager"
          />
          <h1 id="moving-notice-title" className={styles.title}>
            NOS ESTAMOS
            <br />
            MUDANDO
          </h1>
        </div>

        <div className={styles.content}>
          <p className={styles.messageMain}>Hoy no estamos tomando pedidos.</p>
          <p className={styles.messageSub}>Volvemos el sabado 28/2.</p>

          <Button variant="primary" className={styles.cta} onClick={onContinue}>
            Ver el menu
          </Button>
        </div>
      </section>
    </div>
  );
}
