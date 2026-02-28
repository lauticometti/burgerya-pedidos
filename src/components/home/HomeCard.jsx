import { Link } from "react-router-dom";
import Card from "../ui/Card";
import styles from "./HomeCard.module.css";

const IMAGE_POSITION_CLASSES = {
  burgers: styles.mediaImagePosBurgers,
  promos: styles.mediaImagePosPromos,
};

export default function HomeCard({
  to,
  title,
  subtitle,
  emoji,
  imageSrc,
  imageAlt,
  imagePositionKey,
}) {
  const imagePositionClass = imagePositionKey
    ? IMAGE_POSITION_CLASSES[imagePositionKey] || ""
    : "";

  return (
    <Link to={to} className={styles.link}>
      <Card
        className={`${styles.card} ${
          imageSrc ? styles.cardWithImage : styles.cardPlain
        }`}>
        {imageSrc ? (
          <div className={styles.mediaWrap}>
            <img
              className={`${styles.mediaImage} ${imagePositionClass}`}
              src={imageSrc}
              alt={imageAlt || title}
              loading="lazy"
              decoding="async"
            />
            <div className={styles.mediaOverlay} />
            <div className={styles.mediaText}>
              <div className={styles.title}>
                {emoji ? (
                  <span className={styles.emoji} aria-hidden="true">
                    {emoji}
                  </span>
                ) : null}
                <span>{title}</span>
              </div>
              <div className={styles.subtitle}>{subtitle}</div>
            </div>
          </div>
        ) : (
          <div className={styles.body}>
            <div className={styles.title}>
              {emoji ? (
                <span className={styles.emoji} aria-hidden="true">
                  {emoji}
                </span>
              ) : null}
              <span>{title}</span>
            </div>
            <div className={styles.subtitle}>{subtitle}</div>
          </div>
        )}
      </Card>
    </Link>
  );
}
