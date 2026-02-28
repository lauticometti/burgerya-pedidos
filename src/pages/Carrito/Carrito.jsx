import React from "react";
import { useCart } from "../../store/useCart";
import { bebidas, extras, papas } from "../../data/menu";
import ItemExtrasModal from "../../components/ItemExtrasModal";
import { toast } from "../../utils/toast";
import { formatMoney } from "../../utils/formatMoney";
import { getAvailableSlotsMin30, minutesToHHMM } from "../../utils/timeSlots";
import { isItemUnavailable } from "../../utils/availability";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import CarritoHeader from "../../components/carrito/CarritoHeader";
import DeliveryDetailsCard from "../../components/carrito/DeliveryDetailsCard";
import PaymentScheduleCard from "../../components/carrito/PaymentScheduleCard";
import BebidasModal from "../../components/carrito/BebidasModal";
import CartGroupsList from "../../components/carrito/CartGroupsList";
import PageTitle from "../../components/ui/PageTitle";
import BrandLogo from "../../components/brand/BrandLogo";
import styles from "./Carrito.module.css";
import {
  CART_GROUP_ORDER,
  getUndoLabel,
  groupItemsByCategory,
} from "./carritoUtils";
import useCartUndo from "./useCartUndo";
import useBebidaModal from "./useBebidaModal";
import useItemExtrasModal from "./useItemExtrasModal";
import useCarritoCheckoutForm from "./useCarritoCheckoutForm";
import useCheckoutValidation from "./useCheckoutValidation";

