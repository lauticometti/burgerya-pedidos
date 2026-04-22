import React from "react";
import { useCart } from "../../store/useCart";
import { useStoreStatus } from "../../utils/storeClosedMode";
import { toast } from "../../utils/toast";
import styles from "./PromoCombo.module.css";

const PROMO_VISIBLE = true;

export default function PromoCombo({ visible = PROMO_VISIBLE }) {
  if (!visible) return null;

  const cart = useCart();
  const { isClosed, closedToastText } = useStoreStatus();

  function handleAddCombo() {
    if (isClosed) {
      toast.error(closedToastText, {
        key: "store-closed-promo",
        duration: 2800,
      });
      return;
    }

    cart.add({
      key: "burger:bacon:doble",
      name: "Bacon Doble",
      qty: 1,
      unitPrice: 15000,
      extras: [],
      papas: [],
      removedIngredients: [],
      meta: {
        type: "burger",
        burgerId: "bacon",
        size: "doble",
      },
    });

    cart.add({
      key: "burger:lautiboom:doble",
      name: "Lautiboom Doble",
      qty: 1,
      unitPrice: 15000,
      extras: [],
      papas: [],
      removedIngredients: [],
      meta: {
        type: "burger",
        burgerId: "lautiboom",
        size: "doble",
      },
    });

    cart.add({
      key: "promo:corta-la-semana:desc",
      name: "Descuento combo",
      qty: 1,
      unitPrice: -1000,
      extras: [],
      papas: [],
      removedIngredients: [],
      meta: {
        type: "promo",
        promoId: "corta-la-semana",
      },
    });

    toast.success("Combo agregado — 2 papas incluidas", {
      key: "promo-added",
      ms: 1800,
    });
  }

  return (
    <div className={styles.wrapper} aria-label="Promoción Corta la Semana">
      <div className={styles.burgerStage}>
        <img
          src="/burgers/lautiboom.svg"
          alt=""
          aria-hidden="true"
          className={`${styles.burgerImg} ${styles.burgerBack}`}
        />
        <img
          src="/burgers/bacon.svg"
          alt=""
          aria-hidden="true"
          className={`${styles.burgerImg} ${styles.burgerFront}`}
        />
      </div>

      <div className={styles.content}>
        <p className={styles.eyebrow}>CORTA LA SEMANA</p>

        <p className={styles.burgerLine}>Bacon doble +<br />Lautiboom doble</p>

        <p className={styles.includesLine}>Incluye 2 papas + dip salsa secreta</p>

        <strong className={styles.price}>$29.000</strong>

        <button
          type="button"
          className={styles.cta}
          onClick={handleAddCombo}
        >
          Pedir combo
        </button>
      </div>
    </div>
  );
}
