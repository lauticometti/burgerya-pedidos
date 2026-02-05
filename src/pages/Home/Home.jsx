import { Link } from "react-router-dom";
import { useCart } from "../../store/useCart";
import TopNav from "../../components/TopNav";
import { STORE_SCHEDULE_TEXT } from "../../utils/isOpenNow";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import HomeCard from "../../components/home/HomeCard";
import BrandLogo from "../../components/brand/BrandLogo";
import styles from "./Home.module.css";

export default function Home() {
  const cart = useCart();

  return (
    <Page>
      <BrandLogo />
      <TopNav />

      <div className={styles.subtitle}>Elegí cómo querés armar tu pedido</div>
      <div className={styles.scheduleHint}>Horario: {STORE_SCHEDULE_TEXT}</div>

      <div className={styles.cards}>
        <HomeCard
          to="/burgers"
          title="Burgers"
          subtitle="Armar pedido por unidad"
        />
        <HomeCard
          to="/promos"
          title="Promos"
          subtitle="2x / 3x / 4x (Dobles o Triples)"
        />
        <HomeCard
          to="/papas"
          title="Papas y más"
          subtitle="Papas grandes y dips para acompañar"
        />
      </div>

      <StickyBar>
        <CartSummary total={cart.total} lastAdded={cart.lastAdded} />
        <Link to="/carrito">
          <Button variant="primary" disabled={cart.items.length === 0}>
            Ir al carrito
          </Button>
        </Link>
      </StickyBar>
    </Page>
  );
}



