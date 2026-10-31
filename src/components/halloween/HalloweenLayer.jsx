import { useEffect } from "react";
import { isHalloweenActive } from "./halloweenConfig";
import styles from "./HalloweenLayer.module.css";

function Bat({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 28" aria-hidden="true">
      <path
        className={styles.wings}
        d="M32 9c-1.6-3-3-4-3-4l-.6 3.2C24 6 19 2 10 1c3 3 4 7 3.4 10.6C9 10 4 11 0 14c5 0 9 1.6 11 5 2-2.6 6-3.6 9-2.6 1.6 2 4.4 4 7.6 6.6.8-2 2.4-3 4.4-3s3.6 1 4.4 3c3.2-2.6 6-4.6 7.6-6.6 3-1 7 0 9 2.6 2-3.4 6-5 11-5-4-3-9-4-13.4-2.4C50 8 51 4 54 1c-9 1-14 5-18.4 7.2L35 5s-1.4 1-3 4z"
      />
    </svg>
  );
}

export default function HalloweenLayer() {
  const active = isHalloweenActive();

  useEffect(() => {
    if (!active) return undefined;
    const root = document.documentElement;
    root.classList.add("halloween");
    return () => root.classList.remove("halloween");
  }, [active]);

  if (!active) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.glow} />
      <div className={styles.fog} />
      <div className={styles.spider}>
        <span className={styles.thread} />
        <svg className={styles.spiderBody} viewBox="0 0 40 40">
          <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path d="M14 18 6 12 3 16M14 21 4 21 2 26M15 24 7 29 6 34M17 26 13 33 14 38" />
            <path d="M26 18 34 12 37 16M26 21 36 21 38 26M25 24 33 29 34 34M23 26 27 33 26 38" />
          </g>
          <ellipse cx="20" cy="17" rx="4.2" ry="4" fill="currentColor" />
          <ellipse cx="20" cy="25" rx="6.4" ry="7.2" fill="currentColor" />
          <circle cx="18.4" cy="16.4" r="0.9" fill="#ffffff" />
          <circle cx="21.6" cy="16.4" r="0.9" fill="#ffffff" />
        </svg>
      </div>
      <Bat className={`${styles.bat} ${styles.batA}`} />
      <Bat className={`${styles.bat} ${styles.batB}`} />
    </div>
  );
}
