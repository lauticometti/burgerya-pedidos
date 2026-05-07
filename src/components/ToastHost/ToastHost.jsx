import React from "react";
import styles from "./ToastHost.module.css";
import { toast, playToastSound } from "../../utils/toast";

function IconBag() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}


function ToastItem({ t, onDismiss }) {
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    timerRef.current = window.setTimeout(onDismiss, t.ms);
    return () => clearTimeout(timerRef.current);
  }, []);

  const kindClass = t.kind === "error" ? styles.error
    : t.kind === "promo" ? styles.promo
    : styles.success;

  return (
    <div className={`${styles.toast} ${kindClass}`}>
      <div className={styles.row}>
        <div className={styles.iconWrap} aria-hidden>
          <IconBag />
        </div>
        <div className={styles.textWrap}>
          <div className={styles.title}>{t.message}</div>
          {t.subtitle ? <div className={styles.subtitle}>{t.subtitle}</div> : null}
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onDismiss}
          aria-label="Cerrar">
          <IconX />
        </button>
      </div>

    </div>
  );
}

export default function ToastHost() {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    return toast._subscribe((t) => {
      if (t.sound) playToastSound();
      setItems((prev) => {
        if (t.replaceGroup) {
          // Reemplazar cualquier toast existente del mismo grupo
          const filtered = prev.filter((x) => x.replaceGroup !== t.replaceGroup);
          return [...filtered, t];
        }
        return [...prev, t];
      });
    });
  }, []);

  if (!items.length) return null;

  return (
    <div className={styles.wrap} aria-live="polite">
      {items.map((t) => (
        <ToastItem
          key={t.id}
          t={t}
          onDismiss={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
        />
      ))}
    </div>
  );
}
