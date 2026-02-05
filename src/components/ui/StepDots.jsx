import styles from "./StepDots.module.css";

export default function StepDots({ total = 4, active = 1, className = "" }) {
  const dots = Array.from({ length: total }, (_, i) => i + 1);
  const classes = [styles.dots, className].filter(Boolean).join(" ");

  return (
    <div className={classes} aria-hidden="true">
      {dots.map((n) => (
        <span
          key={n}
          className={`${styles.dot} ${active >= n ? styles.active : ""}`}
        />
      ))}
    </div>
  );
}

