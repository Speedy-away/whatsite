// Keep the new PC destination in generated navigation without rebuilding other pages.
const {icon} = require('./sidebar-icons.cjs');
function apply(file, html) {
  if (!html.includes('href="/pc/ports.html" class="nav-link')) {
    const entry = `<li data-pc-ports-navigation><a href="/pc/ports.html" class="nav-link nav-sublink" data-tooltip="Ports" aria-label="Ports">${icon('desktop')}<span>Ports</span></a></li>`;
    html = html.replace(/(<li><a href="\/pc\/emulators\.html" class="nav-link nav-sublink[^>]*>[\s\S]*?<\/a><\/li>)/, '$1' + entry);
  }
  if (file === 'pc/ports.html') html = html.replace(/(<a href="\/pc\/index\.html" class="nav-link nav-sublink) active(" aria-current="page")/, '$1"').replace('href="/pc/ports.html" class="nav-link nav-sublink"', 'href="/pc/ports.html" class="nav-link nav-sublink active" aria-current="page"');
  return html;
}
module.exports = {apply};
