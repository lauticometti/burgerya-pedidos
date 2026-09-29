import { useLayoutEffect, useRef, useState } from "react";
import styles from "./StickyBar.module.css";

// El espacio reservado abajo mide lo mismo que la barra: con texto grande (o
// zoom) la barra crece a dos lineas y un alto fijo dejaba contenido tapado.
export default function StickyBar({ children }) {
  const barRef = useRef(null);
  const [barHeight, setBarHeight] = useState(null);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const measure = () => setBarHeight(bar.offsetHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        className={styles.spacer}
        style={barHeight ? { height: barHeight + 12 } : undefined}
        aria-hidden="true"
      />
      <div ref={barRef} className={styles.bar}>
        <div className={styles.inner}>{children}</div>
      </div>
    </>
  );
}
