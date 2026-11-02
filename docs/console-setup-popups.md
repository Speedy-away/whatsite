# Console setup popups

The user requested the PS2 setup-popup behavior on other console pages.
`assets/console-setup-popups.js` supplies a shared native modal, independent of
the existing game/mod guide dialog and the PS2-specific setup modal.

On console pages, ordered instructional workflows become compact guide
controls. Storage instructions and existing ordered setup details are included.
Download/application grids stay in place. Mixed sections retain their cards,
with only the ordered workflow moved into the popup. Sections with live forms,
input/select controls or embedded media stay unchanged. Existing external
project documentation links keep their destinations.

Same-origin links to dedicated setup pages can load their instructional sections
into the modal. Compatibility/prerequisite notes accompany the steps. Scripts,
embedded media, forms, advertisements, event attributes and conflicting IDs are
removed from imported content. Links/media resolve against the source page. A
full-page link remains available, and failed requests offer that fallback.

The original instruction nodes move into the local modal and return when it
closes. Native dialog provides keyboard focus containment and Escape dismissal;
Close and backdrop dismissal also restore focus. Without JavaScript, the source
instructions remain available in their normal location. Language runtime v3 and
the shared refresh helper remain integrated.

Run `node scripts/apply-console-setup-popups.cjs` to refresh generated pages, or
use `--check` for read-only validation. The shared `guide-popup-policy.cjs` calls
the same additive integration when guide-shell pages regenerate. Standalone
download receivers and the original PS2 page are excluded to preserve their
existing bytes and dedicated behavior. No download or archive contents changed.

Validation: 20 focused tests passed, including existing mod-dialog regressions.
The whole-site audit checked 429 public pages and 46,430 local links/assets with
zero issues. Browser checks covered 14 representative console routes, a remote
Wii setup popup from its hub, Steam Deck details, and a 390px PS5 popup. Escape,
content restoration and focus return passed; no phone overflow occurred.

Evidence: `docs/qa/console-setup-popups-browser.json`,
`docs/qa/console-setup-wii-desktop.png`, and
`docs/qa/console-setup-ps5-mobile.png`.
