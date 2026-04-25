import { burgers, papas } from "../data/menu";
import { toast } from "./toast";

export const CORTA_SEMANA_PROMO_ID = "corta_semana_bacon_lautiboom";
export const CORTA_SEMANA_PROMO_TOTAL = 29000;

const PROMO_LINE_PRICES = {
  bacon: 14000,
  lautiboom: 14000,
  dip_mil_islas: 1000,
};

function findBurger(id) {
  return burgers.find((b) => b.id === id);
}

function findPapas(id) {
  return papas.find((p) => p.id === id);
}

function buildLockedBurgerItem(burgerId, size, unitPrice) {
  const burger = findBurger(burgerId);
  if (!burger) return null;
  return {
    key: `promo:${CORTA_SEMANA_PROMO_ID}:${burgerId}:${size}`,
    name: burger.name,
    qty: 1,
    unitPrice,
    removedIngredients: [],
    extras: [],
    papas: [],
    meta: {
      type: "burger",
      burgerId: burger.id,
      size,
      burgerName: burger.name,
      basePrice: burger.prices?.[size] || unitPrice,
      discountAmount: Math.max((burger.prices?.[size] || 0) - unitPrice, 0),
      offerId: CORTA_SEMANA_PROMO_ID,
      offerLabel: "Combo Corta la semana",
      locked: true,
      comboId: CORTA_SEMANA_PROMO_ID,
    },
  };
}

function buildLockedDipItem(dipId, unitPrice) {
  const dip = findPapas(dipId);
  if (!dip) return null;
  return {
    key: `papas:${dip.id}`,
    name: dip.name,
    qty: 1,
    unitPrice,
    meta: {
      type: "papas",
      locked: true,
      comboId: CORTA_SEMANA_PROMO_ID,
      offerLabel: "Combo Corta la semana",
    },
  };
}

export function isCortaSemanaItem(item) {
  return item?.meta?.comboId === CORTA_SEMANA_PROMO_ID;
}

export function addCortaSemanaPromo(cart) {
  const alreadyInCart = cart.items.some(isCortaSemanaItem);
  if (alreadyInCart) {
    toast.success("El combo ya está en tu pedido", {
      key: `combo-added:${CORTA_SEMANA_PROMO_ID}`,
    });
    return;
  }

  const items = [
    buildLockedBurgerItem("bacon", "doble", PROMO_LINE_PRICES.bacon),
    buildLockedBurgerItem("lautiboom", "doble", PROMO_LINE_PRICES.lautiboom),
    buildLockedDipItem("dip_mil_islas", PROMO_LINE_PRICES.dip_mil_islas),
  ].filter(Boolean);

  if (items.length !== 3) {
    toast.error("No pudimos armar el combo, probá de nuevo", {
      key: `combo-error:${CORTA_SEMANA_PROMO_ID}`,
    });
    return;
  }

  items.forEach((item) => cart.add(item));
  toast.promo("Combo agregado — $29.000", {
    key: `combo-added:${CORTA_SEMANA_PROMO_ID}`,
  });
}
