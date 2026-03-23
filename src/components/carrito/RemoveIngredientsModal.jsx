import CloseButton from "../ui/CloseButton";
import Button from "../ui/Button";
import styles from "./RemoveIngredientsModal.module.css";

export default function RemoveIngredientsModal({
  open,
  title,
  ingredients = [],
  selectedIds = [],
  onToggle,
  onApply,
  onClose,
}) {
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
            return (
              <label
                key={ing.id}
                className={`${styles.row} ${checked ? styles.rowOn : ""}`}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={checked}
                  onChange={() => onToggle?.(ing.id)}
                />
                <span className={styles.name}>{ing.label}</span>
              </label>
            );
          })}
          {!ingredients.length ? (
            <div className={styles.empty}>Sin ingredientes removibles.</div>
          ) : null}
        </div>

        <div className={styles.footer}>
          <Button type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="button" onClick={onApply}>
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
