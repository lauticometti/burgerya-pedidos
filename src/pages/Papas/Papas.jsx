import { Link } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { papas, bebidas } from "../../data/menu";
import { useCart } from "../../store/useCart";
import { toast } from "../../utils/toast";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";
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

export default function Papas() {
  const cart = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSize, setActiveSize] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState("solas");

  const papasById = useMemo(() => {
    return papas.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, []);

  const getPrice = useCallback(
    (id) => papasById[id]?.price ?? 0,
    [papasById],
  );

  const getAvailability = useCallback(
    (id) => {
      const item = papasById[id];
      return {
        isAvailable: !isItemUnavailable(item),
        unavailableReason: getUnavailableReason(item),
      };
    },
    [papasById],
  );

  const papasBase = [
    {
      id: "papas_chicas",
      label: "Papas chicas",
      size: "chica",
      basePrice: getPrice("porcion_extra"),
    },
    {
      id: "papas_grandes",
      label: "Papas grandes",
      size: "grande",
      basePrice: getPrice("porcion_grande_solas"),
    },
  ];

  const optionsBySize = useMemo(
    () => ({
      chica: [
        {
          id: "solas",
          label: "Solas",
          price: getPrice("porcion_extra"),
        },
        {
          id: "cheddar",
          label: "Con cheddar",
          price: getPrice("porcion_extra") + getPrice("cheddar_liq"),
          ...getAvailability("cheddar_liq"),
        },
        {
          id: "cheddar_bacon",
          label: "Con cheddar y bacon",
          price:
            getPrice("porcion_extra") +
            getPrice("cheddar_liq") +
            getPrice("papas_bacon"),
          ...getAvailability("cheddar_liq"),
        },
      ],
      grande: [
        {
          id: "solas",
          label: "Solas",
          price: getPrice("porcion_grande_solas"),
        },
        {
          id: "cheddar",
          label: "Con cheddar",
          price: getPrice("porcion_grande_cheddar"),
          ...getAvailability("porcion_grande_cheddar"),
        },
        {
          id: "cheddar_bacon",
          label: "Con cheddar y bacon",
          price: getPrice("porcion_grande_cheddar_bacon"),
          ...getAvailability("porcion_grande_cheddar_bacon"),
        },
      ],
    }),
    [getPrice, getAvailability],
  );

  const dipItems = papas.filter((item) => item.id.startsWith("dip_"));

  const bebidaItems = bebidas || [];

  function openModal(size) {
    setActiveSize(size);
    setSelectedOptionId("solas");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setActiveSize(null);
  }

  function addSelectedPapas() {
    if (!activeSize) return;
    const options = optionsBySize[activeSize] || [];
    const picked = options.find((opt) => opt.id === selectedOptionId);
    if (!picked) return;
    if (isItemUnavailable(picked)) {
      const reason = getUnavailableReason(picked);
      toast.error(`${picked.label}: ${reason}`, {
        key: `papas-option-unavailable:${activeSize}:${picked.id}`,
      });
      return;
    }

    const sizeLabel = activeSize === "chica" ? "Papas chicas" : "Papas grandes";
    const optionLabel =
      picked.label.charAt(0).toLowerCase() + picked.label.slice(1);
    const name = `${sizeLabel} ${optionLabel}`;
    const key = `papas:${activeSize}:${picked.id}`;

    cart.add({
      key,
      name,
      qty: 1,
      unitPrice: picked.price,
      meta: { type: "papas", size: activeSize, option: picked.id },
    });

    toast.success(`+ ${name}`);
    closeModal();
  }

  return (
    <Page>
      <BrandLogo />
      <TopNav />
      <PageTitle>Papas y más</PageTitle>
      <div className={styles.list}>
        {papasBase.map((item) => (
          <PapasItem
            key={item.id}
            item={{ name: item.label, price: item.basePrice }}
            onAdd={() => openModal(item.size)}
            actionLabel="Ver opciones"
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
                isUnavailable={isItemUnavailable(item)}
                unavailableReason={item.unavailableReason}
                onAdd={() => {
                  if (isItemUnavailable(item)) {
                    const reason = getUnavailableReason(item);
                    toast.error(`${item.name}: ${reason}`, {
                      key: `papas-unavailable:${item.id}`,
                    });
                    return;
                  }
                  cart.add({
                    key: `papas:${item.id}`,
                    name: item.name,
                    qty: 1,
                    unitPrice: item.price,
                    meta: { type: "papas" },
                  });
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
                isUnavailable={isItemUnavailable(item)}
                unavailableReason={item.unavailableReason}
                onAdd={() => {
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
        <Link to="/carrito">
          <Button
            variant="primary"
            type="button"
            disabled={cart.items.length === 0}>
            Ir al carrito
          </Button>
        </Link>
      </StickyBar>
      <PapasOptionModal
        open={modalOpen}
        title={activeSize === "chica" ? "Papas chicas" : "Papas grandes"}
        options={activeSize ? optionsBySize[activeSize] : []}
        selectedId={selectedOptionId}
        onSelect={setSelectedOptionId}
        onClose={closeModal}
        onConfirm={addSelectedPapas}
      />
    </Page>
  );
}
