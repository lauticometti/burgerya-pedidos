import React from "react";
import Button from "../ui/Button";
import CloseButton from "../ui/CloseButton";
import useEscapeToClose from "../../hooks/useEscapeToClose";
import { resolvePublicPath } from "../../utils/assetPath";
import {
  COKE_PROMO_VARIETIES,
  hasCokePromoVarietyStock,
} from "../../utils/cokePromo";
import { bebidas } from "../../data/menu";
import styles from "./CokePromoModal.module.css";
import baseStyles from "../ItemExtrasModal.module.css";

const SIZE_LABELS = { doble: "doble", triple: "triple" };

export default function CokePromoModal({
  open,
  burgerName = "",
  size = "",
  expired = false,
  selectedVariety,
  onSelectVariety,
  onConfirm,
  onAddWithoutGift,
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

  const canConfirm = Boolean(selectedVariety && hasCokePromoVarietyStock(selectedVariety));
  const sizeLabel = SIZE_LABELS[size] || "burger";
  const burgerLabel = [burgerName, SIZE_LABELS[size]].filter(Boolean).join(" ");

  if (expired) {
    return (
      <div className={baseStyles.backdrop} onMouseDown={onClose}>
        <div
          className={baseStyles.card}
          onMouseDown={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true">
          <div className={baseStyles.header}>
            <div>
              <div className={baseStyles.title}>La promo terminó a las 21</div>
              <div className={baseStyles.desc}>
                {burgerLabel ? `Tu ${burgerLabel}` : "Tu burger"} sigue a su precio
                habitual, sin Coca de regalo. ¿La agregamos igual?
              </div>
            </div>
            <CloseButton onClick={onClose} aria-label="Cerrar" />
          </div>
          <div className={`${baseStyles.footer} ${styles.expiredFooter}`}>
            <Button type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="button" onClick={onAddWithoutGift}>
              Agregar igual
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={baseStyles.backdrop} onMouseDown={onClose}>
      <div
        className={baseStyles.card}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <div className={baseStyles.header}>
          <div>
            <div className={baseStyles.title}>
              Tu {sizeLabel} incluye una Coca 600 de regalo
            </div>
            <div className={baseStyles.desc}>
              Elegí cuál querés. Una por burger, hasta las 21.
            </div>
          </div>
          <CloseButton onClick={onClose} aria-label="Cerrar" />
        </div>

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

        <div className={baseStyles.footer}>
          <Button
            variant="primary"
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}>
            Agregar {sizeLabel} + Coca de regalo
          </Button>
        </div>
      </div>
    </div>
  );
}
