import React from "react";

const STORAGE_KEY = "burgerya_carrito_form";
const VALID_WHEN_OPTIONS = ["Ahora", "Mas tarde"];

// Bump this to force a one-time reset of whenMode for everyone
// (e.g. changing the default). Old storages without this version
// get their whenMode reset instead of being trusted as-is.
const WHEN_MODE_RESET_VERSION = "2026-07-15";
const WHEN_MODE_RESET_KEY = "burgerya_carrito_when_mode_reset_version";

export default function useCarritoCheckoutForm() {
  // Consolidated state
  const [formData, setFormData] = React.useState({
    deliveryMode: "",
    name: "",
    address: "",
    cross: "",
    pay: "Efectivo",
    notes: "",
    whenMode: "Mas tarde",
    whenSlot: "",
  });

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!VALID_WHEN_OPTIONS.includes(saved.whenMode)) {
        saved.whenMode = "Mas tarde";
      }

      const resetVersion = window.localStorage.getItem(WHEN_MODE_RESET_KEY);
      if (resetVersion !== WHEN_MODE_RESET_VERSION) {
        saved.whenMode = "Mas tarde";
        saved.whenSlot = "";
        window.localStorage.setItem(
          WHEN_MODE_RESET_KEY,
          WHEN_MODE_RESET_VERSION,
        );
      }

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
