import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import { formatMoney } from "../../../utils/formatMoney.js";
import styles from "../Promos.module.css";
import { ORDERED_PROMO_OPTIONS } from "../promosConfig.js";

export default function PromoFilters({
  tier,
  count,
  size,
  price,
  showSavings,
  pickedTotal,
  savingsValue,
  countRef,
  sizeRef,
  onChooseTier,
  onChooseCount,
  onChooseSize,
}) {
  return (
    <>
      <Card className={styles.card}>
        <div className={styles.sectionTitle}>Elegi promo</div>
        <div className={`${styles.row} ${styles.rowWrap}`}>
          {ORDERED_PROMO_OPTIONS.map((option) => (
            <Button
              key={option.tier}
              isActive={tier === option.tier}
              onClick={() => onChooseTier(option.tier)}>
              {option.label}
            </Button>
          ))}
        </div>
      </Card>

      {tier ? (
        <div ref={countRef}>
          <Card className={styles.card}>
            <div className={styles.sectionTitle}>Cuantas burgers?</div>
            <div className={`${styles.row} ${styles.rowWrap}`}>
              {[2, 3, 4].map((n) => (
                <Button key={n} isActive={count === n} onClick={() => onChooseCount(n)}>
                  {n}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {tier && count ? (
        <div ref={sizeRef}>
          <Card className={styles.card}>
            <div className={styles.sectionTitle}>Dobles o triples?</div>
            <div className={`${styles.row} ${styles.rowWrap}`}>
              {["doble", "triple"].map((s) => (
                <Button key={s} isActive={size === s} onClick={() => onChooseSize(s)}>
                  {s === "doble" ? "Dobles" : "Triples"}
                </Button>
              ))}
            </div>

            {size && price != null ? (
              <div className={styles.price}>
                <b>Precio promo:</b> {formatMoney(price)}
                {count ? (
                  <span className={styles.unitPrice}>
                    · {formatMoney(price / count)} c/u
                  </span>
                ) : null}
                {showSavings ? (
                  <div className={styles.savings}>
                    <span>Comprar sueltas: {formatMoney(pickedTotal)}</span>
                    <span
                      className={
                        savingsValue >= 0 ? styles.savingsPositive : styles.savingsNegative
                      }>
                      {savingsValue >= 0
                        ? `Ahorras ${formatMoney(savingsValue)}`
                        : `Promo +${formatMoney(Math.abs(savingsValue))}`}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}
    </>
  );
}
