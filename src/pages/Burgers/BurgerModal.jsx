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
  const [show, setShow] = React.useState(false);

  // Consolidated customization state
  const [customizations, setCustomizations] = React.useState({
    size: null,
    removedIds: [],
    extrasIds: [],
    papasIds: [],
  });

  // Consolidated modal state
  const [modals, setModals] = React.useState({
    removeOpen: false,
    removeDraftIds: [],
    extrasOpen: false,
    extrasDraftIds: [],
    papasOpen: false,
    papasDraftIds: [],
  });

  const [wantsPapas, setWantsPapas] = React.useState(false);
  const [papasImprovements, setPapasImprovements] = React.useState([]);

  const { closedActionLabel, isClosed, reopenText } = useStoreStatus();

  const papasMejoras = React.useMemo(() => buildPapasMejoras(papas), []);
  const hasNestedModalOpen =
    modals.removeOpen || modals.extrasOpen || modals.papasOpen;

  // Reset state when modal opens
  React.useEffect(() => {
    if (!open || !burger) return;
    const first =
      SIZE_ORDER.find((candidate) => burger.prices?.[candidate] != null) || null;
    setWantsPapas(false);
    setPapasImprovements([]);
    setCustomizations({
      size: first,
      removedIds: [],
      extrasIds: [],
      papasIds: [],
    });
    setModals({
      removeOpen: false,
      removeDraftIds: [],
      extrasOpen: false,
      extrasDraftIds: [],
      papasOpen: false,
      papasDraftIds: [],
    });
  }, [open, burger]);

  useEscapeToClose(open && !hasNestedModalOpen, onClose);

  React.useEffect(() => {
    if (!open) {
      setShow(false);
      setModals((prev) => ({
        ...prev,
        removeOpen: false,
        extrasOpen: false,
        papasOpen: false,
      }));
      return;
    }

    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Helper functions for modal state updates
  const openRemoveModal = () => {
    setModals((prev) => ({
      ...prev,
      removeOpen: true,
      removeDraftIds: customizations.removedIds,
    }));
  };

  const openExtrasModal = () => {
    setModals((prev) => ({
      ...prev,
      extrasOpen: true,
      extrasDraftIds: customizations.extrasIds,
    }));
  };

  const openPapasModal = () => {
    setModals((prev) => ({
      ...prev,
      papasOpen: true,
      papasDraftIds: customizations.papasIds,
    }));
  };

  if (!open || !burger) return null;

  const isTitanica = burger.id === "titanica";
  const sizes = SIZE_ORDER.filter((candidate) => burger.prices?.[candidate] != null);
  const selectedSize = isTitanica ? "triple" : customizations.size;
  const selectedPrice = selectedSize
    ? getBurgerPriceInfo(burger, selectedSize)
    : null;
  const removableIngredients = burger.removableIngredients || [];
  const selectedRemovals = removableIngredients.filter((ingredient) =>
    customizations.removedIds.includes(ingredient.id),
  );
  const selectedExtras = extras.filter((item) =>
    customizations.extrasIds.includes(item.id),
  );
  const selectedPapas = papasMejoras.filter((item) =>
    customizations.papasIds.includes(item.id),
  );
  const customizationCount =
    selectedRemovals.length + selectedExtras.length + selectedPapas.length;
  const originStyle = origin
    ? { "--origin-x": `${origin.x}px`, "--origin-y": `${origin.y}px` }
    : undefined;
  const burgerImg =
    origin?.imageSrc || resolvePublicPath(burger.img || "/burgers/placeholder.jpg");
  const addDisabled = !selectedSize || isClosed;

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
              <span className={styles.nameSide}>
                {burger.id === "cheese_promo" ? "papas opcionales" : "con papas"}
              </span>
            </div>

            {!isTitanica && burger.id !== "cheese_promo" ? (
              <div className={styles.sizeRow}>
                {sizes.map((candidate) => {
                  return (
                    <button
                      key={candidate}
                      type="button"
                      className={`${styles.sizeBtn} ${
                        customizations.size === candidate ? styles.sizeBtnOn : ""
                      }`}
                      onClick={() =>
                        setCustomizations((prev) => ({
                          ...prev,
                          size: candidate,
                        }))
                      }>
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

            {burger.id === "cheese_promo" ? (
              <div>
                <button
                  type="button"
                  className={`${styles.papasUpsell} ${wantsPapas ? styles.papasUpsellOn : ""}`}
                  onClick={() => setWantsPapas((prev) => !prev)}>
                  {wantsPapas ? "✓ Papas sumadas +$3.000" : "Sumar papas +$3.000"}
                </button>
                {wantsPapas ? (
                  <div className={styles.papasImprovementsGroup}>
                    <div className={styles.papasImprovementsLabel}>Mejorar papas:</div>
                    <div className={styles.papasImprovementsButtons}>
                      <button
                        type="button"
                        className={`${styles.improveBtn} ${
                          papasImprovements.includes("cheddar")
                            ? styles.improveBtnOn
                            : ""
                        }`}
                        onClick={() => {
                          setPapasImprovements((prev) =>
                            prev.includes("cheddar")
                              ? prev.filter((id) => id !== "cheddar")
                              : [...prev, "cheddar"]
                          );
                        }}>
                        Cheddar +$1.500
                      </button>
                      <button
                        type="button"
                        className={`${styles.improveBtn} ${
                          papasImprovements.includes("bacon")
                            ? styles.improveBtnOn
                            : ""
                        }`}
                        onClick={() => {
                          setPapasImprovements((prev) =>
                            prev.includes("bacon")
                              ? prev.filter((id) => id !== "bacon")
                              : [...prev, "bacon"]
                          );
                        }}>
                        Bacon +$1.500
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className={styles.customizer}>
              <div className={styles.customizerTitle}>Personalizala a tu gusto</div>
              <div className={styles.customizerSubtitle}>
                {burger.id === "cheese_promo"
                  ? "Viene sin papas. Podes sumarlas por $3.000, agregar extras o sacar lo que no quieras."
                  : "Sumale extras, mejora las papas o saca lo que no quieras."}
              </div>
              <div className={styles.customizerActions}>
                <Button size="sm" onClick={openExtrasModal}>
                  Agregados
                </Button>
                {burger.id !== "cheese_promo" ? (
                  <Button
                    size="sm"
                    onClick={openPapasModal}
                    className={styles.papasButton}>
                    Mejorar papas
                  </Button>
                ) : null}
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
              onClick={() => {
                onAdd?.(burger, selectedSize, {
                  removedIngredients: selectedRemovals,
                  extras: selectedExtras,
                  papas: selectedPapas,
                }, { wantsPapas, papasImprovements });
              }}>
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
        open={modals.extrasOpen}
        title="Agregados"
        description="Suma extras a esta burger."
        items={extras}
        selectedIds={modals.extrasDraftIds}
        onToggle={(id) =>
          setModals((prev) => ({
            ...prev,
            extrasDraftIds: prev.extrasDraftIds.includes(id)
              ? prev.extrasDraftIds.filter((itemId) => itemId !== id)
              : [...prev.extrasDraftIds, id],
          }))
        }
        onClose={() =>
          setModals((prev) => ({ ...prev, extrasOpen: false }))
        }
        onApply={() => {
          setCustomizations((prev) => ({
            ...prev,
            extrasIds: modals.extrasDraftIds,
          }));
          setModals((prev) => ({ ...prev, extrasOpen: false }));
        }}
        onClear={
          customizations.extrasIds.length
            ? () => {
                setCustomizations((prev) => ({
                  ...prev,
                  extrasIds: [],
                }));
                setModals((prev) => ({
                  ...prev,
                  extrasDraftIds: [],
                  extrasOpen: false,
                }));
              }
            : undefined
        }
        clearLabel="Quitar agregados"
      />

      <ItemExtrasModal
        open={modals.papasOpen}
        title="Mejorar papas"
        items={papasMejoras}
        selectedIds={modals.papasDraftIds}
        onToggle={(id) =>
          setModals((prev) => ({
            ...prev,
            papasDraftIds: prev.papasDraftIds.includes(id) ? [] : [id],
          }))
        }
        onClose={() =>
          setModals((prev) => ({ ...prev, papasOpen: false }))
        }
        onApply={() => {
          setCustomizations((prev) => ({
            ...prev,
            papasIds: modals.papasDraftIds,
          }));
          setModals((prev) => ({ ...prev, papasOpen: false }));
        }}
        disableApply={modals.papasDraftIds.length === 0}
        applyLabel="Mejorar"
        onClear={
          customizations.papasIds.length
            ? () => {
                setCustomizations((prev) => ({
                  ...prev,
                  papasIds: [],
                }));
                setModals((prev) => ({
                  ...prev,
                  papasDraftIds: [],
                  papasOpen: false,
                }));
              }
            : undefined
        }
        clearLabel="Quitar mejoras"
      />

      <RemoveIngredientsModal
        open={modals.removeOpen}
        title={`Quitar a ${burger.name}`}
        ingredients={removableIngredients}
        selectedIds={modals.removeDraftIds}
        onToggle={(id) =>
          setModals((prev) => ({
            ...prev,
            removeDraftIds: prev.removeDraftIds.includes(id)
              ? prev.removeDraftIds.filter((itemId) => itemId !== id)
              : [...prev.removeDraftIds, id],
          }))
        }
        onApply={() => {
          setCustomizations((prev) => ({
            ...prev,
            removedIds: modals.removeDraftIds,
          }));
          setModals((prev) => ({ ...prev, removeOpen: false }));
        }}
        onClose={() =>
          setModals((prev) => ({ ...prev, removeOpen: false }))
        }
      />
    </div>
  );
}
