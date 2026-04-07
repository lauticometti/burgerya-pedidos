# 🔧 CODE CLEANUP TODO - burgerya-pedidos

**Última actualización:** 2026-04-07  
**Estado:** Planning

---

## 📊 RESUMEN EJECUTIVO

- **8 archivos largos** (200+ líneas) que necesitan refactor
- **5+ patrones de código duplicado** (getCategory, indexById, isClosed-guard, etc.)
- **4 áreas con estado fragmentado** (modales, checkout, disponibilidad)
- **10+ oportunidades de abstracción** (utilidades, componentes genéricos)
- **Impacto estimado:** 15-20% reducción de código, +25% mantenibilidad

---

## 🔴 PRIORIDAD CRÍTICA (Hacer primero)

### 1. Consolidar funciones duplicadas de utilidad
**Impacto:** Alto | **Esfuerzo:** Bajo | **Líneas ahorradas:** ~200

- [ ] **getCategory()** - Merging en `src/utils/itemGrouping.js`
  - Actualmente duplicada en: `carritoUtils.js:26-34` y `whatsapp.js:38-46`
  - Acción: Extraer a `utils/itemGrouping.js`, importar en ambos lados

- [ ] **indexById()** - Crear en `src/utils/indexing.js`
  - Patrón repetido 4 veces (burgers, papas, etc.)
  - Acción: Crear función genérica, reemplazar todos los `.reduce(...indexById)`

- [ ] **isClosed guard** - Extraer a `src/hooks/useGuardClosedStore.js`
  - Patrón repetido 10+ veces en Papas, Extras, Combos, Burgers, Bebidas
  - Acción: `useGuardClosedStore(action, toastKey)` retorna `{isBlocked, handle()}`

- [ ] **Item availability** - Extraer a `src/hooks/useItemAvailability.js`
  - Patrón: `isUnavailable = isClosed || isItemUnavailable(item)`
  - Acción: Hook retorna `{isUnavailable, reason}`

---

### 2. Refactor de CartProvider (284 líneas)
**Impacto:** Alto | **Esfuerzo:** Medio | **Complejidad:** Alta

- [ ] Dividir reducer en múltiples archivos por dominio
  - Crear: `store/reducers/burgerReducer.js`
  - Crear: `store/reducers/promoReducer.js`
  - Crear: `store/reducers/papasReducer.js`
  - Mantener: `CartProvider.jsx` solo orquesta

- [ ] Consolidar estado de papas/extras mutation
  - Líneas 38-50, 106-122, 123-143 comparten patrón
  - Acción: Función compartida `mutateItemModifiers()`

---

### 3. Simplificar Carrito.jsx (490 líneas)
**Impacto:** Crítico | **Esfuerzo:** Alto | **Complejidad:** Alta

- [ ] Extraer estado de checkout a hook propio
  - Consolidar 6 useState en un objeto único: `useCheckoutForm()`
  - Problema actual: 12 variables destructuradas en línea 63-80

- [ ] Dividir modales en componentes separados
  - Crear: `components/carrito/ExtrasModalContainer.jsx`
  - Crear: `components/carrito/RemoveIngredientsModalContainer.jsx`
  - Crear: `components/carrito/BebidaModalContainer.jsx`
  - Mantener: Carrito.jsx solo hace layout

- [ ] Extraer cards a subcomponentes
  - Líneas 376-407 contienen múltiples Cards
  - Acción: `components/carrito/CheckoutCards.jsx`

- [ ] Consolidar useEffect de slots
  - Líneas 88-99 vs useStoreStatus() - duplicación
  - Acción: Mover setInterval a useStoreStatus() o hook nuevo

---

### 4. Refactor de BurgerModal.jsx (322 líneas)
**Impacto:** Alto | **Esfuerzo:** Medio

- [ ] Extraer ItemExtrasModal y RemoveIngredientsModal a archivos propios
  - Están definidas inline (líneas 210-280)
  - Acción: Moverlas a `components/burgers/ItemExtrasModal.jsx` y `RemoveIngredientsModal.jsx`

- [ ] Consolidar lógica de selección de extras
  - ItemExtrasModal se usa para: extras, papas, removed
  - Acción: Parámetro `mode` genérico o componentes especializados

---

## 🟡 PRIORIDAD ALTA (Segundo bloque)

### 5. Unificar patrones en páginas de listado
**Impacto:** Medio | **Esfuerzo:** Medio | **Líneas ahorradas:** ~150

- [ ] **Papas.jsx, Extras.jsx, Combos.jsx** - Crear hook genérico
  - Todas tienen: layout igual, isClosed guard igual, modal handling similar
  - Acción: `useListingPage(items, config)` - retorna ready state + handlers

- [ ] Extraer componentes de item comunes
  - `PapasItem`, `BurgerItem`, `HomeCard` - muy similares
  - Acción: Componente genérico `ListItemCard({item, onAction, ...})`

---

### 6. Consolidar WhatsApp formatting (275 líneas)
**Impacto:** Medio | **Esfuerzo:** Medio

- [ ] Dividir `buildWhatsAppText()` en formatters por grupo
  - Crear: `formatters/promo.js`
  - Crear: `formatters/burger.js`
  - Crear: `formatters/combo.js`
  - Crear: `formatters/papas.js`
  - Mantener: `whatsapp.js` solo orquesta

