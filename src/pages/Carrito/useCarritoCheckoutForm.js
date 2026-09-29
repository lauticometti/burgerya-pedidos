import React from "react";
import { DELIVERY_ENABLED } from "../../data/menu";

const STORAGE_KEY = "burgerya_carrito_form";
const VALID_WHEN_OPTIONS = ["Ahora", "Mas tarde"];

// Bump this to force a one-time reset of whenMode for everyone
// (e.g. changing the default). Old storages without this version
// get their whenMode reset instead of being trusted as-is.
const WHEN_MODE_RESET_VERSION = "2026-07-15b";
const WHEN_MODE_RESET_KEY = "burgerya_carrito_when_mode_reset_version";

export default function useCarritoCheckoutForm() {
  // Consolidated state
  const [formData, setFormData] = React.useState({
    deliveryMode: DELIVERY_ENABLED ? "" : "Retiro",
    name: "",
    address: "",
    // Ubicacion resuelta: { lat, lng, source } donde source es "search",
    // "geolocation" o "map". null hasta que se resuelve una ubicacion
    // puntual por alguno de los tres metodos — nunca se infiere de texto
    // libre para no cotizar sobre datos viejos.
    selectedLocation: null,
    cross: "",
    pay: "Efectivo",
    // Mixto: solo se guarda el efectivo; la transferencia se deriva del total
    // (ver resolveMixedPayment en utils/checkoutTotals).
    payCashAmount: "",
    notes: "",
    whenMode: "Ahora",
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
        saved.whenMode = "Ahora";
      }

      if (!DELIVERY_ENABLED && saved.deliveryMode === "Delivery") {
        saved.deliveryMode = "Retiro";
        saved.cross = "";
      }

      // La ubicacion (y su direccion) NO se restauran: hay que confirmarlas en
      // cada visita. Restaurarlas dejaba una cotizacion vieja pegada y hacia
      // que el mapa abriera en un pin de una prueba anterior. Tambien limpia
      // lo que hayan guardado versiones anteriores.
      delete saved.selectedLocation;
      delete saved.addressCoords;
      delete saved.address;
      delete saved.payTransferAmount; // versiones viejas: ahora es derivado

      const resetVersion = window.localStorage.getItem(WHEN_MODE_RESET_KEY);
      if (resetVersion !== WHEN_MODE_RESET_VERSION) {
        saved.whenMode = "Ahora";
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
      // Sin ubicacion ni direccion: se confirman en cada visita (ver arriba).
      const { selectedLocation: _location, address: _address, ...persistable } = formData;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
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
    // Editar el texto a mano invalida cualquier ubicacion resuelta antes —
    // nunca dejamos una cotizacion vieja pegada a una direccion nueva.
    setAddress: (val) =>
      setFormData((prev) => ({ ...prev, address: val, selectedLocation: null })),
    setSelectedLocation: (loc) => updateField("selectedLocation", loc),
    // Escribe el texto de la direccion SIN invalidar la ubicacion (lo usa la
    // direccion que se obtiene del pin / la ubicacion actual).
    setAddressLabel: (val) => updateField("address", val),
    setCross: (val) => updateField("cross", val),
    setPay: (val) => updateField("pay", val),
    setPayCashAmount: (val) => updateField("payCashAmount", val),
    setNotes: (val) => updateField("notes", val),
    setWhenMode: (val) => updateField("whenMode", val),
    setWhenSlot: (val) => updateField("whenSlot", val),

    // Full form data for components that need it
    formData,
    setFormData,
  };
}
