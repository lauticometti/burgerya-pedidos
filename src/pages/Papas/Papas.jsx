import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { papas, bebidas } from "../../data/menu";
import { useCart } from "../../store/useCart";
import { toast } from "../../utils/toast";
import { isItemUnavailable } from "../../utils/availability";
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
import { createPapasItem } from "../../utils/cartItemBuilders";
import { TOAST_KEYS } from "../../constants/toastKeys";
import { useListingPageActions } from "../../hooks/useListingPageActions";

export default function Papas() {
  const cart = useCart();
  const { closedActionLabel, isClosed, reopenText } = useStoreStatus();
  const { canAddItem, showUnavailableError } = useListingPageActions({
    toastKey: TOAST_KEYS.STORE_CLOSED_PAPAS,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [activeSize, setActiveSize] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState("solas");

  const papasById = useMemo(() => indexPapasById(papas), []);
  const papasBase = useMemo(() => buildPapasBase(papasById), [papasById]);
  const optionsBySize = useMemo(
    () => buildPapasOptionsBySize(papasById),
    [papasById],
  );

  const dipItems = papas.filter((item) => item.id.startsWith("dip_"));
  const bebidaItems = bebidas || [];

  function openModal(size) {
    if (!canAddItem()) return;
    setActiveSize(size);
    setSelectedOptionId("solas");
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
    toast.success(`+ ${cartItem.name}`);
    closeModal();
  }

  return (
    <Page>
      <BrandLogo />
      <TopNav />
      <PageTitle>Papas y más</PageTitle>
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
      {dipItems.length ? (
        <>
          <div className={styles.sectionLabel}>Dips</div>
          <div className={styles.list}>
            {dipItems.map((item) => (
              <PapasItem
                key={item.id}
                item={item}
                isUnavailable={isClosed || isItemUnavailable(item)}
                unavailableReason={isClosed ? reopenText : item.unavailableReason}
                onAdd={() => {
                  if (!canAddItem()) return;
                  if (
                    showUnavailableError(
                      item,
                      TOAST_KEYS.ITEM_UNAVAILABLE_PAPAS_DIP(item.id),
                    )
                  )
                    return;
                  cart.add(createPapasItem(item));
                  toast.success(`+ ${item.name}`);
                }}
              />
            ))}
          </div>
        </>
      ) : null}
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
                  toast.success(`+ ${item.name}`);
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
        title={activeSize === "chica" ? "Papas chicas" : "Papas grandes"}
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
