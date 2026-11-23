import { burgers, bebidas, dips } from "../../data/menu";
import { getArgentinaTimeParts } from "../../utils/storeClosedMode";
import { resolvePublicPath } from "../../utils/assetPath";
import { formatMoney } from "../../utils/formatMoney";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import { createBebidaItem, createDipItem } from "../../utils/cartItemBuilders";
import { buildBurgerCartItem } from "../Burgers/burgersUtils";
import { isItemUnavailable } from "../../utils/availability";
import { useCart } from "../../store/useCart";
import styles from "./ComboCompletoBanner.module.css";

// COMBO COMPLETO — flyer del feriado lunes 23/11/2026: Cheese doble + papas
// (incluidas con la burger) + Coca Cola 600ml + dip, $18.000 fijo.
// Solo ese día: a partir de las 00hs se apaga solo y Menu.jsx vuelve a su
// comportamiento normal (recomendada del día / combo premium), sin tocar
// nada de esto. Reemplaza a la card de recomendada de hoy — wireado en
// Menu.jsx, no acá.
export const COMBO_COMPLETO_DATE_KEY = "2026-11-23";
export const COMBO_COMPLETO_BURGER_ID = "cheese";
export const COMBO_COMPLETO_SIZE = "doble";
export const COMBO_COMPLETO_BEBIDA_ID = "coca_600";
export const COMBO_COMPLETO_DIP_ID = "dip_mil_islas";
export const COMBO_COMPLETO_PRICE = 18000;
const COMBO_COMPLETO_NOTE = "Combo completo";

export function isComboCompletoActive(parts = getArgentinaTimeParts()) {
  return parts.dateKey === COMBO_COMPLETO_DATE_KEY;
}

// Arma las 3 líneas del combo (burger + bebida + dip). Pura, sin tocar el
// carrito: la usan tanto el botón de abajo como los tests (total exacto
// $18.000). Reparto del precio fijo: la burger sale a precio normal (no se
// toca, lo arma getBurgerPriceInfo/el repricing automático — por eso
// `meta.comboLocked`, para que ninguna otra oferta se la pise); el ajuste de
// $1.000 para llegar a $18.000 va entero en el dip, que sale de regalo.
// Bebida a precio normal. Las papas vienen incluidas con la burger, sin
// línea aparte. Devuelve null si falta algún producto del catálogo.
export function buildComboCompletoCartItems(date = new Date()) {
  const burger = burgers.find((b) => b.id === COMBO_COMPLETO_BURGER_ID);
  const bebida = bebidas.find((b) => b.id === COMBO_COMPLETO_BEBIDA_ID);
  const dip = dips.find((d) => d.id === COMBO_COMPLETO_DIP_ID);
  if (!burger || !bebida || !dip) return null;

  const priceInfo = getBurgerPriceInfo(burger, COMBO_COMPLETO_SIZE, date);
  const burgerItem = buildBurgerCartItem(burger, COMBO_COMPLETO_SIZE, priceInfo, [], [], []);
  burgerItem.note = COMBO_COMPLETO_NOTE;
  burgerItem.meta = { ...burgerItem.meta, comboLocked: true };

  const bebidaItem = {
    ...createBebidaItem(bebida, 1),
    key: `bebida:${bebida.id}:combo-completo`,
    note: COMBO_COMPLETO_NOTE,
  };
  const dipItem = {
    ...createDipItem(dip, 1),
    key: `dip:${dip.id}:combo-completo`,
    unitPrice: 0,
    note: `${COMBO_COMPLETO_NOTE} (regalo)`,
  };

  return { burger, bebida, dip, burgerItem, bebidaItem, dipItem };
}

export default function ComboCompletoBanner({ onAdd }) {
  const cart = useCart();
  const built = buildComboCompletoCartItems();
  if (!built) return null;
  const { burger, bebida, dip, burgerItem, bebidaItem, dipItem } = built;

  const unavailable =
    isItemUnavailable(burger) || isItemUnavailable(bebida) || isItemUnavailable(dip);

  function handleAdd() {
    if (unavailable) return;
    cart.add(burgerItem);
    cart.add(bebidaItem);
    cart.add(dipItem);
    onAdd?.("Combo completo");
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>Solo hoy</p>
      <h2 className={styles.title}>combo completo.</h2>
      <p className={styles.sub}>Cheese doble + papas + Coca 600 + dip</p>

      <div className={styles.photos}>
        <img
          src={resolvePublicPath(burger.img)}
          alt={burger.name}
          className={styles.photo}
        />
        <img
          src={resolvePublicPath("/papas/papas-grandes.png")}
          alt="Papas"
          className={styles.photo}
        />
        <img
          src={resolvePublicPath(bebida.img)}
          alt={bebida.name}
          className={styles.photo}
        />
        <img src={resolvePublicPath(dip.img)} alt={dip.name} className={styles.photo} />
      </div>

      <p className={styles.price}>{formatMoney(COMBO_COMPLETO_PRICE)}</p>

      <button
        type="button"
        className={styles.cta}
        disabled={unavailable}
        onClick={handleAdd}>
        {unavailable ? "Sin stock" : "Agregar combo"}
      </button>
    </div>
  );
}
