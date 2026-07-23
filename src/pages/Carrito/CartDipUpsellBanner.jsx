import { dips } from "../../data/menu";
import { isItemUnavailable } from "../../utils/availability";
import { createDipItem } from "../../utils/cartItemBuilders";
import { formatMoney } from "../../utils/formatMoney";
import Button from "../../components/ui/Button";
import styles from "./CartDipUpsellBanner.module.css";

const DIP_ID = "dip_mil_islas";

export function shouldShowDipUpsell(items) {
  let hasBurger = false;
  let hasDip = false;
  for (const item of items) {
    const type = item.meta?.type;
    if (type === "burger" || type === "promo") hasBurger = true;
    if (type === "dip") hasDip = true;
  }
  return hasBurger && !hasDip;
}

export default function CartDipUpsellBanner({ items, onAddDip }) {
  const dip = dips.find((item) => item.id === DIP_ID);
  if (!dip || isItemUnavailable(dip)) return null;
  if (!shouldShowDipUpsell(items)) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.text}>
        <strong>¿Con qué vas a comer las papas?</strong>
        <span>
          Nuestra salsa secreta no la encontrás en otro lado. Solo {formatMoney(dip.price)}
        </span>
      </div>
      <Button
        size="sm"
        variant="primary"
        onClick={() => onAddDip(createDipItem(dip))}>
        Agregar dip
      </Button>
    </div>
  );
}
