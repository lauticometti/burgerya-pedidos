import Button from "../ui/Button";
import Card from "../ui/Card";
import { TextareaField } from "../ui/FormFields";
import CloseButton from "../ui/CloseButton";
import styles from "./CartItemCard.module.css";
import { formatMoney } from "../../utils/formatMoney";
import { formatPickNames } from "../../utils/formatPicks";

export default function CartItemCard({
  item,
  onChangeNote,
  onDecrease,
  onIncrease,
  onRemove,
  onOpenExtras,
  onOpenPapas,
  canImprovePapas,
  canAddExtras,
  promoPicks = [],
  allowPromoPickExtras = true,
  onPromoNoteChange,
  onPromoPickExtras,
  onPromoPickPapas,
}) {
  const isPromo = item.meta?.type === "promo";
  const allowPromoQty = item.meta?.allowQty;
  const showQtyControls = !isPromo || allowPromoQty;
  const showActions = canAddExtras || canImprovePapas;
  const extrasTotal = (item.extras || []).reduce(
    (sum, extra) => sum + extra.price,
    0,
  );
  const papasTotal = (item.papas || []).reduce(
    (sum, extra) => sum + extra.price,
    0,
  );
  const baseUnitPrice =
    typeof item.meta?.basePrice === "number" ? item.meta.basePrice : item.unitPrice;
  const hasDiscount =
    item.meta?.type === "burger" &&
    typeof item.meta?.basePrice === "number" &&
    item.meta.basePrice > item.unitPrice;
  const discountAmount = hasDiscount ? item.meta.basePrice - item.unitPrice : 0;
  const baseUnitWithExtras = baseUnitPrice + extrasTotal + papasTotal;
  const unitWithExtras = item.unitPrice + extrasTotal + papasTotal;
  const displayPrice = unitWithExtras;
  const picksText = item.meta?.picks?.length
    ? formatPickNames(item.meta.picks)
    : null;
  const joiner = isPromo ? " / " : " + ";
  const sizeLabel =
    item.meta?.size === "doble"
      ? "doble"
      : item.meta?.size === "triple"
        ? "triple"
        : item.meta?.size === "simple"
          ? "simple"
          : null;
  const description = item.meta?.description;

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          {showQtyControls ? (
            <div className={styles.qtyControls}>
              <Button size="xs" onClick={onDecrease} disabled={item.qty <= 1}>
                -
              </Button>
              <span className={styles.qty}>{item.qty}</span>
              <Button size="xs" onClick={onIncrease}>
                +
              </Button>
            </div>
          ) : null}
          <div className={styles.nameBlock}>
            <div className={styles.name}>
              {item.name}
              {!isPromo && sizeLabel ? ` ${sizeLabel}` : ""}
            </div>
            {picksText ? (
              <div className={styles.meta}>- {picksText}</div>
            ) : null}
            {description ? (
              <div className={styles.metaSmall}>{description}</div>
            ) : null}
            {item.extras?.length ? (
              <div className={styles.metaSmall}>
                Agregados: {item.extras.map((extra) => extra.name).join(joiner)}
              </div>
            ) : null}
            {item.papas?.length ? (
              <div className={styles.metaSmall}>
                Mejorar papas:{" "}
                {item.papas.map((extra) => extra.name).join(joiner)}
              </div>
            ) : null}
            {item.note?.trim() ? (
              <div className={styles.metaSmall}>
                Aclaración: {item.note.trim()}
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.rightBlock}>
          <div className={styles.priceBlock}>
            {hasDiscount ? (
              <div className={styles.priceOriginal}>
                {formatMoney(baseUnitWithExtras)}
              </div>
            ) : null}
            <div className={styles.price}>{formatMoney(displayPrice)}</div>
            {hasDiscount ? (
              <div className={styles.priceDiscount}>
                -{formatMoney(discountAmount)}
              </div>
            ) : null}
          </div>
          <CloseButton onClick={onRemove} aria-label={`Quitar ${item.name}`} />
        </div>
      </div>

      {showActions ? (
        <div className={styles.actions}>
          {canAddExtras ? (
            <Button size="sm" onClick={onOpenExtras}>
              Agregados
            </Button>
          ) : null}
          {canImprovePapas ? (
            <Button
              size="sm"
              onClick={onOpenPapas}
              className={styles.papasButton}>
              Mejorar papas
            </Button>
          ) : null}
        </div>
      ) : null}

      {!isPromo &&
      item.meta?.type !== "papas" &&
      item.meta?.type !== "bebida" ? (
        <div className={styles.noteEditor}>
          <TextareaField
            placeholder="Aclaraciones"
            value={item.note || ""}
            onChange={(event) => onChangeNote?.(event.target.value)}
            rows={1}
            className={styles.noteInput}
          />
        </div>
      ) : null}

      {promoPicks.length ? (
        <div className={styles.promoPicks}>
          {promoPicks.map((pick, index) => (
            <div key={`${pick.id}-${index}`} className={styles.promoPickRow}>
              <div className={styles.promoPickInfo}>
                <div className={styles.promoPickName}>
                  {index + 1}. {pick.name || pick.id}
                </div>
                {pick.extras?.length ? (
                  <div className={styles.metaSmall}>
                    Agregados:{" "}
                    {pick.extras.map((extra) => extra.name).join(joiner)}
                  </div>
                ) : null}
                {pick.papas?.length ? (
                  <div className={styles.metaSmall}>
                    Mejorar papas:{" "}
                    {pick.papas.map((extra) => extra.name).join(joiner)}
                  </div>
                ) : null}
                {pick.note?.trim() ? (
                  <div className={styles.metaSmall}>
                    Aclaración: {pick.note.trim()}
                  </div>
                ) : null}
              </div>
              <div className={styles.promoPickActions}>
                {allowPromoPickExtras ? (
                  <Button size="xs" onClick={() => onPromoPickExtras?.(index)}>
                    Agregados
                  </Button>
                ) : null}
                <Button
                  size="xs"
                  onClick={() => onPromoPickPapas?.(index)}
                  className={styles.papasButton}>
                  Mejorar Papas
                </Button>
              </div>

              <div className={styles.promoPickNote}>
                <TextareaField
                  placeholder="Aclaraciones"
                  value={pick.note || ""}
                  onChange={(event) =>
                    onPromoNoteChange?.(index, event.target.value)
                  }
                  rows={1}
                  className={styles.noteInput}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
