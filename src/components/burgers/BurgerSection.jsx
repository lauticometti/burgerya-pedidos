import styles from "./BurgerSection.module.css";

const VARIANT_CLASS = {
  BASICA: styles.basic,
  PREMIUM: styles.premium,
  DELUXE: styles.deluxe,
  ESPECIAL: styles.especial,
};

export default function BurgerSection({ title, variant, children }) {
  const variantClass = VARIANT_CLASS[variant] || "";

  return (
    <section className={`${styles.section} ${variantClass}`.trim()}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.list}>{children}</div>
    </section>
  );
}

