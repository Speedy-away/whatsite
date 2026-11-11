'use strict';
// Compatibility entry point retained for older build commands.
const {data, buildAlias} = require('./ps4-browser-guide.cjs');
function buildFourteenGuide() { buildAlias('jailbreak.html'); }
module.exports = {buildFourteenGuide, data};
if (require.main === module) buildFourteenGuide();
