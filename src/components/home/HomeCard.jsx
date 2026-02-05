import { Link } from "react-router-dom";
import Card from "../ui/Card";
import styles from "./HomeCard.module.css";

export default function HomeCard({ to, title, subtitle, emoji }) {
  return (
    <Link to={to} className={styles.link}>
      <Card className={styles.card}>
        <div className={styles.title}>
          {emoji ? (
            <span className={styles.emoji} aria-hidden="true">
              {emoji}
            </span>
          ) : null}
          <span>{title}</span>
        </div>
        <div className={styles.subtitle}>{subtitle}</div>
      </Card>
    </Link>
  );
}

