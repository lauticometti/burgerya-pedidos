import styles from "./BurgerSection.module.css";

const VARIANT_CLASS = {
  BASICA: styles.basic,
  PREMIUM: styles.premium,
  DELUXE: styles.deluxe,
  ESPECIAL: styles.especial,
};

export default function BurgerSection({
  title,
  variant,
  badgeText = "",
  children,
}) {
  const variantClass = VARIANT_CLASS[variant] || "";
  const showBadge = Boolean(badgeText);

  return (
    <section className={`${styles.section} ${variantClass}`.trim()}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
          {showBadge ? (
            <span className={styles.sectionBadge}>{badgeText}</span>
          ) : null}
        </div>
      </div>
      <div className={styles.list}>{children}</div>
    </section>
  );
}

