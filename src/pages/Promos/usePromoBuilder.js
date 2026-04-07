import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "../../utils/toast.js";
import { getBurgerPrice } from "../../utils/burgerPricing.js";
import { formatMoney } from "../../utils/formatMoney.js";
import {
  isItemUnavailable,
} from "../../utils/availability.js";
import { scrollToRef, pushUnavailableToast } from "../../utils/promoHelpers.js";
import { getStepHelp } from "./promosConfig.js";
import { groupAllowedBurgers, indexBurgersById } from "./promosSelectors.js";
import { useStoreStatus } from "../../utils/storeClosedMode.js";
import { TOAST_KEYS } from "../../constants/toastKeys.js";

export default function usePromoBuilder({
  burgers,
  promoPrices,
  promoRules,
  cart,
}) {
  const { closedToastText, isClosed } = useStoreStatus();

  // Consolidated state
  const [state, setState] = useState({
    tier: null, // BASICA | PREMIUM | DELUXE
    count: null, // 2 | 3 | 4
    size: null, // doble | triple
    picked: [], // { id, name, note }
  });

  // Destructure for convenience
  const { tier, count, size, picked } = state;

  const countRef = useRef(null);
  const sizeRef = useRef(null);
  const pickRef = useRef(null);

  const allowedByTier = useMemo(() => {
    if (!tier) return { BASICA: [], PREMIUM: [], DELUXE: [] };
    return groupAllowedBurgers(burgers, promoRules[tier].allowedTiers);
  }, [tier, burgers, promoRules]);

  const burgersById = useMemo(() => indexBurgersById(burgers), [burgers]);

  const price = useMemo(() => {
    if (!tier || !count || !size) return null;
    return promoPrices[tier][size][count];
  }, [tier, count, size, promoPrices]);

  const pickedTotal = useMemo(() => {
    if (!size || picked.length === 0) return null;
    return picked.reduce((sum, pick) => {
      const burger = burgersById[pick.id];
      const unit = getBurgerPrice(burger, size);
      return sum + unit;
    }, 0);
  }, [picked, size, burgersById]);

  const showSavings = picked.length === count && price != null && pickedTotal;
  const savingsValue = showSavings ? pickedTotal - price : null;
  const canPickMore = tier && count && size && picked.length < count;
  const step = !tier ? 1 : !count ? 2 : !size ? 3 : 4;
  const stepHelp = getStepHelp(step);
  const remaining = count ? Math.max(count - picked.length, 0) : 0;
  const remainingText =
    remaining === 0
      ? "Listo para agregar"
      : `Te faltan ${remaining} burger${remaining === 1 ? "" : "s"}`;

  function chooseTier(nextTier) {
    setState({
      tier: nextTier,
      count: null,
      size: null,
      picked: [],
    });
  }

  function chooseCount(nextCount) {
    setState((prev) => ({
      ...prev,
      count: nextCount,
      picked: [],
    }));
  }

  function chooseSize(nextSize) {
    setState((prev) => ({
      ...prev,
      size: nextSize,
      picked: [],
    }));
  }

  function pickBurger(burger) {
    if (!canPickMore) return;
    if (isItemUnavailable(burger)) {
      pushUnavailableToast(burger);
      return;
    }
    setState((prev) => ({
      ...prev,
      picked: [
        ...prev.picked,
        { id: burger.id, name: burger.name, img: burger.img, note: "" },
      ],
    }));
  }

  function undoLast() {
    setState((prev) => ({
      ...prev,
      picked: prev.picked.slice(0, -1),
    }));
  }

  function removePick(index) {
    setState((prev) => ({
      ...prev,
      picked: prev.picked.filter((_, i) => i !== index),
    }));
  }

  function resetAll() {
    setState({
      tier: null,
      count: null,
      size: null,
      picked: [],
    });
  }

  useEffect(() => {
    if (tier) scrollToRef(countRef);
  }, [tier]);

  useEffect(() => {
    if (count) scrollToRef(sizeRef);
  }, [count]);

  useEffect(() => {
    if (size) scrollToRef(pickRef);
  }, [size]);

  function addPromoToCart() {
    if (!tier || !count || !size || picked.length !== count || price == null) return;
    if (isClosed) {
      toast.error(closedToastText, {
        key: TOAST_KEYS.STORE_CLOSED_CARRITO,
      });
      return;
    }

    const unavailablePick = picked.find((pick) =>
      isItemUnavailable(burgersById[pick.id]),
    );
    if (unavailablePick) {
      const unavailableBurger = burgersById[unavailablePick.id];
      pushUnavailableToast(unavailableBurger);
      return;
    }

    const names = picked.map((pick) => pick.name || pick.id);
    const key = `promo:${tier}:${count}:${size}:${names.join(",")}:${Date.now()}`;
    const sizeLabel = size === "doble" ? "DOBLES" : "TRIPLES";
    const tierLabel =
      tier === "BASICA" ? "BASICAS" : tier === "PREMIUM" ? "PREMIUM" : "DELUXE";
    const promoLabel = `${count} ${sizeLabel} ${tierLabel}`;

    cart.add({
      key,
      name: promoLabel,
      qty: 1,
      unitPrice: price,
      meta: {
        type: "promo",
        tier,
        count,
        size,
        picks: picked,
      },
    });

    toast.promo(`Promo agregada - ${formatMoney(price)}`, {
      key: "promo-added",
    });
    resetAll();
  }

  return {
    tier,
    count,
    size,
    picked,
    allowedByTier,
    price,
    pickedTotal,
    showSavings,
    savingsValue,
    canPickMore,
    step,
    stepHelp,
    remainingText,
    countRef,
    sizeRef,
    pickRef,
    chooseTier,
    chooseCount,
    chooseSize,
    pickBurger,
    undoLast,
    removePick,
    addPromoToCart,
  };
}
