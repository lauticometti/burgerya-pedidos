import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { papas, bebidas } from "../../data/menu";
import { useCart } from "../../store/useCart";
import { toast } from "../../utils/toast";
import { getUnavailableReason, isItemUnavailable } from "../../utils/availability";
import TopNav from "../../components/TopNav";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import PapasItem from "../../components/papas/PapasItem";
import PapasOptionModal from "../../components/papas/PapasOptionModal";
import PageTitle from "../../components/ui/PageTitle";
import styles from "./Papas.module.css";
import BrandLogo from "../../components/brand/BrandLogo";
import {
  buildPapasBase,
  buildPapasCartItem,
  buildPapasOptionsBySize,
  indexPapasById,
} from "./papasUtils";
import ClosedInlineNotice from "../../components/alerts/ClosedInlineNotice";
import { useStoreStatus } from "../../utils/storeClosedMode";
import { TOAST_KEYS } from "../../constants/toastKeys";
import { useListingPageActions } from "../../hooks/useListingPageActions";

export default function Papas() {
  const cart = useCart();
  const { closedActionLabel, closedToastText, isClosed, reopenText } =
    useStoreStatus();
  const { canAddItem, showUnavailableError } = useListingPageActions({
    toastKey: TOAST_KEYS.STORE_CLOSED_PAPAS,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [activeSize, setActiveSize] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState("solas");

  const adjustedPapas = papas;
  const papasById = useMemo(() => indexPapasById(adjustedPapas), [adjustedPapas]);
  const papasBase = useMemo(() => buildPapasBase(papasById), [papasById]);
  const optionsBySize = useMemo(
    () => buildPapasOptionsBySize(papasById),
    [papasById],
  );

  const bebidaItems = bebidas || [];

  function openModal(size) {
    if (!canAddItem()) return;
    const options = optionsBySize[size] || [];
    if (options.length === 1) {
      const [only] = options;
      if (showUnavailableError(only, TOAST_KEYS.PAPAS_OPTION_UNAVAILABLE(size, only.id))) return;
      const cartItem = buildPapasCartItem(size, only);
      if (!cartItem) return;
      cart.add(cartItem);
      toast.added(cartItem.name);
      return;
    }
    setActiveSize(size);
    setSelectedOptionId("sola");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setActiveSize(null);
  }

  function addSelectedPapas() {
    if (!canAddItem()) return;
    if (!activeSize) return;
    const options = optionsBySize[activeSize] || [];
    const picked = options.find((opt) => opt.id === selectedOptionId);
    if (!picked) return;
    if (
      showUnavailableError(
        picked,
        TOAST_KEYS.PAPAS_OPTION_UNAVAILABLE(activeSize, picked.id),
      )
    )
      return;

    const cartItem = buildPapasCartItem(activeSize, picked);
    if (!cartItem) return;
    cart.add(cartItem);
    toast.added(cartItem.name);
    closeModal();
  }

  return (
    <Page>
      <BrandLogo />
      <TopNav />
      <PageTitle>Papas y bebidas</PageTitle>
      <ClosedInlineNotice />
      <div className={styles.list}>
        {papasBase.map((item) => (
          <PapasItem
            key={item.id}
            item={{ name: item.label, price: item.basePrice }}
            onAdd={() => openModal(item.size)}
            actionLabel={isClosed ? reopenText : "Ver opciones"}
            isUnavailable={isClosed}
            unavailableReason={reopenText}
          />
        ))}
      </div>
      {bebidaItems.length ? (
        <>
          <div className={styles.sectionLabel} id="bebidas">
            Bebidas
          </div>
          <div className={styles.list}>
            {bebidaItems.map((item) => (
              <PapasItem
                key={item.id}
                item={item}
                isUnavailable={isClosed || isItemUnavailable(item)}
                unavailableReason={isClosed ? reopenText : item.unavailableReason}
                onAdd={() => {
                  if (isClosed) {
                    toast.error(closedToastText, {
                      key: "store-closed-bebida",
                    });
                    return;
                  }
                  if (isItemUnavailable(item)) {
                    const reason = getUnavailableReason(item);
                    toast.error(`${item.name}: ${reason}`, {
                      key: `bebida-unavailable:${item.id}`,
                    });
                    return;
                  }
                  cart.add({
                    key: `bebida:${item.id}`,
                    name: item.name,
                    qty: 1,
                    unitPrice: item.price,
                    meta: { type: "bebida" },
                  });
                  toast.added(item.name);
                }}
              />
            ))}
          </div>
        </>
      ) : null}
      <StickyBar>
        <CartSummary total={cart.total} />
        {isClosed ? (
          <Button variant="primary" type="button" disabled subLabel={reopenText}>
            {closedActionLabel}
          </Button>
        ) : (
          <Link to="/carrito">
            <Button
              variant="primary"
              type="button"
              disabled={cart.items.length === 0}>
              Cerrar pedido
            </Button>
          </Link>
        )}
      </StickyBar>
      <PapasOptionModal
        open={modalOpen}
        title={activeSize === "chica" ? "Papas extra chicas" : "Papas extra grandes"}
        options={activeSize ? optionsBySize[activeSize] : []}
        selectedId={selectedOptionId}
        onSelect={setSelectedOptionId}
        onClose={closeModal}
        onConfirm={addSelectedPapas}
        isClosed={isClosed}
        closedActionLabel={closedActionLabel}
        reopenText={reopenText}
      />
    </Page>
  );
}
