import { Link } from "react-router-dom";
import { extras } from "../../data/menu";
import { useCart } from "../../store/useCart";
import { toast } from "../../utils/toast";
import { formatMoney } from "../../utils/formatMoney";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability";
import Page from "../../components/layout/Page";
import StickyBar from "../../components/layout/StickyBar";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageTitle from "../../components/ui/PageTitle";
import styles from "./Extras.module.css";
import ClosedInlineNotice from "../../components/alerts/ClosedInlineNotice";
import { useStoreStatus } from "../../utils/storeClosedMode";

export default function Extras() {
  const cart = useCart();
  const { closedActionLabel, closedToastText, isClosed, reopenText } =
    useStoreStatus();

  function addExtra(x) {
    if (isClosed) {
      toast.error(closedToastText, {
        key: "store-closed-extra",
      });
      return;
    }
    if (isItemUnavailable(x)) {
      const reason = getUnavailableReason(x);
      toast.error(`${x.name}: ${reason}`, {
        key: `extra-unavailable:${x.id}`,
      });
      return;
    }
    const key = `extra:${x.id}`;
    cart.add({
      key,
      name: x.name,
      qty: 1,
      unitPrice: x.price,
      meta: { type: "extra" },
    });
    toast.success(`+ ${x.name}`);
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
      <ClosedInlineNotice />

      <div className={styles.list}>
        {extras.map((x) => {
          const isUnavailable = isClosed || isItemUnavailable(x);
          const unavailableReason = isClosed
            ? reopenText
            : getUnavailableReason(x);
          return (
            <Card
              key={x.id}
              className={isUnavailable ? styles.unavailableCard : ""}>
              <div className={styles.rowBetween}>
                <div>
                  <b>{x.name}</b>
                  {isUnavailable ? (
                    <div className={styles.unavailableLabel}>{unavailableReason}</div>
                  ) : null}
                </div>

                <Button
                  variant="primary"
                  onClick={() => addExtra(x)}
                  aria-disabled={isUnavailable}
                  title={isUnavailable ? unavailableReason : undefined}
                  className={isUnavailable ? styles.unavailableBtn : ""}>
                  {isClosed ? closedActionLabel : `+ ${formatMoney(x.price)}`}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <StickyBar>
        <CartSummary total={cart.total} />
        {isClosed ? (
          <Button variant="primary" disabled subLabel={reopenText}>
            {closedActionLabel}
          </Button>
        ) : (
          <Link to="/carrito">
            <Button variant="primary" disabled={cart.items.length === 0}>
              Cerrar pedido
            </Button>
          </Link>
        )}
      </StickyBar>
    </Page>
  );
}




