/**
 * Helper functions for promo builder extracted from usePromoBuilder
 */

import { getUnavailableReason } from "./availability";
import { toast } from "./toast";

/**
 * Smooth scroll to element with easing
 * @param {React.MutableRefObject} ref - Element reference to scroll to
 */
export function scrollToRef(ref) {
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

/**
 * Show toast for unavailable promo item
 * @param {Object} item - Item that's unavailable
 */
export function pushUnavailableToast(item) {
  const reason = getUnavailableReason(item);
  toast.error(`${item.name}: ${reason}`, {
    key: `promo-unavailable:${item.id}`,
  });
}
