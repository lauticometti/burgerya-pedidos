import { useState } from "react";
import { bebidas, dips } from "../../data/menu";
import { createBebidaItem, createDipItem } from "../../utils/cartItemBuilders";
import { formatMoney } from "../../utils/formatMoney";
import { useStoreStatus } from "../../utils/storeClosedMode";
import useCheckoutValidation from "../Carrito/useCheckoutValidation";
import {
  CHEESEBURGER_DAY_PRICE,
  CHEESEBURGER_DAY_SOLD_OUT,
  CHEESEBURGER_DAY_MIN_DELIVERY_QTY,
  CHEESEBURGER_DAY_DIP_ID,
} from "./cheeseburgerDayConfig";
import styles from "./CheeseburgerDay.module.css";

const dip = dips.find((d) => d.id === CHEESEBURGER_DAY_DIP_ID) || null;

export default function CheeseburgerDay() {
  const storeStatus = useStoreStatus();

  const [comboQty, setComboQty] = useState(1);
  const [bebidaQtys, setBebidaQtys] = useState({});
  const [dipQty, setDipQty] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState("Retiro");
  const [showDeliveryHint, setShowDeliveryHint] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [cross, setCross] = useState("");
  const [notes, setNotes] = useState("");
  const [whenMode, setWhenMode] = useState("Ahora");
  const [whenSlot, setWhenSlot] = useState("");
  const [pay, setPay] = useState("");
  const [payCashAmount, setPayCashAmount] = useState("");
  const [payTransferAmount, setPayTransferAmount] = useState("");

  const canDeliver = comboQty >= CHEESEBURGER_DAY_MIN_DELIVERY_QTY;
  // Si la cantidad baja de 2 con Delivery ya elegido, se recalcula a Retiro
  // en el render (estado derivado) en vez de sincronizar con un efecto.
  const effectiveDeliveryMode = canDeliver ? deliveryMode : "Retiro";

  const comboTotal = comboQty * CHEESEBURGER_DAY_PRICE;
  const bebidasTotal = bebidas.reduce(
    (sum, b) => sum + (bebidaQtys[b.id] || 0) * b.price,
    0,
  );
  const dipTotal = dip ? dipQty * dip.price : 0;
  const total = comboTotal + bebidasTotal + dipTotal;

  const items = [
    {
      key: "cheeseday:combo",
      name: "Cheese",
      qty: comboQty,
      meta: { size: "doble", burgerId: "cheese" },
    },
    ...bebidas
      .filter((b) => (bebidaQtys[b.id] || 0) > 0)
      .map((b) => createBebidaItem(b, bebidaQtys[b.id])),
    ...(dip && dipQty > 0 ? [createDipItem(dip, dipQty)] : []),
  ];

  const { canSend, missingFields, waHref } = useCheckoutValidation({
    deliveryMode: effectiveDeliveryMode,
    name,
    address,
    cross,
    pay,
    payCashAmount,
    payTransferAmount,
    notes,
    items,
    total,
    couponCode: "",
    discountAmount: 0,
    totalBefore: total,
    whenMode,
    whenSlot,
  });

  const hasCrossOk = effectiveDeliveryMode !== "Delivery" || cross.trim();
  const hasWhenOk = whenMode !== "Mas tarde" || whenSlot.trim();
  const formValid = canSend && hasCrossOk && hasWhenOk;
  const canOrder = formValid && storeStatus.isOpenNow && !CHEESEBURGER_DAY_SOLD_OUT;

  function handleDeliveryClick() {
    if (!canDeliver) {
      setShowDeliveryHint(true);
      return;
    }
    setShowDeliveryHint(false);
    setDeliveryMode("Delivery");
  }

  function handleRetiroClick() {
    setShowDeliveryHint(false);
    setDeliveryMode("Retiro");
  }

  function incBebida(id) {
    setBebidaQtys((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }
  function decBebida(id) {
    setBebidaQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
  }

  const allMissing = [
    ...missingFields,
    !hasCrossOk ? "entre calles" : null,
    !hasWhenOk ? "horario" : null,
  ].filter(Boolean);
  const missingLabel = allMissing.length ? allMissing.join(", ") : "";

  return (
    <div className={styles.page}>
      <img
        src="/favicon.svg"
        alt="Burger Ya"
        className={styles.logo}
        onError={(e) => { e.target.style.display = "none"; }}
      />

      <h1 className={styles.title}>Cheeseburger<br />Day</h1>
      <p className={styles.subtitle}>Solo Cheese · Solo Doble</p>

      <img
        src="/burgers/cheese.svg"
        alt="Cheese Doble + Papas"
        className={styles.heroImg}
        onError={(e) => { e.target.style.display = "none"; }}
      />

      <p className={styles.statusLine}>{storeStatus.bannerState.message}</p>

      {CHEESEBURGER_DAY_SOLD_OUT && (
        <div className={styles.soldOutBanner}>
          AGOTADO POR HOY
          <span>La cocina llegó al límite.</span>
        </div>
      )}

      <section className={styles.section}>
        <p className={styles.productName}>Cheese doble + papas</p>
        <div className={styles.qtyRow}>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => setComboQty((q) => Math.max(1, q - 1))}
            aria-label="Restar combo">
            −
          </button>
          <span className={styles.qtyValue}>{comboQty}</span>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => setComboQty((q) => q + 1)}
            aria-label="Sumar combo">
            +
          </button>
        </div>
        <p className={styles.price}>{formatMoney(comboTotal)}</p>
      </section>

      <section className={styles.section}>
        <div className={styles.modeRow}>
          <button
            type="button"
            className={`${styles.modeBtn} ${effectiveDeliveryMode === "Retiro" ? styles.modeBtnActive : ""}`}
            onClick={handleRetiroClick}>
            RETIRO
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${effectiveDeliveryMode === "Delivery" ? styles.modeBtnActive : ""} ${!canDeliver ? styles.modeBtnDim : ""}`}
            onClick={handleDeliveryClick}>
            DELIVERY
          </button>
        </div>
        {showDeliveryHint && !canDeliver && (
          <p className={styles.deliveryHint}>
            Delivery arranca en 2 combos. Sumá uno más y listo.
          </p>
        )}
      </section>

      <section className={styles.section}>
        <label className={styles.label}>
          Nombre
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </label>

        {effectiveDeliveryMode === "Delivery" && (
          <>
            <label className={styles.label}>
              Dirección
              <input
                className={styles.input}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle y altura"
              />
            </label>
            <label className={styles.label}>
              Entre calles
              <input
                className={styles.input}
                value={cross}
                onChange={(e) => setCross(e.target.value)}
                placeholder="Entre calle A y calle B"
              />
            </label>
            <p className={styles.deliveryNotice}>
              El envío se calcula aparte. Cuando recibamos tu pedido te
              confirmamos el valor según tu dirección.
            </p>
          </>
        )}

        <label className={styles.label}>
          Aclaraciones (opcional)
          <input
            className={styles.input}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional"
          />
        </label>
      </section>

      {(bebidas.length > 0 || dip) && (
        <section className={styles.section}>
          <p className={styles.sectionTitle}>Bebidas</p>
          {bebidas.map((b) => (
            <div key={b.id} className={styles.extraRow}>
              <span className={styles.extraName}>{b.name}</span>
              <div className={styles.qtyRowSm}>
                <button
                  type="button"
                  className={styles.qtyBtnSm}
                  onClick={() => decBebida(b.id)}
                  aria-label={`Restar ${b.name}`}>
                  −
                </button>
                <span className={styles.qtyValueSm}>{bebidaQtys[b.id] || 0}</span>
                <button
                  type="button"
                  className={styles.qtyBtnSm}
                  onClick={() => incBebida(b.id)}
                  aria-label={`Sumar ${b.name}`}>
                  +
                </button>
              </div>
            </div>
          ))}

          {dip && (
            <>
              <p className={styles.sectionTitle}>Dip</p>
              <div className={styles.extraRow}>
                <span className={styles.extraName}>{dip.name}</span>
                <div className={styles.qtyRowSm}>
                  <button
                    type="button"
                    className={styles.qtyBtnSm}
                    onClick={() => setDipQty((q) => Math.max(0, q - 1))}
                    aria-label="Restar dip">
                    −
                  </button>
                  <span className={styles.qtyValueSm}>{dipQty}</span>
                  <button
                    type="button"
                    className={styles.qtyBtnSm}
                    onClick={() => setDipQty((q) => q + 1)}
                    aria-label="Sumar dip">
                    +
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Cuándo</p>
        <div className={styles.modeRow}>
          <button
            type="button"
            className={`${styles.modeBtn} ${whenMode === "Ahora" ? styles.modeBtnActive : ""}`}
            onClick={() => setWhenMode("Ahora")}>
            AHORA
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${whenMode === "Mas tarde" ? styles.modeBtnActive : ""}`}
            onClick={() => setWhenMode("Mas tarde")}>
            MÁS TARDE
          </button>
        </div>
        {whenMode === "Mas tarde" && (
          <input
            className={styles.input}
            value={whenSlot}
            onChange={(e) => setWhenSlot(e.target.value)}
            placeholder="¿A qué hora? (ej: 21:30)"
          />
        )}
      </section>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Pago</p>
        <div className={styles.payRow}>
          {["Efectivo", "Transferencia", "Mixto"].map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.modeBtn} ${pay === p ? styles.modeBtnActive : ""}`}
              onClick={() => setPay(p)}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        {pay === "Mixto" && (
          <div className={styles.mixedRow}>
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              value={payCashAmount}
              onChange={(e) => setPayCashAmount(e.target.value)}
              placeholder="Efectivo $"
            />
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              value={payTransferAmount}
              onChange={(e) => setPayTransferAmount(e.target.value)}
              placeholder="Transferencia $"
            />
          </div>
        )}
      </section>

      <section className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Cheese doble x{comboQty}</span>
          <span>{formatMoney(comboTotal)}</span>
        </div>
        {bebidasTotal > 0 && (
          <div className={styles.summaryRow}>
            <span>Bebidas</span>
            <span>{formatMoney(bebidasTotal)}</span>
          </div>
        )}
        {dipTotal > 0 && (
          <div className={styles.summaryRow}>
            <span>Dip</span>
            <span>{formatMoney(dipTotal)}</span>
          </div>
        )}
        {effectiveDeliveryMode === "Delivery" && (
          <div className={styles.summaryRow}>
            <span>Envío</span>
            <span>A confirmar</span>
          </div>
        )}
      </section>

      <div className={styles.ctaSpacer} />

      <div className={styles.stickyCta}>
        <div className={styles.stickyTotal}>
          TOTAL {formatMoney(total)}
        </div>
        {CHEESEBURGER_DAY_SOLD_OUT ? (
          <button type="button" className={styles.ctaBtn} disabled>
            AGOTADO POR HOY
          </button>
        ) : !storeStatus.isOpenNow ? (
          <button type="button" className={styles.ctaBtn} disabled>
            {storeStatus.nextOpenText || "Todavía no abrimos"}
          </button>
        ) : canOrder ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className={styles.ctaBtn}>
            PEDIR AHORA
          </a>
        ) : (
          <button type="button" className={styles.ctaBtn} disabled>
            {missingLabel ? `Faltan: ${missingLabel}` : "PEDIR AHORA"}
          </button>
        )}
      </div>
    </div>
  );
}
