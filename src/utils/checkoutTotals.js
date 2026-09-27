// Fuente UNICA de los montos del checkout. Resumen visual, sticky, pago
// (Efectivo / Transferencia / Mixto), validacion y WhatsApp leen todos el
// mismo objeto: ninguna parte recalcula su propia version del total.
//
//   productsSubtotal   = total bruto de productos (antes del descuento)
//   discountAmount     = descuento (nunca mayor al subtotal)
//   discountedProducts = productsSubtotal - discountAmount
//   deliveryFee        = precio de la zona si es Delivery cubierto; 0 si no
//   grandTotal         = discountedProducts + deliveryFee

function toAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

// Cuanto de deliveryPrice va al total del pedido: solo si es Delivery Y la
// zona quedo cubierta. Retiro, o Delivery sin zona resuelta todavia, no
// suman nada — nunca un precio viejo o inventado.
export function deliveryPriceFor(quote, deliveryMode) {
  return deliveryMode === "Delivery" && quote?.status === "covered"
    ? toAmount(quote.deliveryPrice)
    : 0;
}

export function computeCheckoutTotals({ productsSubtotal, discountAmount = 0, deliveryMode, deliveryQuote }) {
  const subtotal = toAmount(productsSubtotal);
  const discount = Math.min(toAmount(discountAmount), subtotal);
  const discountedProducts = subtotal - discount;
  const deliveryFee = deliveryPriceFor(deliveryQuote, deliveryMode);
  return {
    productsSubtotal: subtotal,
    discountAmount: discount,
    discountedProducts,
    deliveryFee,
    grandTotal: discountedProducts + deliveryFee,
  };
}

/**
 * Pago mixto. El efectivo que carga el cliente es lo que se conserva; la
 * transferencia SIEMPRE se deriva: transferencia = total - efectivo. Asi, si
 * cambia el total (otra zona, otro descuento) nunca quedan montos viejos: el
 * efectivo se mantiene y la transferencia se recalcula sola. Un efectivo
 * mayor al total se recorta al total (transferencia 0).
 *
 * @returns {{ cash: number|null, transfer: number|null, valid: boolean }}
 *          cash/transfer null mientras el efectivo esta vacio.
 */
export function resolveMixedPayment({ cashInput, total }) {
  const totalAmount = toAmount(total);
  const raw = String(cashInput ?? "").trim();
  if (raw === "" || !/^\d+$/.test(raw)) return { cash: null, transfer: null, valid: false };
  const cash = Math.min(Number(raw), totalAmount);
  const transfer = totalAmount - cash;
  return { cash, transfer, valid: cash + transfer === totalAmount };
}

// Link de navegacion con las coordenadas confirmadas (clickeable en WhatsApp).
// null si no hay lat/lng validas: nunca un link a un punto inventado.
export function buildMapsLink(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  if (location?.lat == null || location?.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}
