import React from "react";
import CloseButton from "../../components/ui/CloseButton";
import Button from "../../components/ui/Button";
import ItemExtrasModal from "../../components/ItemExtrasModal";
import RemoveIngredientsModal from "../../components/carrito/RemoveIngredientsModal";
import useEscapeToClose from "../../hooks/useEscapeToClose";
import { extras, papas } from "../../data/menu";
import { resolvePublicPath } from "../../utils/assetPath";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import { formatMoney } from "../../utils/formatMoney";
import { buildPapasMejoras } from "../../utils/papasUpgradeOptions";
import { useStoreStatus } from "../../utils/storeClosedMode";
import styles from "./BurgerModal.module.css";

const SIZE_ORDER = ["simple", "doble", "triple"];
const SIZE_LABEL = { simple: "Simple", doble: "Doble", triple: "Triple" };

export default function BurgerModal({ open, burger, origin, onClose, onAdd }) {
  const [size, setSize] = React.useState(null);
  const [show, setShow] = React.useState(false);
  const [removedIds, setRemovedIds] = React.useState([]);
  const [extrasIds, setExtrasIds] = React.useState([]);
  const [papasIds, setPapasIds] = React.useState([]);
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [extrasOpen, setExtrasOpen] = React.useState(false);
  const [papasOpen, setPapasOpen] = React.useState(false);
  const [removeDraftIds, setRemoveDraftIds] = React.useState([]);
  const [extrasDraftIds, setExtrasDraftIds] = React.useState([]);
  const [papasDraftIds, setPapasDraftIds] = React.useState([]);
  const { closedActionLabel, isClosed, reopenText } = useStoreStatus();

  const papasMejoras = React.useMemo(() => buildPapasMejoras(papas), []);
  const hasNestedModalOpen = removeOpen || extrasOpen || papasOpen;

  React.useEffect(() => {
    if (!open || !burger) return;
    const first =
      SIZE_ORDER.find((candidate) => burger.prices?.[candidate] != null) || null;
    setSize(first);
    setRemovedIds([]);
    setExtrasIds([]);
    setPapasIds([]);
    setRemoveDraftIds([]);
    setExtrasDraftIds([]);
    setPapasDraftIds([]);
    setRemoveOpen(false);
    setExtrasOpen(false);
    setPapasOpen(false);
  }, [open, burger]);

  useEscapeToClose(open && !hasNestedModalOpen, onClose);

  React.useEffect(() => {
    if (!open) {
      setShow(false);
      setRemoveOpen(false);
      setExtrasOpen(false);
      setPapasOpen(false);
      return;
    }

    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open || !burger) return null;

  const isTitanica = burger.id === "titanica";
  const sizes = SIZE_ORDER.filter((candidate) => burger.prices?.[candidate] != null);
  const selectedSize = isTitanica ? "triple" : size;
  const selectedPrice = selectedSize ? getBurgerPriceInfo(burger, selectedSize) : null;
  const removableIngredients = burger.removableIngredients || [];
  const selectedRemovals = removableIngredients.filter((ingredient) =>
    removedIds.includes(ingredient.id),
  );
  const selectedExtras = extras.filter((item) => extrasIds.includes(item.id));
  const selectedPapas = papasMejoras.filter((item) => papasIds.includes(item.id));
  const customizationCount =
    selectedRemovals.length + selectedExtras.length + selectedPapas.length;
  const originStyle = origin
    ? { "--origin-x": `${origin.x}px`, "--origin-y": `${origin.y}px` }
    : undefined;
  const burgerImg =
    origin?.imageSrc || resolvePublicPath(burger.img || "/burgers/placeholder.jpg");
  const addDisabled = !selectedSize || isClosed;

  function openRemoveModal() {
    setRemoveDraftIds(removedIds);
    setRemoveOpen(true);
  }

  function openExtrasModal() {
    setExtrasDraftIds(extrasIds);
    setExtrasOpen(true);
  }

  function openPapasModal() {
    setPapasDraftIds(papasIds);
    setPapasOpen(true);
  }

  function handleBackdropMouseDown(event) {
    if (hasNestedModalOpen) return;
    if (event.target !== event.currentTarget) return;
    onClose?.();
  }

  return (
    <div
      className={`${styles.backdrop} ${show ? styles.backdropShow : ""}`}
      style={originStyle}
      onMouseDown={handleBackdropMouseDown}>
      <span className={styles.burst} aria-hidden />
      <div
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <CloseButton className={styles.closeButton} onClick={onClose} />

        <div className={styles.body}>
          <div className={styles.content}>
            <img
              className={styles.img}
              src={burgerImg}
              alt={burger.name}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />

            <div className={styles.name}>
              <span>{burger.name}</span>
              <span className={styles.nameSide}>con papas</span>
            </div>

            {!isTitanica ? (
              <div className={styles.sizeRow}>
                {sizes.map((candidate) => {
                  return (
                    <button
                      key={candidate}
                      type="button"
                      className={`${styles.sizeBtn} ${
                        size === candidate ? styles.sizeBtnOn : ""
                      }`}
                      onClick={() => setSize(candidate)}>
                      <div className={styles.sizeTop}>{SIZE_LABEL[candidate]}</div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selectedPrice ? (
              <div className={styles.pricePanel}>
                {selectedPrice.hasDiscount ? (
                  <div className={styles.priceBase}>
                    {formatMoney(selectedPrice.basePrice)}
                  </div>
                ) : null}
                <div className={styles.priceValue}>
                  {formatMoney(selectedPrice.finalPrice)}
                </div>
              </div>
            ) : null}

            <div className={styles.customizer}>
              <div className={styles.customizerTitle}>Personalizala a tu gusto</div>
              <div className={styles.customizerSubtitle}>
                Sumale extras, mejora las papas o saca lo que no quieras.
              </div>
              <div className={styles.customizerActions}>
                <Button size="sm" onClick={openExtrasModal}>
                  Agregados
                </Button>
                <Button
                  size="sm"
                  onClick={openPapasModal}
                  className={styles.papasButton}>
                  Mejorar papas
                </Button>
                {removableIngredients.length ? (
                  <Button
                    size="sm"
                    onClick={openRemoveModal}
                    className={styles.removeButton}>
                    Quitar ingredientes
                  </Button>
                ) : null}
              </div>

              {customizationCount > 0 ? (
                <div className={styles.customizerSummary}>
                  {selectedExtras.length ? (
                    <div className={styles.customizerMeta}>
                      Agregados: {selectedExtras.map((item) => item.name).join(" + ")}
                    </div>
                  ) : null}
                  {selectedPapas.length ? (
                    <div className={styles.customizerMeta}>
                      Mejorar papas: {selectedPapas.map((item) => item.name).join(" + ")}
                    </div>
                  ) : null}
                  {selectedRemovals.length ? (
                    <div className={styles.customizerMeta}>
                      Sin {selectedRemovals.map((item) => item.label).join(" / ")}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <details className={styles.details}>
              <summary className={styles.detailsSummary}>Ver ingredientes</summary>
              <div className={styles.detailsBody}>
                {burger.desc ? <div className={styles.desc}>{burger.desc}</div> : null}
              </div>
            </details>
          </div>

          <div className={styles.footer}>
            <button
              className={`${styles.addBtn} ${isTitanica ? styles.addBtnChallenge : ""}`}
              type="button"
              disabled={addDisabled}
              onClick={() =>
                onAdd?.(burger, selectedSize, {
                  removedIngredients: selectedRemovals,
                  extras: selectedExtras,
                  papas: selectedPapas,
                })
              }>
              {isClosed
                ? closedActionLabel || reopenText
                : isTitanica
                  ? "Yo me animo"
                  : "Sumar al pedido"}
            </button>
            {isClosed ? <div className={styles.footerNote}>{reopenText}</div> : null}
          </div>
        </div>
      </div>

      <ItemExtrasModal
        open={extrasOpen}
        title="Agregados"
        description="Suma extras a esta burger."
        items={extras}
        selectedIds={extrasDraftIds}
        onToggle={(id) =>
          setExtrasDraftIds((prev) =>
            prev.includes(id)
              ? prev.filter((itemId) => itemId !== id)
              : [...prev, id],
          )
        }
        onClose={() => setExtrasOpen(false)}
        onApply={() => {
          setExtrasIds(extrasDraftIds);
          setExtrasOpen(false);
        }}
        onClear={
          extrasIds.length
            ? () => {
                setExtrasDraftIds([]);
                setExtrasIds([]);
                setExtrasOpen(false);
              }
            : undefined
        }
        clearLabel="Quitar agregados"
      />

      <ItemExtrasModal
        open={papasOpen}
        title="Mejorar papas"
        items={papasMejoras}
        selectedIds={papasDraftIds}
        onToggle={(id) =>
          setPapasDraftIds((prev) => (prev.includes(id) ? [] : [id]))
        }
        onClose={() => setPapasOpen(false)}
        onApply={() => {
          setPapasIds(papasDraftIds);
          setPapasOpen(false);
        }}
        disableApply={papasDraftIds.length === 0}
        applyLabel="Mejorar"
        onClear={
          papasIds.length
            ? () => {
                setPapasDraftIds([]);
                setPapasIds([]);
                setPapasOpen(false);
              }
            : undefined
        }
        clearLabel="Quitar mejoras"
      />

      <RemoveIngredientsModal
        open={removeOpen}
        title={`Quitar a ${burger.name}`}
        ingredients={removableIngredients}
        selectedIds={removeDraftIds}
        onToggle={(id) =>
          setRemoveDraftIds((prev) =>
            prev.includes(id)
              ? prev.filter((itemId) => itemId !== id)
              : [...prev, id],
          )
        }
        onApply={() => {
          setRemovedIds(removeDraftIds);
          setRemoveOpen(false);
        }}
        onClose={() => setRemoveOpen(false)}
      />
    </div>
  );
}
