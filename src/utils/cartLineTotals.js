import { getPapasUpgradePrice } from "./papasPricing";
import { getRegaloDiscount } from "./regaloCampaign";

// Precio unitario de una linea del carrito con todos sus adicionales
// (agregados, mejora de papas y adicionales de cada pick). Es la UNICA cuenta
// de una linea: la usan el total del carrito y el descuento del regalo.
export function getCartLineUnitTotal(it) {
  const papasContext = { size: it.meta?.size, itemType: it.meta?.type };
  const extrasTotal = (it.extras || []).reduce(
    (extrasSum, extra) => extrasSum + extra.price,
    0,
  );
  const papasTotal = (it.papas || []).reduce(
    (papasSum, extra) => papasSum + getPapasUpgradePrice(extra, papasContext),
    0,
  );
  const picksExtrasTotal = (it.meta?.picks || []).reduce((picksSum, pick) => {
    const pickExtras = (pick.extras || []).reduce(
      (pickSum, extra) => pickSum + extra.price,
      0,
    );
    const pickPapas = (pick.papas || []).reduce(
      (pickSum, extra) => pickSum + getPapasUpgradePrice(extra, papasContext),
      0,
    );
    return picksSum + pickExtras + pickPapas;
  }, 0);

  return it.unitPrice + extrasTotal + papasTotal + picksExtrasTotal;
}

export function getCartItemsTotal(items) {
  return items.reduce((sum, it) => sum + it.qty * getCartLineUnitTotal(it), 0);
}

// Descuento "Regalo 30%": SOLO burgers simples y dobles (triples a precio normal), sobre el precio habitual de la burger
// (sin agregados, papas extra, dips ni bebidas). Coincide exacto con el
// precio que muestran las tarjetas (precio - 30% del precio).
export function getRegaloCartDiscount(items) {
  return items.reduce(
    (sum, it) =>
      it.meta?.type === "burger" && it.meta?.size !== "triple" ? sum + it.qty * getRegaloDiscount(it.unitPrice) : sum,
    0,
  );
}
