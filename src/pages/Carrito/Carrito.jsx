import React from "react";
import { useCart } from "../../store/useCart";
import { bebidas, extras, papas, WHATSAPP_NUMBER } from "../../data/menu";
import ItemExtrasModal from "../../components/ItemExtrasModal";
import { toast } from "../../utils/toast";
import { getAvailableSlotsMin30, minutesToHHMM } from "../../utils/timeSlots";
import { buildWhatsAppText } from "../../utils/whatsapp";
import { getNextOrderId } from "../../utils/orderCounter";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import CarritoHeader from "../../components/carrito/CarritoHeader";
import DeliveryDetailsCard from "../../components/carrito/DeliveryDetailsCard";
import PaymentScheduleCard from "../../components/carrito/PaymentScheduleCard";
import CartItemCard from "../../components/carrito/CartItemCard";
import BebidasModal from "../../components/carrito/BebidasModal";
import PageTitle from "../../components/ui/PageTitle";
import styles from "./Carrito.module.css";

export default function Carrito() {
  const cart = useCart();

  const [step, setStep] = React.useState(1); // 1: Chequear pedido, 2: Datos y pago
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [cross, setCross] = React.useState("");
  const [pay, setPay] = React.useState("Efectivo");

  const [notes, setNotes] = React.useState("");
  const [whenMode, setWhenMode] = React.useState("Ahora");
  const [whenSlot, setWhenSlot] = React.useState("");
  const [modalItemKey, setModalItemKey] = React.useState(null);
  const [modalMode, setModalMode] = React.useState(null);
  const [modalTarget, setModalTarget] = React.useState("item");
  const [modalPickIndex, setModalPickIndex] = React.useState(null);
  const [modalSelectedIds, setModalSelectedIds] = React.useState([]);
  const [bebidaOpen, setBebidaOpen] = React.useState(false);
  const [bebidaQuantities, setBebidaQuantities] = React.useState({});
  const [orderId, setOrderId] = React.useState("");
  const storageKey = "burgerya_carrito_form";

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.name) setName(saved.name);
      if (saved?.address) setAddress(saved.address);
      if (saved?.cross) setCross(saved.cross);
      if (saved?.pay) setPay(saved.pay);
      if (saved?.notes) setNotes(saved.notes);
      if (saved?.whenMode) setWhenMode(saved.whenMode);
      if (saved?.whenSlot) setWhenSlot(saved.whenSlot);
    } catch {
      // ignore storage errors
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    const payload = {
      name,
      address,
      cross,
      pay,
      notes,
      whenMode,
      whenSlot,
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [name, address, cross, pay, notes, whenMode, whenSlot]);

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
    if (whenMode === "MÃ¡s tarde" && !whenSlot && availableSlots.length) {
      setWhenSlot(minutesToHHMM(availableSlots[0]));
    }
  }, [whenMode, whenSlot, availableSlots]);

  const when =
    whenMode === "Ahora" ? "Lo antes posible" : `Para mÃ¡s tarde (${whenSlot})`;

  const hasTimeOk = whenMode === "Ahora" || !!whenSlot;

  const canSend =
    cart.items.length > 0 &&
    name.trim() &&
    address.trim() &&
    pay.trim() &&
    hasTimeOk;

  const canContinue = cart.items.length > 0;
  const hasBebidas = cart.items.some((item) => item.meta?.type === "bebida");

  React.useEffect(() => {
    if (canSend && !orderId) {
      setOrderId(getNextOrderId());
    }
  }, [canSend, orderId]);

  React.useEffect(() => {
    if (!canContinue && step !== 1) {
      setStep(1);
    }
  }, [canContinue, step]);

  const missingFields = [
    !name.trim() ? "nombre" : null,
    !address.trim() ? "direcciÃ³n" : null,
    !pay.trim() ? "pago" : null,
    !hasTimeOk ? "horario" : null,
  ].filter(Boolean);

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppText({
    name,
    address,
    cross,
    pay,
    when,
    notes,
    items: cart.items,
    total: cart.total,
    orderId,
  })}`;

  const papasMejoras = React.useMemo(
    () =>
      papas.filter((item) => ["cheddar_liq", "papas_bacon"].includes(item.id)),
    [],
  );
  const bebidaItems = bebidas || [];

  const modalItem = cart.items.find((item) => item.key === modalItemKey);
  const modalItems = modalMode === "papas" ? papasMejoras : extras;

  function setItemNote(key, value) {
    cart.setNote(key, value);
  }

  function openExtrasModal(item, mode, pickIndex = null) {
    setModalItemKey(item.key);
    setModalMode(mode);
    if (pickIndex == null) {
      setModalTarget("item");
      setModalPickIndex(null);
      const selected = mode === "papas" ? item.papas || [] : item.extras || [];
      setModalSelectedIds(selected.map((extra) => extra.id));
      return;
    }

    const pick = item.meta?.picks?.[pickIndex];
    const pickExtras = mode === "papas" ? pick?.papas : pick?.extras;
    setModalTarget("pick");
    setModalPickIndex(pickIndex);
    setModalSelectedIds((pickExtras || []).map((extra) => extra.id));
  }

  function toggleModalSelection(id) {
    setModalSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  }

  function applyModalSelection() {
    if (!modalItem) return;
    const selectedExtras = modalItems.filter((item) =>
      modalSelectedIds.includes(item.id),
    );
    if (modalTarget === "item") {
      if (modalMode === "papas") {
        cart.setPapas(modalItem.key, selectedExtras);
      } else {
        cart.setExtras(modalItem.key, selectedExtras);
      }
      if (selectedExtras.length > 0) {
        toast.success(
          modalMode === "papas" ? "Papas mejoradas." : "Agregados aplicados.",
        );
      }
    } else {
      const picks = (modalItem.meta?.picks || []).map((pick, index) => {
        if (index !== modalPickIndex) return pick;
        if (modalMode === "papas") return { ...pick, papas: selectedExtras };
        return { ...pick, extras: selectedExtras };
      });
      cart.setPromoPicks(modalItem.key, picks);
      if (selectedExtras.length > 0) {
        toast.success(
          modalMode === "papas" ? "Papas mejoradas." : "Agregados aplicados.",
        );
      }
    }
    setModalItemKey(null);
    setModalMode(null);
    setModalTarget("item");
    setModalPickIndex(null);
    setModalSelectedIds([]);
  }

  function clearModalSelectionAndApply() {
    if (!modalItem) return;
    if (modalTarget === "item") {
      if (modalMode === "papas") {
        cart.setPapas(modalItem.key, []);
        toast.success("Mejoras de papas quitadas.");
      } else {
        cart.setExtras(modalItem.key, []);
        toast.success("Agregados quitados.");
      }
    } else {
      const picks = (modalItem.meta?.picks || []).map((pick, index) => {
        if (index !== modalPickIndex) return pick;
        if (modalMode === "papas") return { ...pick, papas: [] };
        return { ...pick, extras: [] };
      });
      cart.setPromoPicks(modalItem.key, picks);
      toast.success(
        modalMode === "papas"
          ? "Mejoras de papas quitadas."
          : "Agregados quitados.",
      );
    }
    setModalItemKey(null);
    setModalMode(null);
    setModalTarget("item");
    setModalPickIndex(null);
    setModalSelectedIds([]);
  }

  function openBebidaModal() {
    const initial = bebidaItems.reduce((acc, item) => {
      acc[item.id] = 0;
      return acc;
    }, {});
    setBebidaQuantities(initial);
    setBebidaOpen(true);
  }

  function adjustBebidaQty(id, delta) {
    setBebidaQuantities((prev) => {
      const current = prev[id] || 0;
      const nextQty = Math.max(current + delta, 0);
      return { ...prev, [id]: nextQty };
    });
  }

  function applyBebidaSelection() {
    const selected = bebidaItems.filter(
      (item) => (bebidaQuantities[item.id] || 0) > 0,
    );
    if (!selected.length) return;

    selected.forEach((item) => {
      const qty = bebidaQuantities[item.id] || 0;
      cart.add({
        key: `bebida:${item.id}`,
        name: item.name,
        qty,
        unitPrice: item.price,
        meta: { type: "bebida" },
      });
    });

    toast.success(
      selected.length === 1
        ? `+ ${selected[0].name}`
        : "Bebidas agregadas.",
    );

    setBebidaOpen(false);
    setBebidaQuantities({});
  }

  function getCategory(item) {
    if (item.meta?.type === "promo") return "promos";
    if (item.meta?.type === "bebida") return "bebidas";
    if (item.meta?.type === "papas" && item.key?.startsWith("papas:dip_"))
      return "dips";
    if (item.meta?.type === "papas") return "papas";
    return "burgers";
  }

  const groupOrder = [
    { key: "promos", title: "PROMOS" },
    { key: "burgers", title: "BURGERS" },
    { key: "papas", title: "PAPAS" },
    { key: "dips", title: "DIPS" },
    { key: "bebidas", title: "BEBIDAS" },
  ];

  const groupedItems = React.useMemo(() => {
    const grouped = {
      promos: [],
      burgers: [],
      papas: [],
      dips: [],
      bebidas: [],
    };
    for (const item of cart.items) {
      const category = getCategory(item);
      grouped[category].push(item);
    }
    return grouped;
  }, [cart.items]);

  const slotOptions = availableSlots.map((m) => ({
    value: minutesToHHMM(m),
    label: minutesToHHMM(m),
  }));

  return (
    <Page>
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
              groupOrder.map((group) => {
                const groupItems = groupedItems[group.key] || [];
                if (!groupItems.length) return null;
                return (
                  <div key={group.key} className={styles.group}>
                    <div className={styles.groupTitle}>{group.title}</div>
                    <div className={styles.groupItems}>
                      {groupItems.map((it) => {
                        const isPromo = it.meta?.type === "promo";
                        const canImprovePapas = it.meta?.type === "burger";
                        const canAddExtras = it.meta?.type === "burger";
                        return (
                          <CartItemCard
                            key={it.key}
                            item={it}
                            onChangeNote={(value) => setItemNote(it.key, value)}
                            onDecrease={() => cart.setQty(it.key, it.qty - 1)}
                            onIncrease={() => cart.setQty(it.key, it.qty + 1)}
                            onRemove={() => cart.remove(it.key)}
                            onOpenExtras={() => openExtrasModal(it, "extras")}
                            onOpenPapas={() => openExtrasModal(it, "papas")}
                            promoPicks={isPromo ? it.meta?.picks || [] : []}
                            onPromoNoteChange={(index, value) => {
                              const picks = (it.meta?.picks || []).map(
                                (pick, pickIndex) =>
                                  pickIndex === index
                                    ? { ...pick, note: value }
                                    : pick,
                              );
                              cart.setPromoPicks(it.key, picks);
                            }}
                            onPromoPickExtras={(index) =>
                              openExtrasModal(it, "extras", index)
                            }
                            onPromoPickPapas={(index) =>
                              openExtrasModal(it, "papas", index)
                            }
                            canImprovePapas={canImprovePapas}
                            canAddExtras={canAddExtras}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {cart.items.length > 0 ? (
            <div className={styles.drinkCta}>
              <Button className={styles.cokeButton} onClick={openBebidaModal}>
                {hasBebidas ? "Quiero mas bebida" : "Tambien quiero para tomar"}
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <DeliveryDetailsCard
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
            Se abrirÃ¡ WhatsApp con tu pedido listo para enviar.
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
        title={modalMode === "papas" ? "Mejorar papas" : "Agregados"}
        description={
          modalMode === "papas" ? "" : "Agrega extras a este producto."
        }
        items={modalItems}
        selectedIds={modalSelectedIds}
        onToggle={toggleModalSelection}
        onClose={() => {
          setModalItemKey(null);
          setModalMode(null);
          setModalTarget("item");
          setModalPickIndex(null);
          setModalSelectedIds([]);
        }}
        onApply={applyModalSelection}
        disableApply={modalMode === "papas" && modalSelectedIds.length === 0}
        applyLabel={modalMode === "papas" ? "Mejorar" : "Aplicar"}
        onClear={
          modalItem &&
          ((modalTarget === "item" &&
            (modalMode === "papas"
              ? modalItem.papas?.length
              : modalItem.extras?.length)) ||
            (modalTarget === "pick" &&
              (modalMode === "papas"
                ? modalItem.meta?.picks?.[modalPickIndex]?.papas?.length
                : modalItem.meta?.picks?.[modalPickIndex]?.extras?.length)))
            ? clearModalSelectionAndApply
            : undefined
        }
        clearLabel={modalMode === "papas" ? "Quitar mejoras" : "Limpiar"}
      />
      <BebidasModal
        open={bebidaOpen}
        items={bebidaItems}
        quantities={bebidaQuantities}
        onChangeQty={adjustBebidaQty}
        onClose={() => {
          setBebidaOpen(false);
          setBebidaQuantities({});
        }}
        onApply={applyBebidaSelection}
      />
    </Page>
  );
}

