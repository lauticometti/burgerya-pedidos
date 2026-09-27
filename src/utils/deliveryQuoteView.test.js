import { describe, it, expect } from "vitest";
import { describeQuote, UNCOVERED_TEXT } from "./deliveryQuoteView";
import quoteCardSource from "../components/carrito/DeliveryQuoteCard.jsx?raw";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const quoteCardCss = readFileSync(
  fileURLToPath(new URL("../components/carrito/DeliveryQuoteCard.module.css", import.meta.url)),
  "utf8",
);

const covered = { status: "covered", covered: true, zoneId: "z1", zoneLabel: "Zona 1", deliveryPrice: 1000 };
const uncovered = { status: "uncovered", covered: false, zoneId: null, zoneLabel: null, deliveryPrice: null };

// Cuerpo de una regla CSS (".nombre { ... }"); sirve para las reglas simples y compartidas.
function rule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|\\n)\\s*(?:[^{}]*,\\s*)?${escaped}\\s*(?:,[^{]*)?\\{([^}]*)\\}`).exec(css);
  return match ? match[1] : "";
}

describe("describeQuote: la cotizacion cubierta es UNA linea", () => {
  it("cubierto: 'Envío · Zona 1' + precio, sin el titulo grande ni lineas separadas", () => {
    expect(describeQuote(covered)).toEqual({ kind: "covered", label: "Envío · Zona 1", price: "$1.000" });
  });

  it("el precio sale formateado con el separador de miles", () => {
    expect(describeQuote({ ...covered, zoneLabel: "Zona 4", deliveryPrice: 2500 })).toMatchObject({ label: "Envío · Zona 4", price: "$2.500" });
  });

  it("sin nombre de zona igual muestra 'Envío' y el precio", () => {
    expect(describeQuote({ ...covered, zoneLabel: null })).toMatchObject({ label: "Envío", price: "$1.000" });
  });
});

describe("describeQuote: fuera de cobertura y sin cotizacion", () => {
  it("fuera de cobertura: 'Todavía no llegamos a esta ubicación.'", () => {
    expect(describeQuote(uncovered)).toEqual({ kind: "uncovered", text: "Todavía no llegamos a esta ubicación." });
    expect(UNCOVERED_TEXT).toBe("Todavía no llegamos a esta ubicación.");
  });

  it("sin cotizacion muestra la ayuda", () => {
    expect(describeQuote(null).kind).toBe("idle");
    expect(describeQuote({ status: "idle" }).kind).toBe("idle");
  });
});

describe("DeliveryQuoteCard: forma compacta (sin card gigante)", () => {
  it("cubierto: una sola fila con icono SVG, etiqueta y precio; sin las piezas de la card vieja", () => {
    for (const old of ["LLEGAMOS A TU DIRECCIÓN", "styles.zone", "styles.row", "styles.check"]) {
      expect(quoteCardSource).not.toContain(old);
    }
    expect(quoteCardSource).toContain("styles.covered");
    expect(quoteCardSource).toContain("styles.label");
    expect(quoteCardSource).toContain("styles.price");
    expect(quoteCardSource).toContain("CheckCircleIcon");
    expect(quoteCardSource).not.toMatch(/[\u{1F300}-\u{1FAFF}✅✔❌]/u); // sin emojis
  });

  it("cubierto: fila flex de una linea, baja (sin grid en columna ni padding de card)", () => {
    const body = rule(quoteCardCss, ".covered");
    expect(body).toMatch(/display:\s*flex/);
    expect(body).not.toMatch(/display:\s*grid/);
    // la regla compartida define la altura chica
    const shared = rule(quoteCardCss, ".uncovered");
    expect(shared).toMatch(/min-height:\s*(3\d|40)px/);
    const padding = /padding:\s*(\d+)px\s+(\d+)px/.exec(shared);
    expect(Number(padding[1])).toBeLessThanOrEqual(8);
  });

  it("el precio va destacado (mas grande, en negrita y color de acento) y no se parte", () => {
    const body = rule(quoteCardCss, ".price");
    expect(Number(/font-size:\s*(\d+)px/.exec(body)[1])).toBeGreaterThanOrEqual(16);
    expect(body).toMatch(/font-weight:\s*[89]00/);
    expect(body).toMatch(/color:\s*var\(--y\)/);
    expect(body).toMatch(/white-space:\s*nowrap/);
  });

  it("fuera de cobertura: tambien compacto, en una fila con icono SVG", () => {
    expect(quoteCardSource).toContain("styles.uncovered");
    expect(quoteCardSource).toContain("AlertCircleIcon");
    const shared = rule(quoteCardCss, ".uncovered");
    expect(shared).toMatch(/display:\s*flex/);
    expect(shared).toMatch(/min-height:\s*(3\d|40)px/);
  });
});
