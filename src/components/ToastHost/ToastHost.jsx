import React from "react";
import styles from "./ToastHost.module.css";
import { toast, playToastSound } from "../../utils/toast";

export default function ToastHost() {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    return toast._subscribe((t) => {
      setItems((prev) => [...prev, t]);
      if (t.sound) playToastSound();

      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, t.ms);
    });
  }, []);

  if (!items.length) return null;

  return (
    <div className={styles.wrap} aria-live="polite" aria-atomic="true">
      {items.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${
            t.kind === "error"
              ? styles.error
              : t.kind === "promo"
                ? styles.promo
                : styles.success
          }`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

