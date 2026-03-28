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
  extras = [],
  papas = [],
) {
  const removedIds = (removedIngredients || []).map((ing) => ing.id).filter(Boolean);
  const extrasIds = (extras || []).map((extra) => extra.id).filter(Boolean);
  const papasIds = (papas || []).map((extra) => extra.id).filter(Boolean);
  const key = buildBurgerLineKey({
    burgerId: burger.id,
    size,
    removedIds,
    extrasIds,
    papasIds,
  });

  return {
    key,
    name: burger.name,
    qty: 1,
    unitPrice: priceInfo.finalPrice,
    removedIngredients: removedIngredients || [],
    extras: extras || [],
    papas: papas || [],
    meta: {
      type: "burger",
      burgerId: burger.id,
      size,
      burgerName: burger.name,
      basePrice: priceInfo.basePrice,
      discountAmount: priceInfo.discountAmount,
      offerId: priceInfo.offerId,
      offerLabel: priceInfo.offerLabel,
      extrasIds,
      friesId: papasIds[0] || null,
      papasIds,
      removedIngredientIds: removedIds,
    },
  };
}

export function buildBurgerAddedToastText(burgerName, size) {
  return `\u2714 ${burgerName} ${size} agregado`;
}
