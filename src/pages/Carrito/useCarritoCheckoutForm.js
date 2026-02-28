import React from "react";

const STORAGE_KEY = "burgerya_carrito_form";

export default function useCarritoCheckoutForm() {
  const [deliveryMode, setDeliveryMode] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [cross, setCross] = React.useState("");
  const [pay, setPay] = React.useState("Efectivo");
  const [notes, setNotes] = React.useState("");
  const [whenMode, setWhenMode] = React.useState("Ahora");
  const [whenSlot, setWhenSlot] = React.useState("");

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (saved?.name) setName(saved.name);
      if (saved?.address) setAddress(saved.address);
      if (saved?.cross) setCross(saved.cross);
      if (saved?.pay) setPay(saved.pay);
      if (saved?.deliveryMode) setDeliveryMode(saved.deliveryMode);
      if (saved?.notes) setNotes(saved.notes);
      if (saved?.whenMode) setWhenMode(saved.whenMode);
      if (saved?.whenSlot) setWhenSlot(saved.whenSlot);
    } catch {
      // ignore storage errors
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;

    const payload = {
      name,
      address,
      cross,
      pay,
      deliveryMode,
      notes,
      whenMode,
      whenSlot,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [name, address, cross, pay, deliveryMode, notes, whenMode, whenSlot]);

  return {
    deliveryMode,
    setDeliveryMode,
    name,
    setName,
    address,
    setAddress,
    cross,
    setCross,
    pay,
    setPay,
    notes,
    setNotes,
    whenMode,
    setWhenMode,
    whenSlot,
    setWhenSlot,
  };
}
