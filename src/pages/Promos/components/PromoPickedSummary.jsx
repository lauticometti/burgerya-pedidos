import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import Pill from "../../../components/ui/Pill.jsx";
import { formatMoney } from "../../../utils/formatMoney.js";
import styles from "../Promos.module.css";

export default function PromoPickedSummary({
  tier,
  count,
  size,
  picked,
  price,
  remainingText,
  onRemovePick,
  onAddPromoToCart,
}) {
  if (!tier || !count || !size) return null;

  const unitPrice = price && count ? price / count : null;

  return (
    <>
      <Card className={styles.card}>
        <div className={styles.sectionTitle}>Elegidas</div>
        <div className={styles.picksWrap}>
          {picked.length === 0 ? (
            <div className={styles.empty}>-</div>
          ) : (
            picked.map((pick, index) => {
              const name = pick.name || pick.id;
              return (
                <Pill key={`${name}-${index}`} active className={styles.pickPill}>
                  <span>{name}</span>
                  <button
                    type="button"
                    className={styles.pickRemove}
                    aria-label={`Quitar ${name}`}
                    onClick={() => onRemovePick(index)}>
                    x
                  </button>
                </Pill>
              );
            })
          )}
        </div>
      </Card>

      <Card>
        <div className={styles.rowBetween}>
          <div>
            <div className={styles.subtle}>Listo para agregar</div>
            <div className={styles.totalPrice}>{formatMoney(price ?? 0)}</div>
            {unitPrice ? (
              <div className={styles.subtle}>
                {formatMoney(unitPrice)} c/u · {count} burgers
              </div>
            ) : null}
          </div>

          <Button
            variant="primary"
            type="button"
            onClick={onAddPromoToCart}
            disabled={picked.length !== count}
            subLabel={remainingText}>
            Agregar promo
          </Button>
        </div>
      </Card>
    </>
  );
}
