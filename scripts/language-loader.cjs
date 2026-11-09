// Keep generated pages on the same cache revision as the site-wide refresh.
const revision='20261108-discovery';
const tag='<script defer src="/languages/i18n.js?v=3&amp;rev='+revision+'"></script>';
function apply(html){return html.replace(/<script\b[^>]*\bsrc="[^"]*(?:^|\/)languages\/i18n\.js(?:\?[^"]*)?"[^>]*>\s*<\/script>/g,tag);}
module.exports={revision,tag,apply};
