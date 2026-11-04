# Runtime language behavior

Pages remain authored in English. `languages/i18n.js` translates complete text
nodes and supported UI attributes using the selected language dictionary. Source
strings are remembered separately from the last rendered translation so live
download statuses can change without restoring stale text on a language switch.

The observer handles inserted nodes, text-node edits and changes to placeholders,
accessible labels, tooltips and image alt text. Input values are translated only
for button, submit and reset controls; user input and option values are preserved.
Page titles and description/social metadata are translated when their exact
source strings are available.

Keyword metadata is translated one comma-separated phrase at a time. Shared
category aliases and named-subject templates cover terms such as `PS4 Mods`
and `PS3 themes`, preserving the exact console name, game ID, filename and
version. Keyword matching ignores phrase capitalization; normal page text
retains its existing exact lookup behavior. Switching to English restores the
latest authored keywords. Social image alt metadata and the active Open Graph
locale follow language changes too.

`scripts/page-search-tags.cjs` adds translated subject terms for all 20 languages
to existing card search fields at build time. Existing page filters can search
these without requesting 20 dictionaries. A length and checksum identify the
generated suffix, preventing translated words from becoming new English source
subjects on repeated builds. Original resource names, category values, downloads
and compatibility pins stay literal. `i18n-tools/discovery-concepts.cjs` defines
the shared category vocabulary; it does not infer supported games or platforms.

This remains an English-authored site with runtime translations. Translated
keywords and search aliases do not establish separately indexable language
pages. Do not add `hreflang` or localized sitemap URLs until actual translated
pages exist at those URLs. Google does not use keyword meta tags for ranking;
localized visible content, titles and descriptions require their own coverage.

Content under `code`, `pre`, `textarea`, scripts, styles, SVG and canvas is skipped.
Use `data-i18n-skip`, `translate="no"` or `class="notranslate"` for other technical
content that must remain literal. URLs and download destinations are never
rewritten. Keep product names, filenames and compatibility values literal in
translation dictionaries.

## Named templates

Dictionaries can contain complete source templates:

```js
{
  "{count} files": "{count} archivos",
  "Save on {platform}": "Guardar en {platform}",
  "Download {filename}": "Descargar {filename}"
}
```

The runtime matches these against entire English strings, never just a prefix.
Numeric placeholders (`count`, `total`, `shown`, `bytes`, `size`, `number`) accept
numbers. `platform` accepts recognized console/PC names; `filename` requires a
recognized file extension. Captured values are inserted literally, including `$`
characters, and are not translated. Exact dictionary strings take precedence.
Use the same placeholder names in the translation value.

A `{date}` capture in a translated dictionary template is localized only when it
is a valid English `day Month year` date (for example, `2 November 2026`). The
formatter uses the selected language and UTC. Invalid dates, filenames and
firmware values are not parsed, and browsers without `Intl.DateTimeFormat` keep
the literal date. Switching back to English restores the original source date.

Application scripts can explicitly render a template:

```js
window.__scoobyI18n.t('{count} files', {count: count});
window.__scoobyI18n.t('Save on {platform}', {platform: 'PS5'});
```

`translate(source, values)` is an alias for `t`. Both fall back to the source
string when no dictionary entry exists. `refresh(element)` reapplies the active
language after an application-controlled DOM update; the observer usually makes
an explicit refresh unnecessary. The existing `scooby:langchange` event remains
available for application-specific rendering.

## Loading and coverage

The runtime's `?v=` token is forwarded to dictionary requests. Bump the loader
token when deploying dictionary updates so old cached dictionaries do not mask
new coverage.

A failed dictionary request retains the current language and displays a retry
message. It does not cache an empty dictionary as a successful load. Language
switches are sequenced so a slow earlier request cannot overwrite a newer choice.

`missing()` reports uncovered visible text and supported UI attributes. It is a
coverage aid, not a guarantee that every external embed, image or third-party page
has a translation. Uncovered authored strings retain their English source.

Run focused regression checks with:

```text
node --test scripts/tests/i18n-runtime.test.cjs
```
