import { formatMoney } from "../../utils/formatMoney";
import { toast } from "../../utils/toast";
import { buildBurgerLineKey } from "../../utils/cartKeys";

export function notifyUnavailableBurger(burger, reason = "no disponible por hoy") {
  toast.error(`${burger.name}: ${reason}`, {
    key: `burger-unavailable:${burger.id}`,
  });
}

export function scrollToBurgerCard(burgerId) {
  if (typeof window === "undefined") return;
  const element = document.getElementById(`burger-${burgerId}`);
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const offset = 96;
  const target = rect.top + window.scrollY - offset;

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: target, behavior: "smooth" });
  });
}

export function buildBurgerCartItem(
  burger,
  size,
  priceInfo,
  removedIngredients = [],
) {
  const removedIds = (removedIngredients || []).map((ing) => ing.id).filter(Boolean);
  const key = buildBurgerLineKey({
    burgerId: burger.id,
    size,
    removedIds,
  });

  return {
    key,
    name: burger.name,
    qty: 1,
    unitPrice: priceInfo.finalPrice,
    removedIngredients: removedIngredients || [],
    meta: {
      type: "burger",
      burgerId: burger.id,
      size,
      burgerName: burger.name,
      basePrice: priceInfo.basePrice,
      discountAmount: priceInfo.discountAmount,
      extrasIds: [],
      friesId: null,
      removedIngredientIds: removedIds,
    },
  };
}

export function buildBurgerAddedToastText(burgerName, size, priceInfo) {
  if (priceInfo.hasDiscount) {
    return `Agregado: ${burgerName} ${size} - ${formatMoney(
      priceInfo.finalPrice,
    )} (antes ${formatMoney(priceInfo.basePrice)})`;
  }

  return `Agregado: ${burgerName} ${size} - ${formatMoney(priceInfo.finalPrice)}`;
}
