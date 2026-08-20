import {
  getFriesUpgradeUnitPrice,
  isFriesUpgradeEntry,
} from "./friesUpgrade";

/**
 * Precio de una mejora aplicada a las papas incluidas con una burger.
 *
 * Unico embudo de precio de papas: lo usan el total del carrito
 * (store/CartProvider.jsx), el precio por item (CartItemCard) y los descuentos
 * por cupon (utils/coupons.js).
 *
 * Para la mejora "Mejorar papas" el precio NO sale del objeto guardado (que
 * puede venir viejo desde localStorage) sino de la config central en
 * utils/friesUpgrade.js, asi cambiar el precio ahi alcanza para todo.
 */
export function getPapasUpgradePrice(extra) {
  if (!extra) return 0;
  if (isFriesUpgradeEntry(extra)) return getFriesUpgradeUnitPrice();
  return extra.price || 0;
}
