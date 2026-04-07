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
  items,
  total,
  couponCode,
  discountAmount,
  totalBefore,
  whenMode,
  whenSlot,
}) {
  return React.useMemo(() => {
    const hasDeliveryMode = !!deliveryMode;
    const isDelivery = deliveryMode === "Delivery";
    const hasAddressOk = !isDelivery || !!address.trim();

    const canSend =
      items.length > 0 &&
      !!name.trim() &&
      !!pay.trim() &&
      hasAddressOk &&
      hasDeliveryMode;

    const missingFields = [
      !hasDeliveryMode ? "entrega" : null,
      hasDeliveryMode && !name.trim() ? "nombre" : null,
      hasDeliveryMode && isDelivery && !address.trim() ? "direccion" : null,
      hasDeliveryMode && !pay.trim() ? "pago" : null,
    ].filter(Boolean);

    const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppText({
      name,
      address,
      cross,
      pay,
      deliveryMode,
      notes,
      items,
      total,
      couponCode,
      discountAmount,
      totalBefore,
      whenMode,
      whenSlot,
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
    items,
    total,
    couponCode,
    discountAmount,
    totalBefore,
    whenMode,
    whenSlot,
  ]);
}
