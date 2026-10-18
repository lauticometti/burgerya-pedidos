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

// Descuento "Regalo 30%": sobre el precio habitual de TODO el carrito —
// productos (burgers de cualquier tamaño, papas extra, dips, bebidas) y sus
// adicionales (extras, mejora de papas, picks de promos). Envío aparte: no
// entra en getCartLineUnitTotal. Mismo total de linea que usa el carrito
// (getCartLineUnitTotal), asi que el descuento nunca se desincroniza del
// subtotal que ve el cliente.
export function getRegaloCartDiscount(items) {
  return items.reduce((sum, it) => sum + it.qty * getRegaloDiscount(getCartLineUnitTotal(it)), 0);
}
