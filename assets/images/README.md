# World Wellbeing Kitchen

World Wellbeing Kitchen is a JavaScript-driven recipe catalogue published on GitHub Pages.

## Project structure

- `index.html` — page shell and semantic layout
- `assets/css/site.css` — responsive presentation and recipe-card styles
- `assets/js/recipe-data.js` — recipe records (ingredients, method, nutrition estimates and timing)
- `assets/js/recipe-sources.js` — recipe-level source references and adaptation notes
- `assets/js/app.js` — filtering, rendering, recipe detail views and interactions
- `assets/images/` — destination for owned or properly licensed dish photography

## Images and source policy

Every recipe card should use an image mapped to that recipe in the recipe data. Do not treat a random image service or a generic stock image as a photograph of the named dish. Before publication, each image must be either created for the project, owned by the Forum, or licensed for the intended use; retain creator, source URL, licence and attribution in an image manifest.

Recipe source references are editorial references, not proof of permission to reproduce a source's text or photographs. Recipe text should be independently written and adapted, and citations should identify the actual source used. Unverified links must be audited before commercial publication.

## Local preview

Open `index.html` through a local static server (rather than a file:// URL) so relative assets load consistently. GitHub Pages serves the same HTML/CSS/JavaScript asset structure.
