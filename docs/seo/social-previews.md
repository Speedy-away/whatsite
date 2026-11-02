# Social link previews

Every eligible site HTML page has a local raster preview, descriptive alt text and matching Open Graph, Twitter Card and WebPage image metadata. Main site, PlayStation, Xbox, Nintendo, PC and tools hubs use six original illustrated covers generated with the built-in image generation tool. The unmodified originals, exact dimensions, hashes and prompts are recorded in [the prompt manifest](../image-prompts/social-share-covers.json).

Other pages use their full page title in a platform-colored 1200 × 630 PNG. These cards are original SVG artwork rendered locally; each editable SVG and earlier render stays available. Illustrated hub records also retain their individual native card as a fallback asset. Generated previews are artwork, not screenshots of real software or evidence of compatibility.

The primary image map is `docs/seo/social-images.json`; illustrated choices are kept separately in `docs/seo/social-image-overrides.json`. Assets have content-specific filenames so old shared image URLs stay available. Existing body artwork and download files are preserved.

After adding or changing pages, run:

```powershell
node scripts/update-site-search-tags.cjs
node scripts/build-social-previews.cjs
node scripts/update-page-metadata.cjs
node scripts/build-social-previews.cjs --check
node scripts/update-page-metadata.cjs --check
node scripts/update-site-search-tags.cjs --check
node scripts/verify-search-durability.cjs
node scripts/verify-social-previews.cjs
```

The image renderer uses `sharp` and `@napi-rs/canvas` from the installed Node runtime. If they are not on the normal module path, set `SOCIAL_PREVIEW_NODE_MODULES` to the package directory. Importing the metadata engine or generator finalizer never generates images or writes assets.

The all-page verifier checks HTML and preview bytes against the running local server (default `http://127.0.0.1:8765/`). Use `--no-http` for filesystem checks only. Its preservation baseline records this task's starting bodies and directives; concurrent edits are reported separately and never silently accepted as a new baseline.

Ready-to-use console receiver files, downloaded HTML tools and vendored exploit runtimes are excluded from rewriting. Their exact bytes remain important. The deployment step is separate: external sharing services can only fetch these assets after publication and may cache previous previews.

These sharing cards do not guarantee search rankings or a particular search-result image. [Primary-source notes](social-preview-reference-notes.json) distinguish sharing metadata from Google's representative-image guidance.
