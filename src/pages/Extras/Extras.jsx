import { Link } from "react-router-dom";
import { extras } from "../../data/menu";
import { useCart } from "../../store/useCart";
import { toast } from "../../utils/toast";
import { formatMoney } from "../../utils/formatMoney";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageTitle from "../../components/ui/PageTitle";
import styles from "./Extras.module.css";

export default function Extras() {
  const cart = useCart();

  function addExtra(x) {
    const key = `extra:${x.id}`;
    cart.add({
      key,
      name: x.name,
      qty: 1,
      unitPrice: x.price,
      meta: { type: "extra" },
    });
    toast(`+ ${x.name}`);
  }

  return (
    <Page>
      <div className={styles.header}>
        <div className={styles.left}>
          <Link to="/">
            <Button>Volver</Button>
          </Link>
          <Link to="/carrito">
            <Button>Carrito</Button>
          </Link>
        </div>
        <div className={styles.total}>
          <b>{formatMoney(cart.total)}</b>
        </div>
      </div>

      <PageTitle>Agregados</PageTitle>

      <div className={styles.list}>
        {extras.map((x) => (
          <Card key={x.id}>
            <div className={styles.rowBetween}>
              <div>
                <b>{x.name}</b>
              </div>

              <Button variant="primary" onClick={() => addExtra(x)}>
                + {formatMoney(x.price)}
              </Button>
            </div>
          </Card>
        ))}
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



