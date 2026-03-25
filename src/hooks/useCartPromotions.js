import { useEffect, useMemo } from "react";
import { PROMO_CAMPAIGN, isGiftItem } from "../utils/promosCampaign";

// Mantiene regalos automáticos y expone estado de promos activas.
export default function useCartPromotions(
  cart,
  { papasList = [], manageGifts = true } = {},
) {
  const giftConfig = PROMO_CAMPAIGN.thresholdGift;

  const giftBasePrice = useMemo(() => {
    const match = papasList.find((p) => p.id === giftConfig.papasItemId);
    if (typeof match?.price === "number") return match.price;
    return giftConfig.fallbackPrice || 0;
  }, [papasList, giftConfig.fallbackPrice, giftConfig.papasItemId]);

  const hasRealItems = useMemo(
    () => cart.items.some((item) => !isGiftItem(item)),
    [cart.items],
  );

  const paidTotal = useMemo(() => {
    // cart.total ya descuenta regalos (son $0); nos interesa evitar disparar con carrito vacío.
    return hasRealItems ? cart.total : 0;
  }, [cart.total, hasRealItems]);

  const qualifiesGift = hasRealItems && paidTotal >= giftConfig.amount;
  const missingForGift = hasRealItems
    ? Math.max(giftConfig.amount - paidTotal, 0)
    : giftConfig.amount;

  const giftItem = useMemo(
    () => ({
      key: giftConfig.cartKey,
      name: "Papas gratis",
      qty: 1,
      unitPrice: 0,
      meta: {
        type: "papas",
        promoGiftId: giftConfig.id,
        description: giftConfig.description,
        basePrice: giftBasePrice,
        locked: true,
      },
    }),
    [giftBasePrice, giftConfig.cartKey, giftConfig.description, giftConfig.id],
  );

  const hasGift = useMemo(
    () =>
      cart.items.some(
        (item) =>
          item.key === giftConfig.cartKey || item.meta?.promoGiftId === giftConfig.id,
      ),
    [cart.items, giftConfig.cartKey, giftConfig.id],
  );

  useEffect(() => {
    if (!manageGifts) return;
    if (qualifiesGift && !hasGift) {
      cart.add(giftItem);
    } else if (!qualifiesGift && hasGift) {
      cart.remove(giftItem.key);
    }
  }, [cart, giftItem, hasGift, qualifiesGift, manageGifts]);

  const insights = useMemo(() => {
    const base = {
      burgers: 0,
      doubles: 0,
      triples: 0,
      promos: 0,
      combos: 0,
      items: 0,
    };

    for (const item of cart.items) {
      if (isGiftItem(item)) continue;
      base.items += item.qty || 0;
      const type = item.meta?.type;
      if (type === "burger") {
        base.burgers += item.qty || 0;
        if (item.meta?.size === "doble") base.doubles += item.qty || 0;
        if (item.meta?.size === "triple") base.triples += item.qty || 0;
      } else if (type === "promo") {
        base.promos += item.qty || 0;
      } else if (type === "combo") {
        base.combos += item.qty || 0;
        if (item.meta?.size === "doble") base.doubles += item.qty || 0;
      }
    }
    return base;
  }, [cart.items]);

  return {
    paidTotal,
    qualifiesGift,
    missingForGift,
    hasGift,
    giftAmount: giftConfig.amount,
    giftItem,
    insights,
  };
}
