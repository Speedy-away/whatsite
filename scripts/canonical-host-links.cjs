'use strict';
// Only moved first-party browser destinations; immutable download URLs stay pinned.
function apply(html) { return html.replace(/https:\/\/speedy-away\.github\.io\/(?:WWB-HOST|wwb-host)\/(?=hosts\/|["'<\s?#]|$)/g, 'https://speedy-away.github.io/'); }
module.exports = {apply};
