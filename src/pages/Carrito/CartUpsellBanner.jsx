import Button from "../../components/ui/Button";
import styles from "./CartUpsellBanner.module.css";

export function shouldShowBebidaUpsell(items) {
  let hasBurger = false;
  let hasBebida = false;
  for (const item of items) {
    const type = item.meta?.type;
    if (type === "burger" || type === "promo") hasBurger = true;
    if (type === "bebida") hasBebida = true;
  }
  return hasBurger && !hasBebida;
}

export default function CartUpsellBanner({ items, onAddBebida, disabled }) {
  if (!shouldShowBebidaUpsell(items)) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.text}>
        <strong>No arranques el partido sin una Coca bien fría.</strong>
      </div>
      <Button
        size="sm"
        variant="primary"
        onClick={onAddBebida}
        disabled={disabled}>
        Agregar bebida
      </Button>
    </div>
  );
}
