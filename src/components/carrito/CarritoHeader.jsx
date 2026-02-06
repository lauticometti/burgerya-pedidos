import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import styles from "./CarritoHeader.module.css";

export default function CarritoHeader({ onClear }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timeoutId = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(timeoutId);
  }, [confirming]);

  function handleClear() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    if (onClear) onClear();
  }

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <Link to="/">
          <Button>Volver</Button>
        </Link>
        <div className={styles.clearWrap}>
          <Button onClick={handleClear}>Vaciar</Button>
          {confirming ? (
            <div className={styles.clearHint}>
              Toca nuevamente
              <br />
              para vaciar.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
