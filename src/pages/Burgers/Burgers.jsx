import React from "react";
import { Link } from "react-router-dom";
import { burgers } from "../../data/menu";
import { useCart } from "../../store/useCart";
import BurgerModal from "./BurgerModal";
import { toast } from "../../utils/toast";
import { formatMoney } from "../../utils/formatMoney";
import TopNav from "../../components/TopNav";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import PageTitle from "../../components/ui/PageTitle";
import BurgerSection from "../../components/burgers/BurgerSection";
import BurgerItem from "../../components/burgers/BurgerItem";
import BrandLogo from "../../components/brand/BrandLogo";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";

const TIER_ORDER = ["BASICA", "PREMIUM", "DELUXE", "ESPECIAL"];
const TIER_LABELS = {
  BASICA: "Básicas",
  PREMIUM: "Premium",
  DELUXE: "Deluxe",
  ESPECIAL: "Bestias",
};

export default function Burgers() {
  const cart = useCart();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeBurger, setActiveBurger] = React.useState(null);

  function showUnavailableBurger(burger, reason = "no disponible por hoy") {
    toast.error(`${burger.name}: ${reason}`, {
      key: `burger-unavailable:${burger.id}`,
    });
  }

  function openBurger(burger) {
    if (isItemUnavailable(burger)) {
      showUnavailableBurger(burger, getUnavailableReason(burger));
      return;
    }
    setActiveBurger(burger);
    setModalOpen(true);
  }

  function scrollToBurger(burgerId) {
    if (typeof window === "undefined") return;
    const el = document.getElementById(`burger-${burgerId}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offset = 96;
    const target = rect.top + window.scrollY - offset;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: target, behavior: "smooth" });
    });
  }

  return (
    <Page>
      <BrandLogo />
      <TopNav />
      <PageTitle>Burgers</PageTitle>

      {TIER_ORDER.map((tier) => {
        const list = burgers.filter((b) => b.tier === tier);
        if (!list.length) return null;

        return (
          <BurgerSection key={tier} title={TIER_LABELS[tier]} variant={tier}>
            {list.map((burger) => (
              <div key={burger.id} id={`burger-${burger.id}`}>
                <BurgerItem
                  burger={burger}
                  onOpen={() => openBurger(burger)}
                  onUnavailable={showUnavailableBurger}
                />
              </div>
            ))}
          </BurgerSection>
        );
      })}

      <BurgerModal
        open={modalOpen}
        burger={activeBurger}
        onClose={() => setModalOpen(false)}
        onAdd={(burger, size) => {
          const key = `burger:${burger.id}:${size}`;
          cart.add({
            key,
            name: burger.name,
            qty: 1,
            unitPrice: burger.prices[size],
            meta: {
              type: "burger",
              burgerId: burger.id,
              size,
              burgerName: burger.name,
              basePrice: burger.prices[size],
              extrasIds: [],
              friesId: null,
            },
          });
          toast.success(
            `Agregado: ${burger.name} ${size} - ${formatMoney(
              burger.prices[size],
            )}`,
          );
          setModalOpen(false);
          setActiveBurger(null);
          scrollToBurger(burger.id);
        }}
      />

      <StickyBar>
        <CartSummary total={cart.total} />
        <Link to="/carrito">
          <Button variant="primary" disabled={cart.items.length === 0}>
            Ir al carrito
          </Button>
        </Link>
      </StickyBar>
    </Page>
  );
}





