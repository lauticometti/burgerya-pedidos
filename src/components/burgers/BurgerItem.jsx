import Button from "../ui/Button";
import ProductName from "../ui/ProductName";
import styles from "./BurgerItem.module.css";
import { formatMoney } from "../../utils/formatMoney";
import { getMinPrice } from "../../utils/menuPricing";
import { resolvePublicPath } from "../../utils/assetPath";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";

export default function BurgerItem({ burger, onOpen, onUnavailable }) {
  const minPrice = getMinPrice(burger.prices);
  const isUnavailable = isItemUnavailable(burger);
  const isDisabled = isUnavailable;
  const unavailableReason = getUnavailableReason(burger);

  function handleAction() {
    if (isDisabled) {
      onUnavailable?.(burger, unavailableReason);
      return;
    }
    onOpen?.();
  }

  return (
    <div
      className={`${styles.item} ${isDisabled ? styles.itemUnavailable : ""}`}
      role="button"
      tabIndex={0}
      aria-label={
        isDisabled
          ? `${burger.name}. ${unavailableReason}`
          : `Ver opciones de ${burger.name}`
      }
      aria-disabled={isDisabled}
      onClick={handleAction}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleAction();
        }
      }}>
      <div className={styles.itemLeft}>
        <ProductName as="div" className={styles.itemName} name={burger.name} />
        {burger.desc ? <div className={styles.itemDesc}>{burger.desc}</div> : null}
        <div className={styles.itemPrices}>Desde {formatMoney(minPrice)}</div>
        {isDisabled ? (
          <div className={styles.unavailableLabel}>{unavailableReason}</div>
        ) : null}
      </div>

      <div className={styles.itemRight}>
        <div className={styles.thumbWrap}>
          <img
            className={styles.thumb}
            src={resolvePublicPath(burger.img || "/burgers/placeholder.svg")}
            alt={burger.name}
            loading="lazy"
          />
        </div>
        <Button
          size="xs"
          className={`${styles.addBtnInline} ${
            isDisabled ? styles.addBtnInlineUnavailable : ""
          }`}
          type="button"
          aria-disabled={isDisabled}
          disabled={isDisabled}
          onClick={(event) => {
            event.stopPropagation();
            handleAction();
          }}>
          Agregar
        </Button>
      </div>
    </div>
  );
}
