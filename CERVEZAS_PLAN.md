# Plan: Sección Cervezas — Burgerya Pedidos

## Contexto

Se incorporan cervezas al menú de Burgerya. El cliente quiere que aparezcan en un tab nuevo llamado **"Cervezas"**, separado de Bebidas (que tiene las Cocas). No hay fotos todavía — se usarán placeholders hasta que el cliente las provea.

---

## Items a agregar

| Cerveza        | Tamaño     | Precio  |
|----------------|------------|---------|
| Stella Artois  | Porrón 330ml | $3.500 |
| Corona         | Porrón 330ml | $4.000 |
| Heineken       | Porrón 330ml | $4.000 |

---

## Diseño propuesto

El tab "Cervezas" seguirá el mismo patrón visual que "Bebidas":
- Tarjetas horizontales compactas (misma altura y layout)
- Imagen de la cerveza a la derecha (placeholder hasta tener fotos reales)
- Nombre + precio a la izquierda
- Scroll horizontal tipo caroussel
- Mismas clases CSS ya existentes → sin trabajo de diseño adicional

**Barra de navegación actualizada:**
```
Burgers  |  Papas  |  Dips  |  Bebidas  |  Cervezas  ← nuevo
```

**Ver preview visual:** abrir `cervezas-preview.html` en el navegador

---

## Archivos a modificar

### 1. `src/data/menu.js`
Agregar al final del archivo:
```js
export const cervezas = [
  { id: "stella", name: "Stella Artois", subtitle: "Porrón 330ml", price: 3500, isAvailable: 1, img: null },
  { id: "corona", name: "Corona",        subtitle: "Porrón 330ml", price: 4000, isAvailable: 1, img: null },
  { id: "heineken", name: "Heineken",    subtitle: "Porrón 330ml", price: 4000, isAvailable: 1, img: null },
];
```
Cuando lleguen las fotos: agregar `img: "/cervezas/stella.svg"` etc.

---

### 2. `src/pages/Menu/SectionNav.jsx`
Agregar a la lista de tabs:
```js
{ id: "cervezas", label: "Cervezas" }
```

---

### 3. `src/pages/Menu/Menu.jsx`
- Importar `cervezas` desde `menu.js`
- Agregar refs: `cervezasRef`, `cervezasScrollRef`
- Registrar en el scroll tracker y en `scrollToSection()`
- Copiar el bloque JSX de Bebidas, adaptarlo para cervezas
- Usar `key: \`cerveza:\${item.id}\`` en el cart

---

### 4. `src/utils/cartItemBuilders.js` (opcional)
```js
export function createCervezaItem(cerveza, qty = 1) {
  return {
    key: `cerveza:${cerveza.id}`,
    name: cerveza.name,
    qty,
    unitPrice: cerveza.price,
    meta: { type: "cerveza" },
  };
}
```

---

## Para el director creativo: decisiones de diseño pendientes

1. **Placeholder de imágenes** — ¿qué mostrar mientras no hay fotos?
   - Opción A: Emoji 🍺 centrado en el espacio de imagen
   - Opción B: Icono genérico de botella (SVG simple)
   - Opción C: Fondo de color por marca (verde Heineken, dorado Corona, rojo Stella)

2. **¿El tab "Cervezas" lleva algún ícono o badge especial?**
   - Por ejemplo: 🍺 antes del label, o un badge "NUEVO"

3. **¿Las cervezas aparecen también en el carrito como "Cervezas" o bajo "Bebidas"?**
   - Actualmente las bebidas se agrupan como categoría única en el resumen del pedido de WhatsApp

4. **Imágenes finales** — ¿SVG ilustración estilo marca o foto real recortada en PNG?
   - El resto del menú usa SVGs ilustrativos para consistencia visual

---

## Orden de implementación

1. Agregar datos en `menu.js`
2. Agregar tab en `SectionNav.jsx`
3. Implementar sección en `Menu.jsx`
4. Testear en la web (dev server)
5. Push a main → deploy automático en Vercel
6. Cuando lleguen las fotos: agregar imágenes a `/public/cervezas/` y actualizar `img` en `menu.js`

---

*Estimado de implementación: ~45 minutos — la mayor parte es copiar el patrón existente de Bebidas.*
