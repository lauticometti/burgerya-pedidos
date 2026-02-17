import Button from "../ui/Button";
import styles from "./BurgerItem.module.css";
import { formatMoney } from "../../utils/formatMoney";
import { getMinPrice } from "../../utils/menuPricing";
import { resolvePublicPath } from "../../utils/assetPath";

export default function BurgerItem({ burger, onOpen, onUnavailable }) {
  const minPrice = getMinPrice(burger.prices);
  const isUnavailable = burger.isAvailable === false;
  const unavailableReason = burger.unavailableReason || "no disponible por hoy";

  function handleAction() {
    if (isUnavailable) {
      onUnavailable?.(burger, unavailableReason);
      return;
    }
    onOpen?.();
  }

  return (
    <div
      className={`${styles.item} ${isUnavailable ? styles.itemUnavailable : ""}`}
      role="button"
      tabIndex={0}
      aria-label={
        isUnavailable
          ? `${burger.name}. ${unavailableReason}`
          : `Ver opciones de ${burger.name}`
      }
      aria-disabled={isUnavailable}
      onClick={handleAction}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleAction();
        }
      }}>
      <div className={styles.itemLeft}>
        <div className={styles.itemName}>{burger.name}</div>
        {burger.desc ? <div className={styles.itemDesc}>{burger.desc}</div> : null}
        <div className={styles.itemPrices}>Desde {formatMoney(minPrice)}</div>
        {isUnavailable ? (
          <div className={styles.unavailableLabel}>{unavailableReason}</div>
        ) : null}
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
          className={`${styles.addBtnInline} ${
            isUnavailable ? styles.addBtnInlineUnavailable : ""
          }`}
          type="button"
          aria-disabled={isUnavailable}
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
