import Button from "../ui/Button";
import styles from "./BurgerItem.module.css";
import { formatMoney } from "../../utils/formatMoney";
import { getMinPrice } from "../../utils/menuPricing";
import { resolvePublicPath } from "../../utils/assetPath";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";
import {
  STORE_CLOSED_MODE,
  STORE_REOPEN_TEXT,
} from "../../utils/storeClosedMode";

export default function BurgerItem({ burger, onOpen, onUnavailable }) {
  const minPrice = getMinPrice(burger.prices);
  const isClosed = STORE_CLOSED_MODE;
  const isUnavailable = isItemUnavailable(burger);
  const isDisabled = isClosed || isUnavailable;
  const unavailableReason = isClosed
    ? STORE_REOPEN_TEXT
    : getUnavailableReason(burger);

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
        <div className={styles.itemName}>{burger.name}</div>
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
            src={resolvePublicPath(burger.img || "/burgers/placeholder.jpg")}
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
          {isClosed ? "Cerrado hoy" : "Agregar"}
          {isClosed ? (
            <span className={styles.addBtnHint}>{STORE_REOPEN_TEXT}</span>
          ) : null}
        </Button>
      </div>
    </div>
  );
}
