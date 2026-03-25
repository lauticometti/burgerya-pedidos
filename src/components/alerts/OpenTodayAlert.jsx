import styles from "./OpenTodayAlert.module.css";

const HOLIDAY_OPEN_DATES = ["2026-03-23", "2026-03-24"];

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

  const firstDay = HOLIDAY_OPEN_DATES[0];
  const secondDay = HOLIDAY_OPEN_DATES[1];

  const message =
    today === firstDay
      ? "Hoy y mañana (lu 23 y ma 24) abrimos de 20:00 a 00:00 por feriado."
      : today === secondDay
        ? "Hoy (ma 24) abrimos de 20:00 a 00:00 por feriado."
        : "";

  if (!message) return null;

  return (
    <div className={styles.alert} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden />
      <div className={styles.text}>{message}</div>
    </div>
  );
}
