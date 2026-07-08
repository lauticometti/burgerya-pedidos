import CloseButton from "../ui/CloseButton";
import Button from "../ui/Button";
import styles from "./RemoveIngredientsModal.module.css";
import useEscapeToClose from "../../hooks/useEscapeToClose";

export default function RemoveIngredientsModal({
  open,
  title,
  ingredients = [],
  selectedIds = [],
  forcedIds = [],
  onToggle,
  onApply,
  onClear,
  onClose,
}) {
  useEscapeToClose(open, onClose);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>{title || "Quitar ingredientes"}</div>
          <CloseButton onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className={styles.list}>
          {ingredients.map((ing) => {
            const checked = selectedIds.includes(ing.id);
            const isForced = forcedIds.includes(ing.id);
            return (
              <label
                key={ing.id}
                className={`${styles.row} ${checked ? styles.rowOn : ""} ${isForced ? styles.rowForced : ""}`}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={checked}
                  disabled={isForced}
                  onChange={() => !isForced && onToggle?.(ing.id)}
                />
                <span className={styles.name}>{ing.label}</span>
                {isForced ? <span className={styles.forcedTag}>sin stock</span> : null}
              </label>
            );
          })}
          {!ingredients.length ? (
            <div className={styles.empty}>Sin ingredientes removibles.</div>
          ) : null}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerPrimary}>
            <Button variant="primary" type="button" onClick={onApply}>
              Aplicar
            </Button>
          </div>
          <div className={styles.footerSecondary}>
            <Button type="button" onClick={onClear}>
              Limpiar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
