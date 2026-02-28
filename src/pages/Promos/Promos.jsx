import { Link } from "react-router-dom";
import { burgers, promoPrices, promoRules } from "../../data/menu.js";
import { useCart } from "../../store/useCart.js";
import TopNav from "../../components/TopNav.jsx";
import Page from "../../components/layout/Page.jsx";
import StickyBar from "../../components/layout/StickyBar.jsx";
import CartSummary from "../../components/cart/CartSummary.jsx";
import Button from "../../components/ui/Button.jsx";
import PromoStepCard from "../../components/promos/PromoStepCard.jsx";
import PageTitle from "../../components/ui/PageTitle.jsx";
import BrandLogo from "../../components/brand/BrandLogo";
import styles from "./Promos.module.css";
import PromoFilters from "./components/PromoFilters.jsx";
import PromoBurgerPicker from "./components/PromoBurgerPicker.jsx";
import PromoPickedSummary from "./components/PromoPickedSummary.jsx";
import usePromoBuilder from "./usePromoBuilder.js";

export default function Promos() {
  const cart = useCart();
  const {
    tier,
    count,
    size,
    picked,
    allowedByTier,
    price,
    pickedTotal,
    showSavings,
    savingsValue,
    canPickMore,
    step,
    stepHelp,
    remainingText,
    countRef,
    sizeRef,
    pickRef,
    chooseTier,
    chooseCount,
    chooseSize,
    pickBurger,
    undoLast,
    removePick,
    addPromoToCart,
  } = usePromoBuilder({
    burgers,
    promoPrices,
    promoRules,
    cart,
  });

  return (
    <Page>
      <BrandLogo />

      <TopNav />
      <PageTitle>Promos</PageTitle>
      <p className={styles.pageNote}>Todas las promos incluyen papas.</p>

      <PromoStepCard step={step} helpText={stepHelp} />

      <PromoFilters
        tier={tier}
        count={count}
        size={size}
        price={price}
        showSavings={showSavings}
        pickedTotal={pickedTotal}
        savingsValue={savingsValue}
        countRef={countRef}
        sizeRef={sizeRef}
        onChooseTier={chooseTier}
        onChooseCount={chooseCount}
        onChooseSize={chooseSize}
      />

      <PromoBurgerPicker
        tier={tier}
        count={count}
        size={size}
        picked={picked}
        allowedByTier={allowedByTier}
        canPickMore={canPickMore}
        pickRef={pickRef}
        onPickBurger={pickBurger}
        onUndoLast={undoLast}
      />

      <PromoPickedSummary
        tier={tier}
        count={count}
        size={size}
        picked={picked}
        price={price}
        remainingText={remainingText}
        onRemovePick={removePick}
        onAddPromoToCart={addPromoToCart}
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
