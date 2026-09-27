import React from "react";
import { WHATSAPP_NUMBER } from "../../data/menu";
import { buildWhatsAppText } from "../../utils/whatsapp";
import { resolveMixedPayment } from "../../utils/checkoutTotals";

// Logica pura (sin hooks) para poder testearla directo, sin renderer de
// React de por medio. useCheckoutValidation de abajo es solo el wrapper con
// useMemo que usan los componentes.
//
// `totals` es el objeto de computeCheckoutTotals: la validacion del pago y el
// WhatsApp usan el MISMO grandTotal que se muestra en pantalla.
// `location` es la ubicacion confirmada ({ lat, lng, source }) o null.
export function computeCheckoutValidation({
  deliveryMode,
  name,
  address,
  cross,
  pay,
  payCashAmount,
  notes,
  items,
  totals,
  couponCode,
  whenMode,
  whenSlot,
  deliveryQuote,
  location = null,
}) {
  const hasDeliveryMode = !!deliveryMode;
  const isDelivery = deliveryMode === "Delivery";
  const locationSource = location?.source ?? null;
  // Un cliente puede no saber su direccion (esta en una plaza, en una casa
  // ajena, etc.) y resolver la ubicacion por geolocalizacion o marcandola en
  // el mapa en vez de escribirla. En esos casos alcanza con tener la zona ya
  // cubierta — no le exigimos ademas texto de direccion: el WhatsApp lleva el
  // link del mapa con las coordenadas. La busqueda por Places SIEMPRE completa
  // el texto sola, asi que no necesita este bypass.
  const isNonTextLocation = locationSource === "geolocation" || locationSource === "map";
  // Para delivery no alcanza con tener texto de direccion: tiene que haber
  // una zona resuelta y cubierta. Sin esto, un pedido podria salir sin
  // costo de envio asignado (o con el de una direccion anterior).
  const hasZoneOk = !isDelivery || deliveryQuote?.status === "covered";
  const hasAddressOk = !isDelivery || !!address.trim() || (hasZoneOk && isNonTextLocation);
  // Hubo algun intento real de ubicar al cliente (texto tipeado o una
  // ubicacion de geolocalizacion/mapa, aunque todavia no haya dado cubierta).
  const attemptedLocation = !!address.trim() || isNonTextLocation;

  const { grandTotal } = totals;
  const isMixedPay = pay === "Mixto";
  // Mixto: la transferencia se deriva del efectivo y del grandTotal actual,
  // asi que la suma que se envia es por construccion el total final.
  const mixed = isMixedPay ? resolveMixedPayment({ cashInput: payCashAmount, total: grandTotal }) : null;
  const hasMixedPayOk = !isMixedPay || (mixed.valid && mixed.cash + mixed.transfer === grandTotal);

  const canSend =
    items.length > 0 &&
    !!name.trim() &&
    !!pay.trim() &&
    hasAddressOk &&
    hasZoneOk &&
    hasMixedPayOk &&
    hasDeliveryMode;

  const missingFields = [
    !hasDeliveryMode ? "entrega" : null,
    hasDeliveryMode && !name.trim() ? "nombre" : null,
    hasDeliveryMode && isDelivery && !attemptedLocation ? "dirección" : null,
    hasDeliveryMode && isDelivery && attemptedLocation && !hasZoneOk
      ? deliveryQuote?.status === "uncovered"
        ? "una dirección dentro de la zona de cobertura"
        : "confirmar la dirección (elegila de la lista)"
      : null,
    hasDeliveryMode && !pay.trim() ? "pago" : null,
    hasDeliveryMode && pay.trim() && !hasMixedPayOk ? "montos de pago" : null,
  ].filter(Boolean);

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppText({
    name,
    address,
    cross,
    pay,
    payCashAmount: isMixedPay ? mixed.cash : null,
    payTransferAmount: isMixedPay ? mixed.transfer : null,
    deliveryMode,
    notes,
    items,
    totals,
    couponCode,
    whenMode,
    whenSlot,
    location: isDelivery ? location : null,
  })}`;

  return { canSend, missingFields, waHref };
}

export default function useCheckoutValidation({
  deliveryMode,
  name,
  address,
  cross,
  pay,
  payCashAmount,
  notes,
  items,
  totals,
  couponCode,
  whenMode,
  whenSlot,
  deliveryQuote,
  location = null,
}) {
  return React.useMemo(
    () =>
      computeCheckoutValidation({
        deliveryMode,
        name,
        address,
        cross,
        pay,
        payCashAmount,
        notes,
        items,
        totals,
        couponCode,
        whenMode,
        whenSlot,
        deliveryQuote,
        location,
      }),
    [
      deliveryMode,
      name,
      address,
      cross,
      pay,
      payCashAmount,
      notes,
      items,
      totals,
      couponCode,
      whenMode,
      whenSlot,
      deliveryQuote,
      location,
    ],
  );
}
