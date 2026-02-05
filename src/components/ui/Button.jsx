import styles from "./Button.module.css";

export default function Button({
  children,
  subLabel,
  variant = "ghost",
  size = "md",
  isActive = false,
  className = "",
  type = "button",
  ...props
}) {
  const classes = [
    styles.button,
    variant === "primary" ? styles.primary : "",
    isActive ? styles.active : "",
    size === "sm" ? styles.sizeSm : "",
    size === "xs" ? styles.sizeXs : "",
    subLabel ? styles.hasSubLabel : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      <span className={styles.label}>{children}</span>
      {subLabel ? <span className={styles.subLabel}>{subLabel}</span> : null}
    </button>
  );
}

