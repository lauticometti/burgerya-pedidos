import Button from "../ui/Button";
import CloseButton from "../ui/CloseButton";
import ProductName from "../ui/ProductName";
import styles from "./FriesUpgradeQtyModal.module.css";
import useEscapeToClose from "../../hooks/useEscapeToClose";
import { formatMoney } from "../../utils/formatMoney";
import {
  FRIES_UPGRADE_INCLUDES,
  FRIES_UPGRADE_LABELS,
  getFriesUpgradeUnitPrice,
} from "../../utils/friesUpgrade";

/**
 * Pregunta a cuantas unidades de una linea aplicarle (o sacarle) la mejora de
 * papas. Solo aparece cuando la linea tiene qty > 1: con una sola unidad la
 * mejora se aplica derecho desde el boton del item.
 */
export default function FriesUpgradeQtyModal({
  open,
  mode = "upgrade",
  name = "",
  nameSuffix = "",
  count = 1,
  maxCount = 1,
  onChangeCount,
  onConfirm,
  onClose,
}) {
  useEscapeToClose(open, onClose);

  if (!open) return null;

  const isUpgrade = mode === "upgrade";
  const unitPrice = getFriesUpgradeUnitPrice();
  const title = isUpgrade
    ? FRIES_UPGRADE_LABELS.askUpgrade
    : FRIES_UPGRADE_LABELS.askDowngrade;
  const confirmLabel = isUpgrade
    ? `Mejorar ${count}`
    : `Quitar mejora de ${count}`;
  const scopeLabel = isUpgrade
    ? `Mejorar ${count} de ${maxCount}`
    : `Dejar normales ${count} de ${maxCount}`;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <CloseButton onClick={onClose} aria-label="Cerrar" />
        </div>

        {name ? (
          <ProductName
            as="div"
            className={styles.subtitle}
            name={name}
            suffix={nameSuffix}
          />
        ) : null}

        <div className={styles.stepper}>
          <Button
            size="sm"
            onClick={() => onChangeCount?.(count - 1)}
            disabled={count <= 1}
            aria-label="Restar una">
            -
          </Button>
          <span className={styles.count}>{count}</span>
          <Button
            size="sm"
            onClick={() => onChangeCount?.(count + 1)}
            disabled={count >= maxCount}
            aria-label="Sumar una">
            +
          </Button>
        </div>

        <div className={styles.scope}>{scopeLabel}</div>

        {isUpgrade ? (
          <div className={styles.detail}>
            {FRIES_UPGRADE_INCLUDES.join(" + ")}
            {unitPrice > 0
              ? ` · ${formatMoney(unitPrice)} por burger`
              : " · Sin cargo"}
          </div>
        ) : null}

        <div className={styles.actions}>
          <Button variant="primary" type="button" onClick={() => onConfirm?.(count)}>
            {confirmLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
