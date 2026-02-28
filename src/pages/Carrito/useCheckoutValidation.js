import React from "react";
import { WHATSAPP_NUMBER } from "../../data/menu";
import { buildWhatsAppText } from "../../utils/whatsapp";

export default function useCheckoutValidation({
  deliveryMode,
  name,
  address,
  cross,
  pay,
  notes,
  whenMode,
  whenSlot,
  items,
  total,
}) {
  return React.useMemo(() => {
    const when =
      whenMode === "Ahora" ? "Lo antes posible" : `Para más tarde (${whenSlot})`;
    const hasTimeOk = whenMode === "Ahora" || !!whenSlot;
    const hasDeliveryMode = !!deliveryMode;
    const isDelivery = deliveryMode === "Delivery";
    const hasAddressOk = !isDelivery || !!address.trim();

    const canSend =
      items.length > 0 &&
      !!name.trim() &&
      !!pay.trim() &&
      hasTimeOk &&
      hasAddressOk &&
      hasDeliveryMode;

    const missingFields = [
      !hasDeliveryMode ? "entrega" : null,
      hasDeliveryMode && !name.trim() ? "nombre" : null,
      hasDeliveryMode && isDelivery && !address.trim() ? "dirección" : null,
      hasDeliveryMode && !pay.trim() ? "pago" : null,
      hasDeliveryMode && !hasTimeOk ? "horario" : null,
    ].filter(Boolean);

    const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppText({
      name,
      address,
      cross,
      pay,
      deliveryMode,
      when,
      notes,
      items,
      total,
    })}`;

    return {
      canSend,
      missingFields,
      waHref,
    };
  }, [
    deliveryMode,
    name,
    address,
    cross,
    pay,
    notes,
    whenMode,
    whenSlot,
    items,
    total,
  ]);
}
