import { resolvePublicPath } from "../../utils/assetPath";
import { formatMoney } from "../../utils/formatMoney";
import { createBebidaItem } from "../../utils/cartItemBuilders";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import { isItemUnavailable } from "../../utils/availability";
import ProductName from "../../components/ui/ProductName";
import styles from "./ComboPremiumBanner.module.css";

// PREVIEW: combo del día armado mientras la recomendada normal está apagada
// (solo 80 carnes hoy, se venden a precio completo). Elegís una de las 3
// premium y se suma una Coca Zero 600 a precio combo.
export const COMBO_PREMIUM_BURGER_IDS = ["lautiboom", "american", "bacon"];
export const COMBO_PREMIUM_SIZE = "doble";
export const COMBO_COCA_PRICE = 1500;
const COMBO_COCA_ID = "coca_zero_600";

export default function ComboPremiumBanner({
  burgersById,
  bebidas,
  cart,
  onAdd,
}) {
  const cocaZero = bebidas.find((b) => b.id === COMBO_COCA_ID);
  if (!cocaZero) return null;

  const options = COMBO_PREMIUM_BURGER_IDS.map((id) => burgersById[id]).filter(
    Boolean,
  );
  if (!options.length) return null;

  function handlePick(burger) {
    if (isItemUnavailable(burger) || isItemUnavailable(cocaZero)) return;

    const priceInfo = getBurgerPriceInfo(burger, COMBO_PREMIUM_SIZE);
    const burgerItem = {
      key: `burger:${burger.id}:${COMBO_PREMIUM_SIZE}::`,
      name: burger.name,
      qty: 1,
      unitPrice: priceInfo.finalPrice,
      removedIngredients: [],
      extras: [],
      papas: [],
      meta: { type: "burger", burgerId: burger.id, size: COMBO_PREMIUM_SIZE },
    };
    const cocaItem = {
      ...createBebidaItem(cocaZero, 1),
      key: `bebida:${cocaZero.id}:combo`,
      unitPrice: COMBO_COCA_PRICE,
    };

    cart.add(burgerItem);
    cart.add(cocaItem);
    onAdd(`${burger.name} doble + Coca Zero 600`);
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>TU COMBO</p>

      <h2 className={styles.title}>Burger + papas + Coca</h2>
      <p className={styles.sub}>Tocá tu premium doble favorita</p>

      <div className={styles.options}>
        {options.map((burger) => {
          const unavailable = isItemUnavailable(burger);
          const priceInfo = getBurgerPriceInfo(burger, COMBO_PREMIUM_SIZE);
          const total = priceInfo.finalPrice + COMBO_COCA_PRICE;
          return (
            <button
              key={burger.id}
              type="button"
              className={styles.option}
              disabled={unavailable}
              onClick={() => handlePick(burger)}>
              <img
                src={resolvePublicPath(burger.img)}
                alt={burger.name}
                className={styles.optionImg}
              />
              <ProductName
                as="span"
                className={styles.optionName}
                name={burger.name}
              />
              <span className={styles.optionPrice}>
                {unavailable ? "Sin stock" : formatMoney(total)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
