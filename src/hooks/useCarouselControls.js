import React from "react";

export function useCarouselControls(scrollRef, step = 320) {
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const isDragging = React.useRef(false);
  const dragStartX = React.useRef(0);
  const dragScrollLeft = React.useRef(0);

  const updateArrows = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, [scrollRef]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);

    function handleWheel(e) {
      // Scroll horizontal nativo (trackpad horizontal o Ctrl+rueda): interceptar
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Ya es horizontal — dejar que el browser lo maneje solo
        return;
      }
      if (e.ctrlKey) {
        // Ctrl+rueda: convertir a scroll horizontal
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.5;
        return;
      }
      // Scroll vertical puro: no interferir, dejar que scrollee la página
    }
    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", updateArrows);
      el.removeEventListener("wheel", handleWheel);
      ro.disconnect();
    };
  }, [scrollRef, updateArrows]);

  function scrollPrev() {
    scrollRef.current?.scrollBy({ left: -step, behavior: "smooth" });
  }

  function scrollNext() {
    scrollRef.current?.scrollBy({ left: step, behavior: "smooth" });
  }

  function onMouseDown(e) {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
    el.style.scrollSnapType = "none";
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  }

  function onMouseMove(e) {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = dragScrollLeft.current - (x - dragStartX.current);
  }

  function stopDrag() {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = scrollRef.current;
    if (!el) return;
    el.style.scrollSnapType = "";
    el.style.cursor = "";
    el.style.userSelect = "";
  }

  return {
    canScrollLeft,
    canScrollRight,
    scrollPrev,
    scrollNext,
    onMouseDown,
    onMouseMove,
    onMouseUp: stopDrag,
    onMouseLeave: stopDrag,
  };
}
