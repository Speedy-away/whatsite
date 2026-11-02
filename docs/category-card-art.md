# Category image mixes

Visible category cards now compose the site's existing project logos, screenshots and game artwork in native HTML/CSS. Emulator collections use the projects listed on that destination page; Switch category filters are respected. Game-download cards use a distinct game-library mix and download symbol. The PC overview header also represents several emulator projects.

The original image files are not edited. Individual app, emulator and ready-download entries retain their own artwork; setup links do not turn an individual resource into a category card. A secondary link cannot redefine a card's image. No game, firmware or platform compatibility is inferred from a logo.

`docs/category-card-art.json` records each destination's selected images, accessible labels and the page listing the project. `scripts/category-card-art.cjs` renders and applies those compositions without changing links or scripts. The shared page finalizer, console directory integration and topic-hub metadata finalizer preserve the artwork when pages are regenerated.

After rebuilding source pages or adding resources, run:

```powershell
node scripts/build-category-card-art.cjs
node scripts/build-social-previews.cjs
node scripts/update-page-metadata.cjs
node scripts/update-site-search-tags.cjs
node scripts/build-category-card-art.cjs --check
node scripts/update-page-metadata.cjs --check
node scripts/verify-search-durability.cjs
```

The artwork builder checks every eligible site page. Only matching category cards and the broad PC overview header receive a mix. Original screenshots on individual resource pages, downloadable HTML and exploit runtimes are preserved. Repeated builds make no changes unless the source resources or configuration change.

Verification is recorded in `docs/qa/category-card-art-coverage.json`, `docs/qa/category-card-art-final-tests.txt` and `docs/chat-handoffs/category-card-art.json`. Desktop and phone previews are saved under `docs/qa/category-card-art-vita-*.jpg`.
