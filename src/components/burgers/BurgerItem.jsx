import Button from "../ui/Button";
import styles from "./BurgerItem.module.css";
import { formatMoney } from "../../utils/formatMoney";
import { getMinPrice } from "../../utils/menuPricing";
import { resolvePublicPath } from "../../utils/assetPath";

export default function BurgerItem({ burger, onOpen }) {
  const minPrice = getMinPrice(burger.prices);

  return (
    <div
      className={styles.item}
      role="button"
      tabIndex={0}
      aria-label={`Ver opciones de ${burger.name}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}>
      <div className={styles.itemLeft}>
        <div className={styles.itemName}>{burger.name}</div>
        {burger.desc ? <div className={styles.itemDesc}>{burger.desc}</div> : null}
        <div className={styles.itemPrices}>Desde {formatMoney(minPrice)}</div>
      </div>

      <div className={styles.itemRight}>
        <div className={styles.thumbWrap}>
          <img
            className={styles.thumb}
            src={resolvePublicPath(burger.img || "/burgers/placeholder.jpg")}
            alt={burger.name}
            loading="lazy"
          />
        </div>
        <Button
          size="xs"
          className={styles.addBtnInline}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}>
          Agregar
        </Button>
      </div>
    </div>
  );
}
