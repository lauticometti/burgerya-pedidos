import { Link } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import styles from "./OrderSummaryCard.module.css";
import { formatMoney } from "../../utils/formatMoney";

export default function OrderSummaryCard({ total, items }) {
  function getSizeLabel(item) {
    if (item?.meta?.size === "doble") return "doble";
    if (item?.meta?.size === "triple") return "triple";
    if (item?.meta?.size === "simple") return "simple";
    return null;
  }

  function getCategory(item) {
    if (item.meta?.type === "promo") return "promos";
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
  ];

  const groupedItems = groupOrder.map((group) => ({
    ...group,
    items: items.filter((item) => getCategory(item) === group.key),
  }));

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.label}>Resumen del pedido</div>
          <div className={styles.total}>{formatMoney(total)}</div>
        </div>
        <Link to="/">
          <Button>Editar pedido</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>No hay items.</div>
      ) : (
        <div className={styles.items}>
          {groupedItems.map((group) =>
            group.items.length ? (
              <div key={group.key} className={styles.section}>
                <div className={styles.sectionTitle}>{group.title}</div>
                <div className={styles.sectionItems}>
                  {group.items.map((it) => {
                    const isPromo = it.meta?.type === "promo";
                    const isBurger = it.meta?.type === "burger";
                    const sizeLabel = getSizeLabel(it);
                    const baseLabel = isPromo ? it.name : `${it.qty}x ${it.name}`;
                    const label =
                      !isPromo && isBurger && sizeLabel
                        ? `${baseLabel} ${sizeLabel}`
                        : baseLabel;

                    return (
                      <div key={it.key} className={styles.itemLine}>
                        {label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null,
          )}
        </div>
      )}
    </Card>
  );
}

