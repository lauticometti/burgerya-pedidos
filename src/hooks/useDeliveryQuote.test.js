import { describe, it, expect } from "vitest";
import { computeDeliveryQuote, deliveryPriceFor } from "./useDeliveryQuote";

// Coordenadas ya verificadas contra el motor real en la reconstruccion de
// fronteras (misma fuente que deliveryZones.test.js).
const PUNTO_Z1 = { lat: -34.600409, lng: -58.64632975 }; // Malaspina, interior Z1 ($1000)
const PUNTO_FUERA = { lat: -34.6489, lng: -58.6564 }; // Leloir, fuera de cobertura

describe("computeDeliveryQuote", () => {
  it("sin direccion resuelta (coords null) da idle, incluso en modo Delivery", () => {
    const quote = computeDeliveryQuote(null, "Delivery");
    expect(quote.status).toBe("idle");
    expect(quote.deliveryPrice).toBe(null);
  });

  it("en modo Retiro da idle aunque haya coords cargadas", () => {
    const quote = computeDeliveryQuote(PUNTO_Z1, "Retiro");
    expect(quote.status).toBe("idle");
    expect(quote.deliveryPrice).toBe(null);
  });

  it("Delivery + direccion cubierta da status covered con precio y zona", () => {
    const quote = computeDeliveryQuote(PUNTO_Z1, "Delivery");
    expect(quote.status).toBe("covered");
    expect(quote.covered).toBe(true);
    expect(quote.deliveryPrice).toBe(1000);
    expect(quote.zoneLabel).toBe("Zona 1");
  });

  it("Delivery + direccion fuera de cobertura da status uncovered, sin precio inventado", () => {
    const quote = computeDeliveryQuote(PUNTO_FUERA, "Delivery");
    expect(quote.status).toBe("uncovered");
    expect(quote.covered).toBe(false);
    expect(quote.deliveryPrice).toBe(null);
  });

  it("cambiar de direccion (coords -> null) vuelve a idle, nunca deja pegado el precio anterior", () => {
    const conDireccion = computeDeliveryQuote(PUNTO_Z1, "Delivery");
    expect(conDireccion.status).toBe("covered");
    // esto es lo que hace setAddress() al tipear una direccion nueva: pone
    // selectedLocation en null antes de tener una nueva resuelta
    const trasCambiarTexto = computeDeliveryQuote(null, "Delivery");
    expect(trasCambiarTexto.status).toBe("idle");
    expect(trasCambiarTexto.deliveryPrice).toBe(null);
  });
});

describe("deliveryPriceFor", () => {
  it("Delivery valido suma el precio de la zona", () => {
    const quote = computeDeliveryQuote(PUNTO_Z1, "Delivery");
    expect(deliveryPriceFor(quote, "Delivery")).toBe(1000);
  });

  it("Retiro nunca suma envio, aunque haya una zona resuelta", () => {
    const quote = computeDeliveryQuote(PUNTO_Z1, "Delivery");
    // simula el caso borde: el usuario resolvio una direccion y despues
    // cambio a Retiro sin que se haya limpiado el quote todavia
    expect(deliveryPriceFor(quote, "Retiro")).toBe(0);
  });

  it("fuera de cobertura no suma nada", () => {
    const quote = computeDeliveryQuote(PUNTO_FUERA, "Delivery");
    expect(deliveryPriceFor(quote, "Delivery")).toBe(0);
  });

  it("sin direccion resuelta no suma nada", () => {
    const quote = computeDeliveryQuote(null, "Delivery");
    expect(deliveryPriceFor(quote, "Delivery")).toBe(0);
  });
});

describe("selectedLocation: una sola fuente final sin importar el metodo", () => {
  const PUNTO_Z9 = { lat: -34.58314165, lng: -58.61510456 }; // Altos de Podesta, $6000

  it("busqueda, geolocation y mapa con las mismas coordenadas dan exactamente la misma cotizacion", () => {
    const porBusqueda = computeDeliveryQuote({ ...PUNTO_Z1, source: "search" }, "Delivery");
    const porGeolocation = computeDeliveryQuote({ ...PUNTO_Z1, source: "geolocation" }, "Delivery");
    const porMapa = computeDeliveryQuote({ ...PUNTO_Z1, source: "map" }, "Delivery");
    expect(porBusqueda).toEqual(porGeolocation);
    expect(porBusqueda).toEqual(porMapa);
    expect(porMapa.deliveryPrice).toBe(1000);
  });

  it("mover el pin del mapa de una zona a otra cambia zona y precio de inmediato, sin arrastrar el anterior", () => {
    const antes = computeDeliveryQuote({ ...PUNTO_Z1, source: "map" }, "Delivery");
    const despues = computeDeliveryQuote({ ...PUNTO_Z9, source: "map" }, "Delivery");
    expect(antes.deliveryPrice).toBe(1000);
    expect(despues.deliveryPrice).toBe(6000);
    expect(despues.zoneId).not.toBe(antes.zoneId);
  });

  it("mover el pin fuera de cobertura quita el precio (nunca deja el de la ubicacion anterior)", () => {
    const cubierta = computeDeliveryQuote({ ...PUNTO_Z1, source: "map" }, "Delivery");
    const fuera = computeDeliveryQuote({ ...PUNTO_FUERA, source: "map" }, "Delivery");
    expect(cubierta.status).toBe("covered");
    expect(fuera.status).toBe("uncovered");
    expect(fuera.deliveryPrice).toBe(null);
    expect(deliveryPriceFor(fuera, "Delivery")).toBe(0);
  });

  it("una seleccion nueva por otro metodo reemplaza por completo a la anterior (mapa -> busqueda)", () => {
    const mapa = computeDeliveryQuote({ ...PUNTO_FUERA, source: "map" }, "Delivery");
    const busqueda = computeDeliveryQuote({ ...PUNTO_Z1, source: "search" }, "Delivery");
    expect(mapa.status).toBe("uncovered");
    expect(busqueda.status).toBe("covered");
    expect(busqueda.deliveryPrice).toBe(1000);
  });

  it("pasar a Retiro elimina el envio aunque haya una ubicacion elegida", () => {
    const seleccion = { ...PUNTO_Z1, source: "geolocation" };
    const quote = computeDeliveryQuote(seleccion, "Retiro");
    expect(quote.status).toBe("idle");
    expect(deliveryPriceFor(quote, "Retiro")).toBe(0);
  });
});
