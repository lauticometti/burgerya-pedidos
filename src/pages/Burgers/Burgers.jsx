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

  function openBurger(burger) {
    setActiveBurger(burger);
    setModalOpen(true);
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
              <BurgerItem
                key={burger.id}
                burger={burger}
                onOpen={() => openBurger(burger)}
              />
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




