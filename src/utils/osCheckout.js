// Checkout contra Burger Ya OS (Fase B, solo en pruebas locales).
//
// APAGADO por defecto: sin VITE_OS_FUNCTIONS_URL la web funciona igual que
// siempre (pedido por WhatsApp). Con la variable, el carrito se manda al
// servidor del OS, que recalcula precios, guarda el pedido y devuelve el
// enlace de seguimiento /su-envio/:token.
//
// El OS todavia NO replica promos, cupones ni regalos: si el carrito trae algo
// de eso, este adaptador lo marca como no soportado y el pedido sigue por
// WhatsApp (contingencia del piloto). El servidor ademas compara el total que
// vio el cliente con el suyo y rechaza si no coinciden.

export const OS_FUNCTIONS_URL = import.meta.env.VITE_OS_FUNCTIONS_URL || "";
export const OS_TRACKING_ORIGIN = import.meta.env.VITE_OS_TRACKING_ORIGIN || "";

export function isOsCheckoutEnabled() {
  return Boolean(OS_FUNCTIONS_URL && OS_TRACKING_ORIGIN);
}

const ids = (list) => (list || []).map((x) => x?.id).filter(Boolean);
const PAPAS_KEYS = {
  "papas:chica:solas": "porcion_extra",
  "papas:porcion_extra": "porcion_extra",
  "papas:porcion_grande_solas": "porcion_grande_solas",
};

/**
 * Carrito de la web → líneas del OS (sin precios: los calcula el servidor).
 * @returns {{ lines: object[], unsupported: string|null }}
 */
export function cartToOsLines(items) {
  const lines = [];
  for (const it of items || []) {
    const meta = it.meta || {};
    const qty = Number(it.qty);
    if (meta.type === "burger" && meta.burgerId && meta.size) {
      if (meta.offerId || meta.discountAmount > 0) return { lines: [], unsupported: `${it.name} tiene una oferta` };
      if (meta.cokeGifts?.length || meta.isCokePromo || meta.picks?.length) {
        return { lines: [], unsupported: `${it.name} trae una promo` };
      }
      lines.push({
        type: "burger",
        productId: meta.burgerId,
        size: meta.size,
        qty,
        extraIds: ids(it.extras),
        removedIds: ids(it.removedIngredients),
        papasIds: ids(it.papas),
        ...(it.note ? { note: String(it.note) } : {}),
      });
      continue;
    }
    if (meta.type === "bebida" && String(it.key).startsWith("bebida:")) {
      lines.push({ type: "bebida", productId: String(it.key).slice("bebida:".length), qty });
      continue;
    }
    if (meta.type === "dip" && String(it.key).startsWith("dip:")) {
      lines.push({ type: "dip", productId: String(it.key).slice("dip:".length), qty });
      continue;
    }
    if (meta.type === "papas" && PAPAS_KEYS[it.key] && !(it.papas || []).length) {
      lines.push({ type: "papas", productId: PAPAS_KEYS[it.key], qty });
      continue;
    }
    return { lines: [], unsupported: `${it.name} todavía no se puede pedir por este medio` };
  }
  return { lines, unsupported: lines.length ? null : "carrito vacío" };
}

/** "21:30" de hoy en Argentina (UTC-3 fijo, sin horario de verano) → ISO. */
export function slotToIso(slot, now = new Date()) {
  const m = /^(\d{2}):(\d{2})$/.exec(String(slot || ""));
  if (!m) return null;
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${day}T${m[1]}:${m[2]}:00-03:00`).toISOString();
}

const PAY = { Efectivo: "efectivo", Transferencia: "transferencia", Mixto: "mixto" };

export function buildOsPayload({ idempotencyKey, form, phone, consent, lines, grandTotal }) {
  const isDelivery = form.deliveryMode === "Delivery";
  return {
    idempotencyKey,
    checkout: {
      customer: { name: form.name, phone },
      whatsappConsent: Boolean(consent),
      fulfillment: isDelivery ? "delivery" : "retiro",
      address: isDelivery
        ? {
            text: form.address,
            reference: form.cross || undefined,
            lat: form.selectedLocation?.lat,
            lng: form.selectedLocation?.lng,
          }
        : null,
      scheduledFor: form.whenMode === "Mas tarde" || form.whenMode === "Más tarde" ? slotToIso(form.whenSlot) : null,
      paymentMethod: PAY[form.pay] || "efectivo",
      mixedCashPesos: form.pay === "Mixto" ? Number(form.payCashAmount) || null : null,
      notes: form.notes || undefined,
    },
    lines,
    expectedTotalPesos: grandTotal,
  };
}

// Misma clave mientras el carrito y los datos no cambien: un doble clic o un
// reintento después de un corte no crean dos pedidos.
const KEY_STORAGE = "burgerya:os-checkout-key";
export function idempotencyKeyFor(payloadWithoutKey) {
  const fingerprint = JSON.stringify(payloadWithoutKey);
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(KEY_STORAGE) || "null");
    if (saved?.fingerprint === fingerprint) return saved.key;
    const key = crypto.randomUUID();
    window.sessionStorage.setItem(KEY_STORAGE, JSON.stringify({ fingerprint, key }));
    return key;
  } catch {
    return crypto.randomUUID();
  }
}

/** Llama a createOrder (protocolo callable de Firebase, sin SDK). */
export async function createOsOrder(payload) {
  const res = await fetch(`${OS_FUNCTIONS_URL}/createOrder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    throw new Error(body.error?.message || "No pudimos registrar el pedido. Probá de nuevo o mandalo por WhatsApp.");
  }
  return body.result;
}

export const trackingUrl = (token) => `${OS_TRACKING_ORIGIN}/su-envio/${token}`;
