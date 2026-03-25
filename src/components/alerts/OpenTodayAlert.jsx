import styles from "./OpenTodayAlert.module.css";

const HOLIDAY_OPEN_DATES = [];

function getTodayKey() {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(new Date());
  } catch (err) {
    // Fallback sin timezone explicita
    return new Date().toISOString().slice(0, 10);
  }
}

export default function OpenTodayAlert() {
  const today = getTodayKey();
  const isActive = HOLIDAY_OPEN_DATES.includes(today);
  if (!isActive) return null;

  return (
    <div className={styles.alert} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden />
      <div className={styles.text} />
    </div>
  );
}
