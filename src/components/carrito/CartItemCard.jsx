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
  onPromoNoteChange,
  onPromoPickExtras,
  onPromoPickPapas,
}) {
  const isPromo = item.meta?.type === "promo";
  const extrasTotal = (item.extras || []).reduce(
    (sum, extra) => sum + extra.price,
    0,
  );
  const papasTotal = (item.papas || []).reduce(
    (sum, extra) => sum + extra.price,
    0,
  );
  const unitWithExtras = item.unitPrice + extrasTotal + papasTotal;
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

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          {!isPromo ? (
            <div className={styles.qtyControls}>
              <Button size="xs" onClick={onDecrease}>
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
            {picksText ? <div className={styles.meta}>- {picksText}</div> : null}
            {item.extras?.length ? (
              <div className={styles.metaSmall}>
                Agregados: {item.extras.map((extra) => extra.name).join(joiner)}
              </div>
            ) : null}
            {item.papas?.length ? (
              <div className={styles.metaSmall}>
                Mejorar papas: {item.papas.map((extra) => extra.name).join(joiner)}
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
          <div className={styles.price}>{formatMoney(unitWithExtras)}</div>
          <CloseButton onClick={onRemove} aria-label={`Quitar ${item.name}`} />
        </div>
      </div>

      {canAddExtras ? (
        <div className={styles.actions}>
          {canImprovePapas ? (
            <>
              <Button size="sm" onClick={onOpenExtras}>
                Agregados
              </Button>
              <Button size="sm" onClick={onOpenPapas}>
                Mejorar Papas
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onOpenExtras}>
              Agregados
            </Button>
          )}
        </div>
      ) : null}

      {!isPromo && item.meta?.type !== "papas" ? (
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
                    Agregados: {pick.extras.map((extra) => extra.name).join(joiner)}
                  </div>
                ) : null}
                {pick.papas?.length ? (
                  <div className={styles.metaSmall}>
                    Mejorar papas: {pick.papas.map((extra) => extra.name).join(joiner)}
                  </div>
                ) : null}
                {pick.note?.trim() ? (
                  <div className={styles.metaSmall}>
                    Aclaración: {pick.note.trim()}
                  </div>
                ) : null}
              </div>
              <div className={styles.promoPickActions}>
                <Button size="xs" onClick={() => onPromoPickExtras?.(index)}>
                  Agregados
                </Button>
                <Button size="xs" onClick={() => onPromoPickPapas?.(index)}>
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






