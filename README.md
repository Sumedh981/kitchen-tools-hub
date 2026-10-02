# Ledger — Kitchen Tools Hub

A single GitHub Pages site with a home page, 8 tools, and a privacy page, sharing one GA4
property so you can compare tools against each other by `page_path`.

## Folder structure
```
/
├── index.html              home page (tool grid)
├── shared.css               theme + nav used on every page
├── shared.js                fireEvent() wrapper + nav toggle, used on every page
├── recipe-calculator/       servings scaling, cooking time
├── recipe-cost-calculator/  ingredient cost, budget, chart, samples
├── nutrition-calculator/    calories/protein/carbs/fat per serving
├── baking-calculator/       pan size, oven temp, baker's percentage
├── unit-converter/          volume, weight, temperature
├── ingredient-substitutions/ searchable substitute list
├── shopping-list/           persistent checklist
├── finance/                 budget tracker, cook-vs-eat-out, price tracker, batch planner, household split
└── privacy/                 plain-language privacy notice (GA4, local storage, mock subscription)
```
Each tool folder has its own `index.html` + `app.js` (and sometimes
`data.js`, `calculator.js`, etc. for the more complex Recipe Cost
Calculator). Every page loads `../shared.css` and `../shared.js`.

## Run locally
```
cd kitchen-hub
python3 -m http.server 8000
```
Open `http://localhost:8000` — the home page links to every tool.

## Deploy on GitHub Pages
1. Push the **entire folder structure** (not just files at root) to a repo's `main` branch — keep all subfolders intact.
2. Settings → Pages → Source → Deploy from branch → `main` → `/(root)`.
3. Live at `https://<username>.github.io/<repo-name>/`.

## Set up GA4 (one property for the whole hub)
1. analytics.google.com → Admin → Create Property → one Web data stream for your GitHub Pages domain.
2. Copy the Measurement ID.
3. The Measurement ID now lives in **one place only**: the `GA_MEASUREMENT_ID` constant near the top of `shared.js`. This copy already has `G-09E1QM5JD5` set there — if you ever change GA4 properties, update that one line and every page picks it up automatically. (Each page's `<head>` still references the ID in a comment for clarity, but it's not what the code actually reads.)
4. Remember: GA4 only starts recording once a visitor clicks **Accept** on the cookie banner (see "Cookie consent" below) — test by accepting it yourself on `localhost`.
5. Once accepted, GA4 auto-logs `page_view` with `page_path` on every load — this is what lets you compare tools without any extra code.

## Cookie consent + privacy notice
Every page defaults GA4's Consent Mode to `analytics_storage: 'denied'`
on load. The actual `gtag.js` script — the thing that sets cookies and
sends data to Google — is only injected (from `shared.js`) after the
visitor clicks **Accept** on the banner at the bottom of the screen.
Clicking **Decline** records that choice and GA4 never loads for that
visitor. The choice is stored in `localStorage` (`cookieConsent`), so
the banner only shows once per browser.

A `privacy/` page explains in plain language what GA4 collects, what's
stored only in the browser (recipes, shopping list, budget data), and
that the Premium plan is simulated — no real payment is ever involved.
It's linked from the consent banner, the nav, and the home page.

Note for your write-up: because tracking requires consent, your actual
GA4 data will only include visitors who clicked Accept — expect the
numbers to undercount total visits to the site. That's normal and
worth mentioning in your methodology section.

## Mock subscription model
There is no real payment anywhere in this site — it's a simulated
Free/Premium flag in `localStorage` (`subscriptionStatus`), built so
you can analyze a monetization funnel in GA4. Logic lives in
`shared.js` (`Subscription` object + `showPaywall()`), used on any
page that gates a feature.

**What's gated:**
- Recipe Cost Calculator — saving beyond 3 recipes
- Finance — 4 of 5 sections (Grocery Budget Tracker stays free; Cook vs
  Eat Out, Price Tracker, Batch-Cost Planner, Household Split are Premium)

**How to test it:** hit a locked feature → paywall modal appears →
click "Subscribe (simulated)" → flag flips to Premium, locked sections
unlock immediately, badge in the nav updates. Click the badge again to
"cancel" and go back to Free.

| Event | Fires when |
|---|---|
| `paywall_viewed` | a locked feature is shown/attempted (`feature` param identifies which) |
| `upgrade_clicked` | "Subscribe" clicked inside the paywall modal |
| `subscription_started` | the simulated subscribe completes |
| `subscription_cancelled` | the plan badge is used to cancel |

**Funnel to build in GA4**: `paywall_viewed` → `upgrade_clicked` →
`subscription_started`, segmented by `feature` — tells you which
locked feature actually drives upgrades vs. which ones people ignore.

## Full event list, by tool

| Tool | Events |
|---|---|
| Home | `tool_card_clicked` (tool) |
| Recipe Calculator | `recipe_calc_start`, `ingredient_added`, `recipe_scaled`, `cook_time_estimated`, `recipe_calc_abandoned` |
| Recipe Cost Calculator | `recipe_start`, `sample_recipe_loaded`, `ingredient_added`, `ingredient_removed`, `servings_adjusted`, `category_changed`, `calculation_completed`, `budget_exceeded`, `chart_viewed`, `recipe_saved`, `recipe_shared`, `recipe_exported`, `recipe_abandoned` |
| Nutrition Calculator | `nutrition_calc_start`, `ingredient_added`, `ingredient_removed`, `nutrition_calculated`, `nutrition_calc_abandoned` |
| Baking Calculator | `pan_size_scaled`, `temperature_converted`, `bakers_percentage_start`, `bakers_percentage_calculated` |
| Unit Converter | `unit_category_changed`, `unit_converted` |
| Ingredient Substitutions | `substitution_searched`, `substitution_found`, `substitution_not_found` |
| Shopping List | `shopping_item_added`, `shopping_item_checked`, `shopping_item_removed`, `shopping_list_cleared` |
| Finance | `budget_set`, `expense_logged`, `budget_exceeded`, `comparison_calculated`, `price_logged`, `price_history_viewed`, `batch_cost_calculated`, `budget_split_calculated` |

## Analysis ideas for a multi-page site (this is the interesting part)
- **Entry tool**: which `page_path` shows up first in a session most often? (Explore → Path exploration, starting point = session start)
- **Cross-tool paths**: do people who use Recipe Cost Calculator also visit Unit Converter in the same session? Path exploration from any tool's `page_view`.
- **Engagement by tool**: average engagement time per `page_path` (standard GA4 metric) — which tool holds attention longest?
- **Funnel per tool**: build one funnel per tool using its own "completed" event (`calculation_completed`, `recipe_scaled`, `nutrition_calculated`, etc.) vs its "started" event, and compare completion rates across tools.
- **Search terms with no result**: `substitution_not_found` query values tell you what to add to `data.js` — a real content-gap analysis.

## Notes
- All data (saved recipes, shopping list) lives only in the visitor's browser via `localStorage` — nothing is sent anywhere.
- To add ingredients or substitutes, edit the arrays at the top of the relevant `data.js` — no other code changes needed.
