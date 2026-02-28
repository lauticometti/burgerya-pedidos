import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../../utils/availability.js";
import styles from "../Promos.module.css";
import { TIER_LABELS, TIER_ORDER } from "../promosConfig.js";

export default function PromoBurgerPicker({
  tier,
  count,
  size,
  picked,
  allowedByTier,
  canPickMore,
  pickRef,
  onPickBurger,
  onUndoLast,
}) {
  if (!tier || !count || !size) return null;

  return (
    <div ref={pickRef}>
      <Card className={styles.card}>
        <div className={styles.rowBetween}>
          <div>
            <b>Elegi burgers</b> ({picked.length}/{count})
            <div className={styles.subtle}>Se pueden repetir.</div>
          </div>

          <Button size="sm" onClick={onUndoLast} disabled={picked.length === 0}>
            Deshacer
          </Button>
        </div>

        <div className={styles.pickGroups}>
          {TIER_ORDER.map((tierKey) => {
            const tierItems = allowedByTier[tierKey] || [];
            if (!tierItems.length) return null;
            return (
              <div key={tierKey} className={styles.pickGroup}>
                <div className={styles.pickGroupLabel}>{TIER_LABELS[tierKey]}</div>
                <div className={`${styles.row} ${styles.rowWrap} ${styles.pickRow}`}>
                  {tierItems.map((burger) => {
                    const isUnavailable = isItemUnavailable(burger);
                    const unavailableReason = getUnavailableReason(burger);
                    return (
                      <Button
                        key={burger.id}
                        onClick={() => onPickBurger(burger)}
                        disabled={!canPickMore}
                        aria-disabled={isUnavailable}
                        title={isUnavailable ? unavailableReason : undefined}
                        subLabel={isUnavailable ? unavailableReason : undefined}
                        className={isUnavailable ? styles.pickUnavailable : ""}>
                        {burger.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {picked.length === count ? (
          <div className={styles.remaining}>
            Ya elegiste las {count} burgers de tu promo.
          </div>
        ) : null}
      </Card>
    </div>
  );
}
