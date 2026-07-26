# Family Movie Night 🍿

The Ortiz family's Friday-night memory book — round-robin picks, post-movie
reactions (stars, thoughts, favorite characters, favorite scenes, quotes,
memories, and the family poll), scrapbook pages, printable keepsake PDFs,
stats, and movie trivia.

**Live app:** https://ortizzle.github.io/family-movie-night/

Single-file app (`index.html`) — no build step. Deployed to GitHub Pages by
the workflow in `.github/workflows/deploy-pages.yml` on every push to `main`.

Data lives in each phone's localStorage and syncs across the family through a
shared private GitHub Gist (configured in the app's Settings tab, along with
optional TMDB and Anthropic keys — no keys or tokens are ever committed here).
