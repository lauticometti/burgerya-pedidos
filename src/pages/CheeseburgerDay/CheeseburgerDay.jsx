import { useState } from "react";
import { bebidas, dips, papas } from "../../data/menu";
import { createBebidaItem, createDipItem, createPapasItem } from "../../utils/cartItemBuilders";
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
// Papas extra: porciones adicionales por fuera de las papas ya incluidas en
// el combo. Se reutilizan id/precio/disponibilidad tal cual desde menu.js
// — las papas del combo nunca pasan por esta lista. Solo el nombre de
// "porcion_grande_solas" se muestra distinto en este evento (sin tocar el
// nombre real en menu.js, que se sigue usando en el resto del sitio).
const PAPAS_EXTRA_DISPLAY_NAME = {
  porcion_grande_solas: "Porción grande de papas extra",
};
const papasExtraOptions = papas
  .filter((p) => p.isAvailable)
  .map((p) => ({ ...p, name: PAPAS_EXTRA_DISPLAY_NAME[p.id] || p.name }));

// El evento no ofrece pre-pedido para "mas tarde": todo pedido es Ahora.
// Van como constantes (no estado) porque buildWhatsAppText/
// useCheckoutValidation los siguen necesitando, pero ya no son editables.
const WHEN_MODE = "Ahora";
const WHEN_SLOT = "";

export default function CheeseburgerDay() {
  const storeStatus = useStoreStatus();

  const [comboQty, setComboQty] = useState(1);
  const [bebidaQtys, setBebidaQtys] = useState({});
  const [dipQty, setDipQty] = useState(0);
  const [papasQtys, setPapasQtys] = useState({});
  const [deliveryMode, setDeliveryMode] = useState("Retiro");
  const [showDeliveryHint, setShowDeliveryHint] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [cross, setCross] = useState("");
  const [notes, setNotes] = useState("");
  const [pay, setPay] = useState("");

  // Mixto: se guarda cual de los dos campos edito el usuario por ultima vez
  // y con que valor "crudo". El otro campo se deriva de `total` en cada
  // render, asi que si el total cambia (se suma un combo/bebida/dip) el
  // complemento se recalcula solo, sin useEffect ni estado duplicado.
  const [mixedEditedField, setMixedEditedField] = useState(null); // "cash" | "transfer" | null
  const [mixedRawAmount, setMixedRawAmount] = useState("");

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
  const papasExtraTotal = papasExtraOptions.reduce(
    (sum, p) => sum + (papasQtys[p.id] || 0) * p.price,
    0,
  );
  const total = comboTotal + bebidasTotal + dipTotal + papasExtraTotal;

  const mixedRawNum = mixedRawAmount === "" ? 0 : Number(mixedRawAmount);
  const mixedSafeNum = Number.isFinite(mixedRawNum) ? mixedRawNum : 0;
  const mixedClamped = Math.max(0, Math.min(mixedSafeNum, total));
  const payCashAmount =
    mixedEditedField === null
      ? ""
      : mixedEditedField === "cash"
        ? String(mixedClamped)
        : String(Math.max(0, total - mixedClamped));
  const payTransferAmount =
    mixedEditedField === null
      ? ""
      : mixedEditedField === "transfer"
        ? String(mixedClamped)
        : String(Math.max(0, total - mixedClamped));

  function handleMixedChange(field, rawValue) {
    setMixedEditedField(field);
    setMixedRawAmount(rawValue);
  }

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
    ...papasExtraOptions
      .filter((p) => (papasQtys[p.id] || 0) > 0)
      .map((p) => createPapasItem(p, papasQtys[p.id])),
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
    whenMode: WHEN_MODE,
    whenSlot: WHEN_SLOT,
  });

  const hasCrossOk = effectiveDeliveryMode !== "Delivery" || cross.trim();
  const formValid = canSend && hasCrossOk;
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

  function incPapas(id) {
    setPapasQtys((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }
  function decPapas(id) {
    setPapasQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
  }

  const allMissing = [
    ...missingFields,
    !hasCrossOk ? "entre calles" : null,
  ].filter(Boolean);
  const missingLabel = allMissing.length ? allMissing.join(", ") : "";

  return (
    <div className={styles.page}>
      <p className={styles.wordmark}>burger ya.</p>

      <h1 className={styles.title}>
        Cheeseburger
        <br />
        Day
      </h1>

      <p className={styles.subtitle}>
        <span className={styles.subtitleBar} aria-hidden="true" />
        Solo Cheese · Solo Doble
        <span className={styles.subtitleBar} aria-hidden="true" />
      </p>

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

      <section className={styles.productBlock}>
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

      <div className={styles.modeSection}>
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
        {effectiveDeliveryMode === "Retiro" && (
          <p className={styles.pickupAddress}>Malaspina 1602, Hurlingham</p>
        )}
      </div>

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
              <span className={styles.extraPrice}>{formatMoney(b.price)}</span>
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
                <span className={styles.extraPrice}>{formatMoney(dip.price)}</span>
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

      {papasExtraOptions.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionTitle}>Papas extra</p>
          {papasExtraOptions.map((p) => (
            <div key={p.id} className={styles.extraRow}>
              <span className={styles.extraName}>{p.name}</span>
              <span className={styles.extraPrice}>{formatMoney(p.price)}</span>
              <div className={styles.qtyRowSm}>
                <button
                  type="button"
                  className={styles.qtyBtnSm}
                  onClick={() => decPapas(p.id)}
                  aria-label={`Restar ${p.name}`}>
                  −
                </button>
                <span className={styles.qtyValueSm}>{papasQtys[p.id] || 0}</span>
                <button
                  type="button"
                  className={styles.qtyBtnSm}
                  onClick={() => incPapas(p.id)}
                  aria-label={`Sumar ${p.name}`}>
                  +
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

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
            <label className={styles.label}>
              Efectivo
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                value={payCashAmount}
                onChange={(e) => handleMixedChange("cash", e.target.value)}
                placeholder="$"
              />
            </label>
            <label className={styles.label}>
              Transferencia
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                value={payTransferAmount}
                onChange={(e) => handleMixedChange("transfer", e.target.value)}
                placeholder="$"
              />
            </label>
          </div>
        )}
      </section>

      <section className={styles.summaryClean}>
        <p className={styles.summaryTitle}>Resumen</p>
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
        {papasExtraTotal > 0 && (
          <div className={styles.summaryRow}>
            <span>Papas extra</span>
            <span>{formatMoney(papasExtraTotal)}</span>
          </div>
        )}
        {effectiveDeliveryMode === "Delivery" && (
          <div className={styles.summaryRow}>
            <span>Envío</span>
            <span>A confirmar</span>
          </div>
        )}
        <div className={styles.summaryTotalRow}>
          <span>TOTAL</span>
          <span>{formatMoney(total)}</span>
        </div>
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
