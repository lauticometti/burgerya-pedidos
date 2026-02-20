import styles from "./BurgerSection.module.css";

const VARIANT_CLASS = {
  BASICA: styles.basic,
  PREMIUM: styles.premium,
  DELUXE: styles.deluxe,
  ESPECIAL: styles.especial,
};

const TRIPLE_HINT_VARIANTS = new Set(["BASICA", "PREMIUM"]);

export default function BurgerSection({ title, variant, children }) {
  const variantClass = VARIANT_CLASS[variant] || "";
  const showTripleHint = TRIPLE_HINT_VARIANTS.has(variant);

  return (
    <section className={`${styles.section} ${variantClass}`.trim()}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
          {showTripleHint ? (
            <span className={styles.tripleHint}>Hoy conviene triples</span>
          ) : null}
        </div>
      </div>
      <div className={styles.list}>{children}</div>
    </section>
  );
}