export default function Carrito() {
  const cart = useCart();

  const [step, setStep] = React.useState(1); // 1: Chequear pedido, 2: Datos y pago
  const {
    deliveryMode,
    setDeliveryMode,
    name,
    setName,
    address,
    setAddress,
    cross,
    setCross,
    pay,
    setPay,
    notes,
    setNotes,
    whenMode,
    setWhenMode,
    whenSlot,
    setWhenSlot,
  } = useCarritoCheckoutForm();
  const [upsellCollapsed, setUpsellCollapsed] = React.useState(false);
  const { undoItem, handleRemove, handleUndo } = useCartUndo(cart);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const [availableSlots, setAvailableSlots] = React.useState(
    getAvailableSlotsMin30(),
  );
  React.useEffect(() => {
    const id = setInterval(
      () => setAvailableSlots(getAvailableSlotsMin30()),
      60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (whenMode === "Más tarde" && !whenSlot && availableSlots.length) {
      setWhenSlot(minutesToHHMM(availableSlots[0]));
    }
  }, [whenMode, whenSlot, availableSlots, setWhenSlot]);

  const canContinue = cart.items.length > 0;
  const { canSend, missingFields, waHref } = useCheckoutValidation({
    deliveryMode,
    name,
    address,
    cross,
    pay,
    notes,
    whenMode,
    whenSlot,
    items: cart.items,
    total: cart.total,
  });
  const availableBebidas = React.useMemo(
    () => (bebidas || []).filter((item) => !isItemUnavailable(item)),
    [],
  );
  const firstBurgerItem = cart.items.find(
    (item) => item.meta?.type === "burger",
  );
  const suggestedBebida =
    availableBebidas.find((item) => item.id === "coca_225") ||
    availableBebidas[0] ||
    null;
  const suggestedExtra =
    extras.find((item) => item.id === "bacon_crocante") || extras[0];
  const hasSuggestedExtra =
    !!firstBurgerItem &&
    !!suggestedExtra &&
    (firstBurgerItem.extras || []).some(
      (extra) => extra.id === suggestedExtra.id,
    );

  React.useEffect(() => {
    if (!canContinue && step !== 1) {
      setStep(1);
    }
  }, [canContinue, step]);

  React.useEffect(() => {
    if (cart.items.length === 0 && upsellCollapsed) {
      setUpsellCollapsed(false);
    }
  }, [cart.items.length, upsellCollapsed]);

  React.useEffect(() => {
    if (step !== 2 || typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [step]);

  function addSuggestedBebida() {
    if (!suggestedBebida) return;
    cart.add({
      key: `bebida:${suggestedBebida.id}`,
      name: suggestedBebida.name,
      qty: 1,
      unitPrice: suggestedBebida.price,
      meta: { type: "bebida" },
    });
    toast.success(`+ ${suggestedBebida.name}`);
    setUpsellCollapsed(true);
  }

  function addSuggestedExtra() {
    if (!firstBurgerItem || !suggestedExtra || hasSuggestedExtra) return;
    const nextExtras = [...(firstBurgerItem.extras || []), suggestedExtra];
    cart.setExtras(firstBurgerItem.key, nextExtras);
    toast.success(`+ ${suggestedExtra.name}`);
  }

  const papasMejoras = React.useMemo(
    () =>
      papas.filter((item) => ["cheddar_liq", "papas_bacon"].includes(item.id)),
    [],
  );
  const bebidaItems = bebidas || [];
  const {
    modalItem,
    modalItems,
    modalSelectedIds,
    openExtrasModal,
    toggleModalSelection,
    applyModalSelection,
    closeExtrasModal,
    disableApply: disableExtrasApply,
    applyLabel: extrasApplyLabel,
    clearLabel: extrasClearLabel,
    clearHandler: onClearExtrasSelection,
    title: extrasModalTitle,
    description: extrasModalDescription,
  } = useItemExtrasModal({
    cart,
    papasMejoras,
    extraItems: extras,
  });

  const {
    bebidaOpen,
    bebidaQuantities,
    openBebidaModal,
    closeBebidaModal,
    adjustBebidaQty,
    applyBebidaSelection,
  } = useBebidaModal({
    cart,
    bebidaItems,
  });

  const groupedItems = React.useMemo(() => {
    return groupItemsByCategory(cart.items);
  }, [cart.items]);

  const slotOptions = availableSlots.map((m) => ({
    value: minutesToHHMM(m),
    label: minutesToHHMM(m),
  }));

  const groupListClasses = {
    group: styles.group,
    groupTitle: styles.groupTitle,
    groupItems: styles.groupItems,
    undoBar: styles.undoBar,
    undoText: styles.undoText,
    undoButton: styles.undoButton,
  };

  return (
    <Page>
      <BrandLogo />
      <CarritoHeader onClear={cart.clear} />

      <PageTitle>Carrito</PageTitle>

      <div className={styles.steps}>
        <Button size="sm" isActive={step === 1} onClick={() => setStep(1)}>
          1. Chequear pedido
        </Button>
        <Button
          size="sm"
          isActive={step === 2}
          onClick={() => setStep(2)}
          disabled={!canContinue}>
          2. Datos de entrega y pago
        </Button>
      </div>

      {step === 1 ? (
        <>
          <div className={styles.items}>
            {cart.items.length === 0 ? (
              <div>No hay items.</div>
            ) : (
              <CartGroupsList
                groups={CART_GROUP_ORDER}
                groupedItems={groupedItems}
                undoItem={undoItem}
                getUndoLabel={getUndoLabel}
                onUndo={handleUndo}
                onSetItemNote={cart.setNote}
                onSetQty={cart.setQty}
                onRemove={handleRemove}
                onOpenExtrasModal={openExtrasModal}
                onSetPromoPicks={cart.setPromoPicks}
                classes={groupListClasses}
              />
            )}
          </div>
          {cart.items.length > 0 &&
          (suggestedBebida || (firstBurgerItem && suggestedExtra)) ? (
            upsellCollapsed ? (
              <div className={styles.upsellSolo}>
                <Button variant="primary" size="xs" onClick={openBebidaModal}>
                  Quiero algo para tomar
                </Button>
              </div>
            ) : (
              <div className={styles.upsellCard}>
                <div className={styles.upsellTitle}>Sumale algo al pedido</div>
                <div className={styles.upsellRow}>
                  {suggestedBebida ? (
                    <Button
                      size="sm"
                      className={styles.upsellButton}
                      onClick={addSuggestedBebida}>
                      + {suggestedBebida.name}{" "}
                      {formatMoney(suggestedBebida.price)}
                    </Button>
                  ) : null}
                  {firstBurgerItem && suggestedExtra ? (
                    <Button
                      size="sm"
                      className={styles.upsellButton}
                      disabled={hasSuggestedExtra}
                      onClick={addSuggestedExtra}>
                      {hasSuggestedExtra
                        ? "Extra ya agregado"
                        : `+ ${suggestedExtra.name} ${formatMoney(suggestedExtra.price)}`}
                    </Button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.upsellLink}
                    onClick={openBebidaModal}>
                    Ver todas las bebidas
                  </button>
                </div>
              </div>
            )
          ) : null}
        </>
      ) : (
        <>
          <DeliveryDetailsCard
            deliveryMode={deliveryMode}
            onDeliveryModeChange={setDeliveryMode}
            name={name}
            address={address}
            cross={cross}
            onNameChange={setName}
            onAddressChange={setAddress}
            onCrossChange={setCross}
          />

          <PaymentScheduleCard
            pay={pay}
            whenMode={whenMode}
            whenSlot={whenSlot}
            availableSlots={slotOptions}
            notes={notes}
            onPayChange={setPay}
            onWhenModeChange={setWhenMode}
            onWhenSlotChange={setWhenSlot}
            onNotesChange={setNotes}
          />
        </>
      )}
      {step === 2 ? (
        <div className={styles.sendInfo}>
          <div className={styles.stickyHint}>
            Se abrirá WhatsApp con tu pedido listo para enviar.
          </div>
          {missingFields.length > 0 && (
            <div className={styles.missing}>
              Falta completar: {missingFields.join(", ")}.
            </div>
          )}
        </div>
      ) : null}

      <StickyBar>
        <CartSummary total={cart.total} label="Total" />
        {step === 1 ? (
          <div className={styles.stickyRight}>
            <Button
              variant="primary"
              disabled={!canContinue}
              onClick={() => setStep(2)}>
              Continuar
            </Button>
            {!canContinue ? (
              <div className={styles.stickyHint}>
                Agrega items para continuar.
              </div>
            ) : null}
          </div>
        ) : (
          <div className={styles.stickyRight}>
            <a href={canSend ? waHref : "#"} target="_blank" rel="noreferrer">
              <Button variant="primary" disabled={!canSend}>
                Enviar por WhatsApp
              </Button>
            </a>
          </div>
        )}
      </StickyBar>

      <ItemExtrasModal
        open={!!modalItem}
        title={extrasModalTitle}
        description={extrasModalDescription}
        items={modalItems}
        selectedIds={modalSelectedIds}
        onToggle={toggleModalSelection}
        onClose={closeExtrasModal}
        onApply={applyModalSelection}
        disableApply={disableExtrasApply}
        applyLabel={extrasApplyLabel}
        onClear={onClearExtrasSelection}
        clearLabel={extrasClearLabel}
      />
      <BebidasModal
        open={bebidaOpen}
        items={bebidaItems}
        quantities={bebidaQuantities}
        onChangeQty={adjustBebidaQty}
        onClose={closeBebidaModal}
        onApply={applyBebidaSelection}
      />
    </Page>
  );
}


