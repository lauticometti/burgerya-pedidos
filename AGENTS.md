# burgerya-pedidos agent rules

## Trigger phrase
When the user says `dejemos la web limpia`, apply the daily cleanup workflow.

## Daily cleanup workflow
1. Remove temporary campaign copy and badges from the UI.
2. Keep daily burger offers inactive by default:
   - `src/utils/burgerPricing.js`: keep `BURGER_PRICE_OFFERS = []`.
   - `src/pages/Burgers/Burgers.jsx`: keep `TIER_BADGES = {}` unless the user asks for an active badge.
3. Enable all unavailable products:
   - In `src/data/menu.js`, set stock flags used by `withStock(...)` to enabled (`1`).
   - Turn every `isAvailable: 0` into `isAvailable: 1`.
   - This includes any burger, extra, papas, dips, or bebida that is temporarily disabled.
4. Treat "solo por hoy" items as temporary:
   - Keep base prices unchanged while cleaning.
5. Keep the style reusable:
   - Preserve the generic section badge style (`sectionBadge`) so future offers can reuse it without hardcoding a specific promo.
6. Validate before closing:
   - Search for stale temporary promo text with `rg`.
   - Run `npm run build`.
7. If the user asks to push:
   - Commit and push to `main` with a short, clear message.
