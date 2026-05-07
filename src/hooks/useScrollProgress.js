import React from "react";

export function useScrollProgress(ref) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) { setProgress(0); return; }
      setProgress(el.scrollLeft / max);
    }

    el.addEventListener("scroll", update, { passive: true });
    update();
    return () => el.removeEventListener("scroll", update);
  }, [ref]);

  return progress;
}
