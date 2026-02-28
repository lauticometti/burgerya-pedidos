import React from "react";
import CartItemCard from "./CartItemCard";
import CartUndoBar from "./CartUndoBar";

function withPromoNote(item, targetIndex, note) {
  return (item.meta?.picks || []).map((pick, pickIndex) =>
    pickIndex === targetIndex ? { ...pick, note } : pick,
  );
}

export default function CartGroupsList({
  groups,
  groupedItems,
  undoItem,
  getUndoLabel,
  onUndo,
  onSetItemNote,
  onSetQty,
  onRemove,
  onOpenExtrasModal,
  onSetPromoPicks,
  classes,
}) {
  return groups.map((group) => {
    const groupItems = groupedItems[group.key] || [];
    const hasUndo = undoItem?.groupKey === group.key;

    if (!groupItems.length && !hasUndo) return null;

    const undoIndex = hasUndo
      ? Math.min(undoItem.index ?? 0, groupItems.length)
      : -1;
    const undoLabel = hasUndo ? getUndoLabel(undoItem.item) : "";

    return (
      <div key={group.key} className={classes.group}>
        <div className={classes.groupTitle}>{group.title}</div>
        <div className={classes.groupItems}>
          {groupItems.map((item, index) => {
            const isPromo = item.meta?.type === "promo";
            const canImprovePapas = item.meta?.type === "burger";
            const canAddExtras = item.meta?.type === "burger";

            return (
              <React.Fragment key={item.key}>
                {hasUndo && index === undoIndex ? (
                  <CartUndoBar
                    label={undoLabel}
                    onUndo={onUndo}
                    className={classes.undoBar}
                    textClassName={classes.undoText}
                    buttonClassName={classes.undoButton}
                  />
                ) : null}

                <CartItemCard
                  item={item}
                  onChangeNote={(value) => onSetItemNote(item.key, value)}
                  onDecrease={() => onSetQty(item.key, item.qty - 1)}
                  onIncrease={() => onSetQty(item.key, item.qty + 1)}
                  onRemove={() => onRemove(item, group.key, index)}
                  onOpenExtras={() => onOpenExtrasModal(item, "extras")}
                  onOpenPapas={() => onOpenExtrasModal(item, "papas")}
                  promoPicks={isPromo ? item.meta?.picks || [] : []}
                  onPromoNoteChange={(pickIndex, value) => {
                    onSetPromoPicks(item.key, withPromoNote(item, pickIndex, value));
                  }}
                  onPromoPickExtras={(pickIndex) =>
                    onOpenExtrasModal(item, "extras", pickIndex)
                  }
                  onPromoPickPapas={(pickIndex) =>
                    onOpenExtrasModal(item, "papas", pickIndex)
                  }
                  canImprovePapas={canImprovePapas}
                  canAddExtras={canAddExtras}
                />
              </React.Fragment>
            );
          })}

          {hasUndo && undoIndex === groupItems.length ? (
            <CartUndoBar
              label={undoLabel}
              onUndo={onUndo}
              className={classes.undoBar}
              textClassName={classes.undoText}
              buttonClassName={classes.undoButton}
            />
          ) : null}
        </div>
      </div>
    );
  });
}
