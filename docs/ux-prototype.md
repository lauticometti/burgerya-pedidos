# Prototipo UX – Flujo de venta (Burgerya)

> Objetivo: reducir fricción en primera compra con microcopy, jerarquía visual y feedback claro.

## 1) Home (entrada)

**Header**
- Título: **Burgerya**
- Subtítulo: “Elegí cómo querés armar tu pedido”

**Cards (orden recomendado)**
1. 🍔 Burgers — “Armar pedido por unidad”
2. 🔥 Promos — “2x / 3x / 4x (Dobles o Triples)”
3. 🍟 Papas y Más — “Porciones + cheddar/bacon”
4. ➕ Agregados — “Extras para sumar”

**Sticky bar**
- Total del carrito + botón **“Ir al carrito”** (siempre visible)

---

## 2) Promos (flujo guiado)

**Progress**
```
Paso 1/4  [●○○○] Elegí promo
Paso 2/4  [●●○○] Elegí cantidad
Paso 3/4  [●●●○] Elegí tamaño
Paso 4/4  [●●●●] Elegí burgers
```

**Ayuda debajo del título**
- “Seguís 4 pasos rápidos para armar tu promo. Te guiamos.”

**Microcopy cuando se completa la elección**
- “Ya elegiste las X burgers de tu promo.”

**CTA final**
- “Agregar promo” (enabled cuando `picked.length === count`)

---

## 3) Carrito (más guiado)

**Estructura**
1. **Resumen del pedido** (arriba del formulario)
   - Lista corta: “2x Cheeseburger (Doble), 1x Papas”
   - Total destacado
   - Botón secundario: “Editar pedido”

2. **Datos de entrega**
   - Nombre
   - Dirección (placeholder: “Calle y altura”)
   - Entre calles (opcional)

3. **Pago y horario**
   - Pago: Efectivo / Transferencia
   - Horario: “Lo antes posible” / “Para más tarde”
   - Si “Más tarde”, select con horarios disponibles

**Feedback de validación**
- Debajo del CTA: “Falta completar: nombre, dirección”

**CTA**
- Botón principal: “Enviar por WhatsApp”
- Helper text: “Se abrirá WhatsApp con tu pedido listo para enviar.”

---

## 4) Feedback al agregar

**Toast**
- “Agregado: {nombre del producto}”

**Sticky mini-estado**
- “Último agregado: Bacon x1”

---

## 5) Consistencia de CTA

**Regla**
- Todas las páginas mantienen sticky bar con total + botón "Ir al carrito".
- Botón superior opcional, pero el sticky siempre visible.



