// Keep generated pages on the same cache revision as the site-wide refresh.
const tag='<script defer src="/languages/i18n.js?v=3&amp;rev=20261108-discovery"></script>';
function apply(html){return html.replace(/<script\b[^>]*\bsrc="[^"]*(?:^|\/)languages\/i18n\.js(?:\?[^"]*)?"[^>]*>\s*<\/script>/g,tag);}
module.exports={tag,apply};
