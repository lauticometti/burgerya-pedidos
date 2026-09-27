// crypto.randomUUID() solo existe en contextos seguros (https o localhost).
// Abriendo la web por http desde otro dispositivo (ej. http://192.168.x.x en
// un celular durante pruebas) no esta definido y rompe la busqueda antes de
// mandar ninguna request. crypto.getRandomValues, en cambio, funciona en
// cualquier contexto.
export function safeRandomUUID() {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();

  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10).join("")}`;
}
