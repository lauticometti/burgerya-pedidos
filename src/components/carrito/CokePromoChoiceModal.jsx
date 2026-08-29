import React from "react";
import Button from "../ui/Button";
import CloseButton from "../ui/CloseButton";
import useEscapeToClose from "../../hooks/useEscapeToClose";
import { resolvePublicPath } from "../../utils/assetPath";
import { COKE_PROMO_VARIETIES, hasCokePromoVarietyStock } from "../../utils/cokePromo";
import { bebidas } from "../../data/menu";
import { formatMoney } from "../../utils/formatMoney";
import styles from "./CokePromoChoiceModal.module.css";
import baseStyles from "../ItemExtrasModal.module.css";

export default function CokePromoChoiceModal({
  open,
  dailyPriceTriple,
  normalPriceTriple,
  selectedVariety,
  onSelectVariety,
  onChooseDiscounted,
  onChooseNormalWithCoke,
  onClose,
}) {
  useEscapeToClose(open, onClose);

  const bebidasById = React.useMemo(() => {
    const idx = {};
    for (const bebida of bebidas) {
      idx[bebida.id] = bebida;
    }
    return idx;
  }, []);

  if (!open) return null;

  const varieties = Object.keys(COKE_PROMO_VARIETIES).map((varietyId) => ({
    varietyId,
    ...COKE_PROMO_VARIETIES[varietyId],
    bebida: bebidasById[varietyId],
    hasStock: hasCokePromoVarietyStock(varietyId),
  }));

  const canChooseNormal = Boolean(selectedVariety && hasCokePromoVarietyStock(selectedVariety));

  return (
    <div className={baseStyles.backdrop} onMouseDown={onClose}>
      <div
        className={baseStyles.card}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <div className={baseStyles.header}>
          <div>
            <div className={baseStyles.title}>Esta burger ya tiene descuento</div>
            <div className={baseStyles.desc}>
              Las promociones no son acumulables. Elegí cuál preferís.
            </div>
          </div>
          <CloseButton onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className={styles.optionsList}>
          {/* Opción 1: Mantener precio del día */}
          <button
            type="button"
            className={styles.optionButton}
            onClick={onChooseDiscounted}>
            <div className={styles.optionHeader}>
              <div className={styles.optionTitle}>Mantener precio del día</div>
              <div className={styles.optionPrice}>{formatMoney(dailyPriceTriple)}</div>
            </div>
            <div className={styles.optionSub}>Sin Coca gratis</div>
          </button>

          {/* Opción 2: Precio normal + Coca gratis */}
          <div className={styles.optionSection}>
            <div className={styles.optionSectionTitle}>Triple + Coca gratis — {formatMoney(normalPriceTriple)}</div>
            <div className={styles.optionSectionSub}>Elegí Original o Zero</div>

            {/* Selector de variedad de Coca */}
            <div className={styles.varietiesList}>
              {varieties.map(({ varietyId, name, hasStock, bebida }) => {
                const isSelected = selectedVariety === varietyId;
                const isDisabled = !hasStock;

                return (
                  <button
                    key={varietyId}
                    type="button"
                    className={`${styles.varietyOption} ${isSelected ? styles.varietyOptionSelected : ""} ${isDisabled ? styles.varietyOptionDisabled : ""}`}
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        onSelectVariety(varietyId);
                      }
                    }}
                    aria-pressed={isSelected}
                    aria-disabled={isDisabled}>
                    {bebida?.img ? (
                      <div className={styles.varietyImg}>
                        <img
                          src={resolvePublicPath(bebida.img)}
                          alt={name}
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <div className={styles.varietyInfo}>
                      <div className={styles.varietyName}>{name}</div>
                      {isDisabled ? (
                        <div className={styles.varietyAgotada}>Agotada</div>
                      ) : null}
                    </div>
                    {isSelected && !isDisabled ? (
                      <svg
                        className={styles.varietyCheckmark}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {canChooseNormal ? (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={onChooseNormalWithCoke}
                className={styles.confirmButton}>
                Agregar triple + Coca gratis
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
