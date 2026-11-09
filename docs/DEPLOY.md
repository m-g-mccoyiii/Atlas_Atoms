# Deploying to GitHub Pages

The site is deployed by `.github/workflows/pages.yml`, which publishes the whole repo root.

One-time setup: **Settings -> Pages -> Build and deployment -> Source: GitHub Actions.**

Do not use "Deploy from a branch". If Pages is set to a branch and folder (for example `main` and `/docs`),
GitHub serves only that folder, which has no `index.html`, and the site shows a 404. That branch build also
overwrites the workflow's deploy on every push.

To redeploy by hand: Actions -> Deploy to GitHub Pages -> Run workflow.
