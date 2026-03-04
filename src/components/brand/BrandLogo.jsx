import { Link } from "react-router-dom";
import styles from "./BrandLogo.module.css";

export default function BrandLogo() {
  function scrollToTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className={styles.wrap}>
      <Link
        to="/"
        className={styles.link}
        onClick={scrollToTop}
        aria-label="Volver al menú de burgers">
        <div className={styles.text}>burger ya.</div>
      </Link>
    </div>
  );
}
