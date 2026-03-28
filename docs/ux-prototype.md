# Prototipo UX - Flujo de venta (Burgerya)

> Objetivo: reducir friccion en primera compra con microcopy, jerarquia visual y feedback claro.

## 1) Home (entrada)

**Header**
- Titulo: **Burgerya**
- Subtitulo: "Elegi como queres armar tu pedido"

**Cards (orden recomendado)**
1. Burgers - "Armar pedido por unidad"
2. Promos - "2x / 3x / 4x (Dobles o Triples)"
3. Papas y Mas - "Porciones + cheddar/bacon"
4. Agregados - "Extras para sumar"

**Sticky bar**
- Total del carrito + boton "Ir al carrito" (siempre visible)

---

## 2) Promos (flujo guiado)

**Progress**
```text
Paso 1/4  [oooo] Elegi promo
Paso 2/4  [oooo] Elegi cantidad
Paso 3/4  [oooo] Elegi tamano
Paso 4/4  [oooo] Elegi burgers
```

**Ayuda debajo del titulo**
- "Seguis 4 pasos rapidos para armar tu promo. Te guiamos."

**Microcopy cuando se completa la eleccion**
- "Ya elegiste las X burgers de tu promo."

**CTA final**
- "Agregar promo" (enabled cuando `picked.length === count`)

---

## 3) Carrito (mas guiado)

**Estructura**
1. **Resumen del pedido** (arriba del formulario)
   - Lista corta: "2x Cheeseburger (Doble), 1x Papas"
   - Total destacado
   - Boton secundario: "Editar pedido"

2. **Datos de entrega**
   - Nombre
   - Direccion (placeholder: "Calle y altura")
   - Entre calles (opcional)

3. **Pago y aclaraciones**
   - Pago: Efectivo / Transferencia
   - Campo libre para aclaraciones de entrega

**Feedback de validacion**
- Debajo del CTA: "Falta completar: nombre, direccion"

**CTA**
- Boton principal: "Enviar por WhatsApp"
- Helper text: "Se abrira WhatsApp con tu pedido listo para enviar."

---

## 4) Feedback al agregar

**Toast**
- "Agregado: {nombre del producto}"

**Sticky mini-estado**
- "Ultimo agregado: Bacon x1"

---

## 5) Consistencia de CTA

**Regla**
- Todas las paginas mantienen sticky bar con total + boton "Ir al carrito".
- Boton superior opcional, pero el sticky siempre visible.
