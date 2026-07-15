import { getTodaySchedule } from "../../utils/storeClosedMode";
import styles from "./TodayScheduleLine.module.css";

export default function TodayScheduleLine() {
  const { dayLabel, ranges, isClosed } = getTodaySchedule();

  const desktopText = isClosed
    ? `${dayLabel} · CERRADO`
    : `${dayLabel} ${ranges.join(" · ")}`;

  const mobileText = isClosed
    ? `${dayLabel} · CERRADO`
    : ranges.length > 1
      ? `${dayLabel} · ${ranges.join(" / ")}`
      : `${dayLabel} ${ranges[0]}`;

  return (
    <div className={styles.line}>
      <span className={styles.desktop}>{desktopText}</span>
      <span className={styles.mobile}>{mobileText}</span>
    </div>
  );
}
