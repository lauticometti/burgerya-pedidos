import { formatMoney } from "./formatMoney";

// Que muestra el bloque de envio, como UNA sola linea compacta:
//   [check] Envio · Zona 1                      $1.000
// Logica pura (sin React) para poder testear el texto y la forma sin renderizar.

export const IDLE_HINT = "Buscá tu dirección, usá tu ubicación o marcala en el mapa para ver el costo de envío.";
export const UNCOVERED_TEXT = "Todavía no llegamos a esta ubicación.";

/**
 * @returns {{kind:"idle", text:string} | {kind:"uncovered", text:string}
 *           | {kind:"covered", label:string, price:string}}
 */
export function describeQuote(quote) {
  if (!quote || quote.status === "idle") return { kind: "idle", text: IDLE_HINT };
  if (quote.status === "uncovered") return { kind: "uncovered", text: UNCOVERED_TEXT };
  return {
    kind: "covered",
    label: quote.zoneLabel ? `Envío · ${quote.zoneLabel}` : "Envío",
    price: formatMoney(quote.deliveryPrice),
  };
}
