# World Wellbeing Kitchen

**By Sadhna Dixit**  
An initiative of **World Wellbeing Forum**

Traditional wisdom. Modern nutrition. A healthier world.

A collection of 300 plant-forward vegetarian and vegan recipes and kitchen resources, inspired by Ayurvedic and regional Indian home-cooking traditions and designed for modern life: protein-rich, fibre-rich, nut-free, egg-free, with measured unsaturated oil and no added sugar.

Live site: https://kitchen.worldwellbeingforum.com

## What is on the site
- **14 collection pages**: Uttar Pradesh home classics, morning meals, soups, sabzi and curry, paneer and tofu, dals, grains and millets, bowls, snacks and chaat, oven, air-fryer, microwave, world dishes and sweets.
- **300 recipe pages**, each with ingredients, a method written for its appliance, estimated nutrition, the six tastes (shad rasa) found in the dish, and cooking-inspiration links.
- **Kitchen Wisdom**: the six tastes, the spice shelf, the rhythm of the day and eating with the seasons.
- **Browse and search**, plus a **weekly planner, shopping list and protein tracker** (saved in the visitor's browser only).

## Recipe standards
Each recipe is written for two servings and includes ingredients with quantities, prep, cook and total time, a step-by-step method for the stated appliance, a vegan or vegetarian label, and estimated nutrition per serving. Appliance timings are starting estimates until tested in a specific kitchen. Nutrition values are estimates, not laboratory analyses. This site is educational and is not medical advice. No recipe is claimed to lower LDL cholesterol or HbA1c. See `research/recipe-development-standards.md`.

## Dietary labels
Vegan recipes contain no animal-derived ingredients. Vegetarian recipes may include dairy and contain no meat, fish or eggs. Check packaged ingredient labels for hidden animal-derived ingredients and allergens.

## Project layout
| Path | Purpose |
|---|---|
| `recipes/NNN-slug.json` | One file per recipe (source of truth); listed in `recipes/manifest.json` |
| `research/recipe-images.json` | Open-licence photo credits (creator, licence, Wikimedia Commons page) |
| `research/original-research-crawl.json` | Pages and image candidates recovered from the original research session |
| `scripts/validate-recipes.js` | Checks every recipe (fields, calories vs macros, nuts, eggs, added sugar, saturated-fat ingredients) |
| `scripts/build-site.js` | Generates the static site into `dist/` |
| `assets/` | Shared CSS and JavaScript |
| `wrangler.jsonc` | Cloudflare Workers static-assets config |

## Develop
```bash
npm run validate     # check all recipes
npm run build        # generate dist/ (home, collections, 300 recipe pages, browse, wisdom, planner, about)
npm run dev          # build and preview with Wrangler
```

## Deploy
The site runs on Cloudflare Workers static assets, like the main Forum website. The worker is named `kitchen` and is attached to the custom domain `kitchen.worldwellbeingforum.com`.

```bash
npx wrangler login   # once
npm run deploy       # validates, builds, deploys
```

## Sources and photographs
Each recipe lists the pages that inspired it. Links are inspiration only; recipe text is original. Recipes with no listed source were developed from standard techniques. Photographs come only from Wikimedia Commons files with an open licence (Creative Commons or public domain), credited on each recipe page; where no suitable photo exists, a tile is shown instead. Third-party blog photographs are not used.
