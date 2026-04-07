import React from "react";

const STORAGE_KEY = "burgerya_carrito_form";

export default function useCarritoCheckoutForm() {
  // Consolidated state
  const [formData, setFormData] = React.useState({
    deliveryMode: "",
    name: "",
    address: "",
    cross: "",
    pay: "Efectivo",
    notes: "",
    whenMode: "Ya",
    whenSlot: "",
  });

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      setFormData((prev) => ({ ...prev, ...saved }));
    } catch {
      // ignore storage errors
    }
  }, []);

  // Persist to localStorage on change
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // ignore storage errors
    }
  }, [formData]);

  // Helper to update individual fields
  const updateField = React.useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    // Consolidated state
    ...formData,

    // Update methods (destructurable)
    updateField,
    setDeliveryMode: (val) => updateField("deliveryMode", val),
    setName: (val) => updateField("name", val),
    setAddress: (val) => updateField("address", val),
    setCross: (val) => updateField("cross", val),
    setPay: (val) => updateField("pay", val),
    setNotes: (val) => updateField("notes", val),
    setWhenMode: (val) => updateField("whenMode", val),
    setWhenSlot: (val) => updateField("whenSlot", val),

    // Full form data for components that need it
    formData,
    setFormData,
  };
}