---

### 7. Refactor de usePromoBuilder.js (225 líneas)
**Impacto:** Medio | **Esfuerzo:** Bajo

- [ ] Consolidar estado: `picked`, `tier`, `count`, `size` en objeto único
  - Actualmente: 4 useState separados
  - Acción: `const [state, setState] = useState({picked, tier, count, size})`

- [ ] Extraer función no-hook `pushUnavailableToast()` (línea 96)
  - Moverla a `utils/toastHelpers.js`

---

### 8. Crear Cart Item Factory
**Impacto:** Medio | **Esfuerzo:** Bajo | **Líneas ahorradas:** ~80

Patrón repetido en: `Papas.jsx`, `Extras.jsx`, `Combos.jsx`, `useBebidaModal.js`

```javascript
// Crear: src/utils/cartItemBuilders.js
export function createBebidaItem(bebida) { ... }
export function createPapasItem(papas) { ... }
export function createExtrasItem(extras) { ... }
```

- [ ] Reemplazar 4 instancias de `cart.add({...})` con factory calls

---

## 🟢 PRIORIDAD MEDIA (Tercero)

### 9. Consolidar validadores de formulario
**Impacto:** Bajo-Medio | **Esfuerzo:** Bajo | **Líneas ahorradas:** ~40

- [ ] Extraer `src/utils/checkoutValidators.js`
  - `validateDeliveryMode()`, `validateAddress()`, etc.
  - Usar en: `useCheckoutValidation.js` y `useCarritoCheckoutForm.js`

---

### 10. Normalizar toast keys
**Impacto:** Bajo | **Esfuerzo:** Bajo

- [ ] Crear enum/const en `src/constants/toastKeys.js`
  - `STORE_CLOSED_BURGER`, `ITEM_UNAVAILABLE_PAPAS`, etc.
  - Reemplazar strings hardcoded en 20+ lugares

---

### 11. Refactor CartItemCard.jsx (266 líneas)
**Impacto:** Bajo-Medio | **Esfuerzo:** Bajo

- [ ] Extraer renderizado de modificadores
  - Líneas 116-126 repetidas para extras, papas, removed
  - Acción: Componente `ItemModifiersDisplay({item})`

---

## 📋 ARCHIVOS QUE NECESITAN REVISIÓN

| Archivo | Líneas | Problemas | Prioridad |
|---------|--------|-----------|-----------|
| `Carrito.jsx` | 490 | Muy largo, múltiples hooks, modales inline | 🔴 |
| `whatsapp.js` | 275 | Muy largo, pode dividirse en formatters | 🟡 |
| `Burgers.jsx` | 337 | Largo, lógica de modal compleja | 🟡 |
| `CartProvider.jsx` | 284 | Muy largo, puede dividirse por dominio | 🔴 |
| `BurgerModal.jsx` | 322 | Modales inline, logica dispersa | 🔴 |
| `usePromoBuilder.js` | 225 | Estado fragmentado | 🟡 |
| `CartItemCard.jsx` | 266 | Puede extraer subcomponentes | 🟢 |
| `Papas.jsx` | 200+ | Código repetido con Extras/Combos | 🟡 |

---

## 🎯 ORDEN RECOMENDADO DE EJECUCIÓN

**Fase 1 (Utilidades - sin riesgos):**
1. Crear `utils/itemGrouping.js` + consolidar getCategory
2. Crear `utils/indexing.js` + reemplazar patrones indexById
3. Crear `utils/cartItemBuilders.js` + reemplazar factory patterns
4. Crear `constants/toastKeys.js` (refactor mecánico)

**Fase 2 (Hooks - riesgo bajo):**
5. Crear `hooks/useGuardClosedStore.js` - usar en 5+ páginas
6. Crear `hooks/useItemAvailability.js` - usar en 15+ lugares
7. Refactor `usePromoBuilder.js` - consolidar estado
8. Refactor `useCheckoutValidation.js` + `useCarritoCheckoutForm.js`

**Fase 3 (Componentes - riesgo medio):**
9. Dividir `CartProvider.jsx` en reducers separados
10. Extraer modales de `BurgerModal.jsx`
11. Simplificar `Carrito.jsx` (después de fase 2)
12. Refactor `Papas.jsx`, `Extras.jsx`, `Combos.jsx` con hook genérico

**Fase 4 (Limpieza - bajo riesgo):**
13. Dividir `whatsapp.js` en formatters
14. Refactor `CartItemCard.jsx` - extraer subcomponentes

---

## 📈 MÉTRICAS DE ÉXITO

- [ ] Reducir líneas de código: 490 (Carrito) → ~300, 284 (CartProvider) → ~180
- [ ] Eliminar 5+ copias de funciones duplicadas
- [ ] 0 imports no utilizados
- [ ] Estado consolidado: 6 useState → 1-2 por hook
- [ ] 3 páginas de listado → 1 hook + configuración
- [ ] Tests pasando antes y después de cada fase

---

## 🚀 SIGUIENTE PASO

Usuario dirá cuándo empezar y en qué orden de las Fases 1-4.
Una vez aprobado este plan, procederemos con **Fase 1** (utilidades).
