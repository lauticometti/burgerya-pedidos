import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "../../utils/toast.js";
import { getBurgerPrice } from "../../utils/burgerPricing.js";
import { formatMoney } from "../../utils/formatMoney.js";
import {
  getUnavailableReason,
  isItemUnavailable,
} from "../../utils/availability.js";
import { getStepHelp } from "./promosConfig.js";
import { groupAllowedBurgers, indexBurgersById } from "./promosSelectors.js";

function scrollToRef(ref) {
  if (!ref?.current) return;
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const offset = 96;
    const target = rect.top + window.scrollY - offset;
    const start = window.scrollY;
    const distance = target - start;

    if (Math.abs(distance) < 8) {
      window.scrollTo(0, target);
      return;
    }

    const duration = 500;
    let startTime = null;

    function stepScroll(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, start + distance * ease);
      if (progress < 1) window.requestAnimationFrame(stepScroll);
    }

    window.requestAnimationFrame(stepScroll);
  }, 80);
}

function pushUnavailableToast(item) {
  const reason = getUnavailableReason(item);
  toast.error(`${item.name}: ${reason}`, {
    key: `promo-unavailable:${item.id}`,
  });
}

export default function usePromoBuilder({
  burgers,
  promoPrices,
  promoRules,
  cart,
}) {
  const [tier, setTier] = useState(null); // BASICA | PREMIUM | DELUXE
  const [count, setCount] = useState(null); // 2 | 3 | 4
  const [size, setSize] = useState(null); // doble | triple
  const [picked, setPicked] = useState([]); // { id, name, note }

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
    setTier(nextTier);
    setCount(null);
    setSize(null);
    setPicked([]);
  }

  function chooseCount(nextCount) {
    setCount(nextCount);
    setPicked([]);
  }

  function chooseSize(nextSize) {
    setSize(nextSize);
    setPicked([]);
  }

  function pickBurger(burger) {
    if (!canPickMore) return;
    if (isItemUnavailable(burger)) {
      pushUnavailableToast(burger);
      return;
    }
    setPicked((prev) => [...prev, { id: burger.id, name: burger.name, note: "" }]);
  }

  function undoLast() {
    setPicked((prev) => prev.slice(0, -1));
  }

  function removePick(index) {
    setPicked((prev) => prev.filter((_, i) => i !== index));
  }

  function resetAll() {
    setTier(null);
    setCount(null);
    setSize(null);
    setPicked([]);
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
