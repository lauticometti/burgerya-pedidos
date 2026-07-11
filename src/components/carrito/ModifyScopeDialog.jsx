import Button from "../ui/Button";
import CloseButton from "../ui/CloseButton";
import styles from "./ModifyScopeDialog.module.css";
import useEscapeToClose from "../../hooks/useEscapeToClose";

export default function ModifyScopeDialog({ open, label, onChooseOne, onChooseAll, onClose }) {
  useEscapeToClose(open, onClose);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label="¿A cuáles querés modificar?"
        onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>¿A cuáles querés modificar?</div>
          <CloseButton onClick={onClose} aria-label="Cerrar" />
        </div>
        {label ? <div className={styles.subtitle}>{label}</div> : null}
        <div className={styles.actions}>
          <Button variant="primary" type="button" onClick={onChooseOne}>
            Modificar una
          </Button>
          <Button type="button" onClick={onChooseAll}>
            Modificar todas
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
