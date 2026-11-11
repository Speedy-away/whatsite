// Illustrated Apollo guides. Rebuild with: node scripts/build-apollo-guides.cjs
const fs = require('node:fs');
const path = require('node:path');
const {page, note, steps, sourceList, esc} = require('./build-console-guides.cjs');
const root = path.resolve(__dirname, '..');
const images = '/assets/images/apollo-guide/';
const guide = platform => '/console/' + platform + '/apollo-guide.html';
const link = (url, label) => '<a href="' + esc(url) + '">' + label + '</a>';
const p = text => '<p>' + text + '</p>';
const part = (id, title, html) => '<section class="apollo-section" id="' + id + '" aria-labelledby="' + id + '-title"><h2 id="' + id + '-title">' + title + '</h2>' + html + '</section>';
const figure = (file, alt, caption, width = 1920, height = 1080) => '<figure class="apollo-figure"><a href="' + images + file + '" data-apollo-zoom target="_blank" rel="noopener noreferrer" aria-label="Enlarge: ' + esc(alt) + '"><img src="' + images + file + '" alt="' + esc(alt) + '" loading="lazy" width="' + width + '" height="' + height + '"></a><figcaption>' + caption + ' <a href="' + images + file + '" data-apollo-zoom target="_blank" rel="noopener noreferrer">Enlarge image</a></figcaption></figure>';
const tree = (title, text) => '<div class="apollo-folder"><h3>' + title + '</h3><pre><code>' + esc(text) + '</code></pre></div>';
const faq = (title, html) => '<details class="apollo-faq"><summary>' + title + '</summary><div>' + html + '</div></details>';
const refs = platform => {
  const repo = 'https://github.com/bucanero/apollo-' + platform;
  const items = [[repo, 'Apollo ' + platform.toUpperCase() + ': official project and setup'], [repo + '/blob/' + (platform === 'ps4' ? 'main' : 'master') + '/source/saves.c', 'Save menus and account options: official source'], [repo + '/blob/' + (platform === 'ps4' ? 'main' : 'master') + '/source/exec_cmd.c', 'Copy, import and resign commands: official source'], ['https://github.com/bucanero/apollo-saves', 'Apollo community save database']];
  if (platform === 'ps4') items.splice(1, 0, [repo + '/blob/main/docs/usage.md', 'Apollo PS4 usage: activation, saves, folders and keystones'], ['https://manuals.playstation.net/document/en/ps4/settings/data_system.html', 'PlayStation: export PS4 saved data to USB'], ['https://manuals.playstation.net/document/en/ps4/settings/data_usb.html', 'PlayStation: import saved data from USB']);
  return sourceList(items) + p('Original Apollo screenshots by the Apollo project contributors. These are reference screens; installed versions, translations and available patches can look different. ' + link(images + 'sources.json', 'Image sources and checksums') + '.') + p('Written guide checked against the linked project documentation on 11 November 2026. No save transfer or resigning was tested on physical hardware.');
};
const ids = platform => part('account-ids', 'What does “switch the PSN ID” mean?',
  p('For a save, this usually means <strong>resigning it for the account that will load it</strong>. The save’s owner is separate from your public PSN username.') +
  '<dl class="apollo-definitions"><div><dt>PSN Online ID</dt><dd>Your visible username. Typing a different username into a save folder does not transfer ownership.</dd></div><div><dt>Account ID</dt><dd>The account identifier recorded in save metadata. Apollo displays it as 16 hexadecimal characters, for example <code>0123456789abcdef</code>. Use the destination account’s real value.</dd></div><div><dt>Local User ID</dt><dd>A user number on this console. It is separate from the Account ID and can differ on another console.</dd></div><div><dt>Game / title ID</dt><dd>' + ({ps4: 'For example <code>CUSAxxxxx</code>.', ps3: 'For example <code>BLUSxxxxx</code> or <code>BLESxxxxx</code>.', psvita: 'For example <code>PCSE00019</code> for the US edition of Dragon’s Crown.'})[platform] + ' This identifies the game build or edition; it is not an account.</dd></div></dl>' +
  '<div class="apollo-owner-flow" role="group" aria-label="Save ownership workflow"><div><span>Source save</span><strong>Account A</strong></div><span class="apollo-arrow" aria-hidden="true">→</span><div><span>Apollo resigns a copy</span><strong>Destination account</strong></div><span class="apollo-arrow" aria-hidden="true">→</span><div><span>Load and test</span><strong>Account B</strong></div></div>' +
  note(p('Keep an untouched backup of both the source save and the destination account’s existing save. Changing ownership does not make a save compatible with another game, edition, update or platform.')));
function ps4() {
  const outline = [['before','Before you start'], ['account-ids','PSN ID vs Account ID'], ['backup','Back up your saves'], ['activation','Set up the target account'], ['resign','Switch save ownership'], ['import','Import and restore'], ['folders','USB folder outline'], ['more','Patches and other tools'], ['help','Troubleshooting'], ['sources','Sources and screenshots']];
  const body =
    part('before', 'Before you start',
      p('Use Apollo on a <strong>homebrew-enabled PS4</strong> with a firmware and homebrew environment supported by your Apollo build. Install the PS4 package; the PS3 package is a separate application.') +
      '<ul class="apollo-checklist"><li>Sign into the local console user that should own the save.</li><li>Close the game before copying or changing its save.</li><li>Prepare a readable USB drive with enough free space.</li><li>Check the save’s title ID, game update, edition and required DLC.</li><li>Have a real PSN-linked or appropriately offline-activated target profile.</li></ul>' +
      '<div class="guide-links">' + link('/console/ps4/save-tools.html#save-tools','Apollo download and existing PS4 saves') + link('/console/ps4/file-transfer-guide.html','USB and FTP transfer guide') + '</div>' +
      figure('ps4-main.jpg','Apollo PS4 main menu with USB Saves, HDD Saves, Online DB, User Tools and Settings','Start at the main menu. HDD Saves is your internal storage; USB Saves is your removable or configured USB source.')) +
    ids('ps4') +
    part('backup', '1. Back up your current save',
      steps([
        ['Make a normal console backup when available.', 'In PS4 Settings, open Application Saved Data Management → Saved Data in System Storage → Copy to USB Storage Device. Select the game and save. This produces the encrypted PS4 transfer format.'],
        ['Make an Apollo working copy.', 'Open HDD Saves, select your game’s save, then choose Copy save game and a USB destination. Apollo copies the save in decrypted form for its own import workflow. Wait for the success message.'],
        ['Keep the backup separate.', 'Copy the entire exported folder to a PC and label it with the game, account and date. Keep its contents unchanged; work on a second copy.']
      ]) +
      note(p('<strong>Two formats, two import routes.</strong> A normal PS4 USB export belongs under <code>PS4/SAVEDATA/</code>. Apollo’s decrypted working copies belong under <code>PS4/APOLLO/</code>. Renaming one folder into the other does not convert the save.')) +
      figure('ps4-saves.jpg','Apollo PS4 save list showing save entries and status icons','Select the precise save slot. In documented PS4 builds, a lock marks encrypted data and a bookmark marks the current Account ID.')) +
    part('activation', '2. Check the account that will own the save',
      p('If this local user already has the correct PSN Account ID, keep that identity and continue to resigning. Check Apollo’s About screen and View Save Details rather than entering your public username.') +
      '<h3>Find your own PSN Account ID</h3>' +
      p('On a console where your PSN account is already linked, export one of your PS4 saves using the normal Settings USB backup. On a PC, read the folder immediately after <code>PS4/SAVEDATA/</code>. The 16-character hexadecimal folder name is the Account ID for that export. Preserve any leading zeros.') +
      tree('Example only: replace with your own exported account folder', 'USB drive/\n└── PS4/\n    └── SAVEDATA/\n        └── 0123456789abcdef/  ← Account ID, not username\n            └── CUSAxxxxx/\n                ├── save-container\n                └── save-container.bin') +
      '<h3>For an offline profile that needs activation</h3>' +
      steps([
        ['Back up the profile’s existing saves first.', 'Changing the profile Account ID can leave older saves associated with its previous identity. Record that identity before making a change.'],
        ['Open the account tools.', 'In Apollo choose User Tools → Activate PS4 Accounts, then carefully select the intended local profile.'],
        ['Choose the identity you need.', 'For transfer to your own PSN account, replace the proposed value with the exact 16-character Account ID taken from your own PS4 export. A generated offline ID works for a local offline setup but will not match a different real PSN account.'],
        ['Confirm and reload the user.', 'Accept the on-screen entry and confirmation prompts. Exit Apollo and restart the console when activation reports that a reboot is required. Reopen Apollo and verify the Account ID in About.']
      ]) +
      note(p('Offline activation sets the local profile’s identifier. It does not sign into PSN or rename your PSN Online ID. Do this account setup before importing saves for that identity.')) +
      figure('ps4-settings.jpg','Apollo PS4 settings menu','This historical Settings screenshot includes Save Data Owner. Current builds use the current local user; their settings can differ. Account activation is under User Tools.')) +
    part('resign', '3. Switch the save to your account',
      p('<strong>For a decrypted Apollo USB copy or a save already on HDD.</strong> Make the save belong to the current user, then test one save before changing a batch. An encrypted USB entry with a lock uses the separate import route below.') +
      steps([
        ['Open Apollo as the destination user.', 'Confirm that its About screen shows the Account ID you want. Choose USB Saves for a USB copy, or HDD Saves for an existing internal save.'],
        ['Inspect the save.', 'Use View Save Details and check the game/title ID, save slot and location. If the game or required update differs, stop and resolve that mismatch first.'],
        ['Apply the ownership change.', 'Choose Apply Changes & Resign and wait for success. With no manual account override, Apollo uses the current user’s configured Account ID. The USB bulk menu also offers Resign selected Saves; leave batch actions until a single save has worked.'],
        ['Copy the prepared USB save to the console.', 'Choose Copy save game → HDD for the prepared USB save. Read any overwrite prompt carefully and preserve your existing slot backup.'],
        ['Check it inside the game.', 'Exit Apollo cleanly, start the matching game under the same user, load the intended slot and verify progress. Make a fresh backup once it works.']
      ]) +
      '<h3>Why there is no PS4 Change Account ID menu here</h3>' +
      p('The PS3 SFO Patches → Change Account ID instructions do not apply to the current PS4 menu. For PS4, use the intended destination profile, check its Account ID, and resign with that configured identity. Older screenshots may show a Save Data Owner setting that is absent from the current source. Follow the destination-user workflow for the current build rather than looking for that historical setting.') +
      figure('ps4-savegame.jpg','Apollo PS4 individual save menu showing resign and file backup operations','This is the individual save menu. Finish changes with the resign action and wait for Apollo’s confirmation.')) +
    part('import', '4. Import, restore or move a save',
      '<h3>A decrypted community save from a ZIP</h3>' +
      steps([
        ['Extract the archive on your computer.', 'Keep the save payload and its sce_sys folder together. Preserve the supplied save folder name and title ID. Avoid an extra ZIP-name folder around the actual save.'],
        ['Use the Apollo folder layout.', 'Place the complete save folder under PS4/APOLLO on the USB drive. Open USB Saves, inspect the save, resign it for the target user, then use Copy save game to copy it to HDD.'],
        ['Or download inside Apollo.', 'Choose Online DB, select the exact matching game and save, then use the displayed destination. Check HDD Saves for an internal download; for a USB download, return to USB Saves and copy the save to HDD. Verify the resulting owner and game slot.']
      ]) +
      '<h3>An encrypted PS4 USB export</h3>' +
      p('Keep the complete container and matching <code>.bin</code> companion in their original <code>PS4/SAVEDATA/&lt;ACCOUNT-ID&gt;/&lt;TITLE-ID&gt;/</code> structure. In USB Saves, select the encrypted save and use Copy save game → HDD. This import handles supported containers and applies the configured target identity; then inspect the imported save in HDD Saves. The locked USB menu differs from the decrypted-save menu and does not offer the same Apply Changes & Resign action. A save encrypted with keys unavailable on your firmware may fail before importing.') +
      '<h3>A different, unmodified PS4</h3>' +
      p('First make the save work on the homebrew PS4 under the same real Account ID as the destination. Then use the PS4 Settings export to create a normal encrypted USB copy. On the destination, use Application Saved Data Management → Saved Data on USB Storage Device → Copy to System Storage under that same PSN account. A decrypted APOLLO folder is not a normal-console import.') +
      '<h3>Restore your own backup</h3>' +
      p('For a normal encrypted backup, use the console’s USB saved-data import. For an Apollo decrypted backup, use USB Saves → the correct save → Copy save game → HDD under the matching user. Close the game first, check the title and slot, and confirm an overwrite only after preserving the save currently there.')) +
    part('folders', 'USB folder outline',
      tree('Normal encrypted PS4 transfer', 'USB drive/\n└── PS4/\n    └── SAVEDATA/\n        └── <ACCOUNT-ID>/\n            └── <TITLE-ID>/\n                ├── <save-container>\n                └── <save-container>.bin') +
      tree('Apollo decrypted working copy', 'USB drive/\n└── PS4/\n    └── APOLLO/\n        └── <USER-ID>_<TITLE-ID>_<SAVE-NAME>/\n            ├── sce_sys/\n            │   └── param.sfo\n            └── <game save files>') +
      p('Apollo exports the working-copy folder name for you. Placeholder text in angle brackets is not a literal folder name. If your community download already has that structure, preserve it.') +
      p('Without a physical USB drive, the documented <code>/data/fakeusb/</code> source uses the same structures. Select that source in Apollo Settings. It is a folder on the PS4, not the normal PC USB drive.')) +
    part('more', 'Patches and other useful tools',
      '<dl class="apollo-definitions"><div><dt>Save patches / cheats</dt><dd>Only supported games show patch options. Back up, enable one suitable patch, use Apply Changes & Resign, then check the result in-game. A patch may depend on the exact save format or game version.</dd></div><div><dt>Export / import decrypted save files</dt><dd>These work with Apollo’s per-user export folders. They are advanced file-editing operations; use Copy save game for a complete beginner backup and restore.</dd></div><div><dt>Keystone backup</dt><dd>Keep the keystone from a working save for the exact game build. A keystone mismatch is separate from ownership. Follow the official keystone instructions only after making backups.</dd></div><div><dt>Settings and application data</dt><dd>Use the correct USB source, change sorting, update patch data, or enable the debug log when troubleshooting.</dd></div></dl>' +
      note(p('Apollo PS4 handles PS4 saves. For native PS5 saves, use the separate ' + link('/console/ps5/save-tools.html','PS5 game-save tools page') + '. PS3 saves also require their own workflow.'))) +
    part('help', 'Troubleshooting',
      faq('The save does not appear in USB Saves.', p('Extract the ZIP. Check PS4/APOLLO for decrypted data or PS4/SAVEDATA for an encrypted export, with no duplicate wrapper folder. Check Settings → USB Saves Source and refresh the list. Make sure the USB is readable and contains the full save.')) +
      faq('The save belongs to another user.', p('Confirm which local user launched Apollo. Check its Account ID in About, then the save’s ID in View Save Details. For an offline user, complete the appropriate activation first, then resign a working copy and import it again.')) +
      faq('Apollo shows a red warning or cannot decrypt the save.', p('Check the folder structure, container/.bin pair, and the encrypted save’s firmware key requirements. Resigning does not add encryption keys missing from your firmware. Keep the source backup and consult the exact Apollo build’s compatibility notes.')) +
      faq('The game says the save is corrupt or will not load.', p('Check the exact title ID, game update, edition, required DLC and slot. For a confirmed keystone mismatch, follow the project’s keystone guide using a fresh working save from your exact installed build. Restore your backup if the modified copy still fails.')) +
      faq('Can I change the CUSA number to fix a region mismatch?', p('Changing a folder label is not a universal conversion. Some games require moving compatible decrypted data into a fresh save from the destination build; others use different formats and cannot be transferred that way. Use game-specific instructions and retain both originals.')) +
      faq('Will changing my PSN username convert or transfer this save?', p('No. The public Online ID and the save Account ID are different identifiers. Use save resigning for ownership and keep the destination game compatible.')) +
      faq('Can this transfer server-side online progression?', p('This guide covers local save files. Progress stored on a publisher’s servers follows that service’s account system; changing local ownership does not transfer those server records.'))) +
    part('sources', 'Official references and image credits', refs('ps4'));
  build('ps4', outline, body);
}
function ps3() {
  const outline = [['before','Before you start'], ['account-ids','PSN ID vs Account ID'], ['backup','Back up your saves'], ['resign','Switch save ownership'], ['other-owner','Another owner profile'], ['restore','Restore and online saves'], ['folders','USB folder outline'], ['more','Patches and memory cards'], ['help','Troubleshooting'], ['sources','Sources and screenshots']];
  const body =
    part('before','Before you start',
      p('Use the PS3 build of Apollo on a PS3 that can run homebrew. Start your supported CFW or enable HEN as your setup requires, then install the PS3 package from the existing save-tools page.') +
      '<ul class="apollo-checklist"><li>Log into the local PS3 user that should own the save.</li><li>Close the game and back up its existing save slot.</li><li>Use a PS3-readable FAT32 USB drive.</li><li>Match the game’s title ID, region, update and required DLC.</li></ul>' +
      p('Apollo detects the current user and console settings on first run. The PS4 Activate PS4 Accounts menu is not part of this PS3 save-resigning workflow.') +
      '<div class="guide-links">' + link('/console/ps3/save-tools.html#save-tools','Apollo download and PS3 save tools') + link('/console/ps3/transfer-tools.html','PS3 transfer tools') + '</div>' +
      figure('ps3-main.png','Apollo PS3 main menu','The PS3 application has its own save, trophy and backup tools. Use this console-specific guide.')) +
    ids('ps3') +
    part('backup','1. Back up before changing the owner',
      steps([
        ['Copy your current save to USB.', 'From the PS3 Game column, open Saved Data Utility (PS3), select your save, open its options and use Copy to the USB drive where permitted. Keep the complete save folder.'],
        ['Use Apollo for copy-protected data when supported.', 'Open HDD Saves, choose the save and use Copy save game to USB. This copies the full save folder directly, including copy-protected saves. If you later need the normal PS3 copy menu, use Remove copy protection on a working copy and apply the changes; keep the untouched Apollo backup.'],
        ['Store an untouched copy elsewhere.', 'On a PC, copy the full save folder from PS3/SAVEDATA into a dated backup folder. Keep PARAM.SFO, PARAM.PFD and all game files together.']
      ]) +
      figure('ps3-savelist.png','Apollo PS3 save selection list','Choose the correct title and save slot before opening the save operations.')) +
    part('resign','2. Reassign a save to your current PS3 user',
      p('<strong>This is the normal “change PSN ID on a save” route.</strong> Apollo uses the destination user and console settings it detected. Keep the unmodified source in your backup.') +
      steps([
        ['Prepare a USB working copy.', 'Extract the downloaded save if necessary. Place the complete game-save folder under PS3/SAVEDATA on the USB drive, preserving its original contents and directory name.'],
        ['Use the destination local user.', 'Log into the PS3 user that should load the save, run Apollo, and open USB Saves. Select your working copy.'],
        ['Check its details.', 'Confirm the title ID and slot. The source save’s account may differ from your local user; that is the ownership you are about to reassign.'],
        ['Apply changes and resign.', 'Use the save’s Apply Changes & Resign action to rebuild its ownership/signature for the configured user and console. Wait for Apollo to report success. Enabling an unrelated gameplay cheat is not required.'],
        ['Copy it back and load it.', 'Copy the resigned save to the destination user’s internal saved data with Apollo’s copy operation or Saved Data Utility (PS3). Read any overwrite prompt, then launch the matching game under that same user and verify the correct progress.']
      ]) +
      figure('ps3-patches.png','Apollo PS3 historical save patch menu with backup and cheat options','This older PS3 reference screen shows save operations and gameplay patches. Its Apply cheats label differs from newer builds; follow the ownership and resign action in your installed version.') +
      note(p('Resigning updates metadata and signatures. It cannot turn a PS3 save into a PS4 save or guarantee compatibility between different games or save formats.'))) +
    part('other-owner','3. Advanced: choose another account owner',
      p('When you need a specific owner rather than the automatically detected current user, Apollo PS3 supports owner profiles through <code>owners.xml</code>. This is an advanced override; most users can use the current-user route above.') +
      steps([
        ['Collect the intended destination’s real details.', 'The official owner format includes owner name, local User ID, Account ID and console PSID; IDPS is required for license import/export. Use the intended owner’s genuine values and keep console identifiers private.'],
        ['Prepare the owner file.', 'Follow the owner XML schema in the official PS3 README. Save it to /dev_hdd0/game/NP0APOLLO/USRDIR/owners.xml. Preserve a backup of an existing owner file before editing it.'],
        ['Select the correct owner.', 'Open the save’s SFO Patches → Change Account ID menu and choose your prepared owner. Check the destination account before applying changes.'],
        ['Finish by resigning.', 'Use Apply Changes & Resign, then transfer the prepared copy and test it as the intended user. Choosing a name in the owner menu does not by itself finish the save operation.']
      ]) +
      p('The built-in Remove ID/Offline option clears an account identifier, and Fake Owner/Rebug is not your real destination account. Choose your own prepared owner when assigning a specific account.') +
      p('Do not copy the sample PSID or IDPS from a tutorial into your real owner profile. Those placeholders are not your console’s identity. A public PSN username is not an Account ID.') +
      figure('ps3-details.png','Apollo PS3 save details screen','Check the save details and owner before changing anything. Reference screenshots may show another user’s example values.')) +
    part('restore','4. Restore backups and use Online Database saves',
      '<h3>Restore your own backup</h3>' +
      p('Close the game. Put the complete original folder back under <code>PS3/SAVEDATA/</code> on USB. Use Saved Data Utility (PS3) → USB device → the save → Copy, or Apollo’s copy operation. Confirm the title and slot before overwriting. If the destination user differs, resign a working copy for that user first.') +
      '<h3>Download inside Apollo</h3>' +
      p('Open Online Database, select the exact game and save, and download it to the offered destination. Then open the save in the appropriate save list and resign it before loading it in the game. The project explicitly requires resigning downloaded PS3 saves.') +
      p('Read the contributor’s requirements for game region, update, DLC and save slot. Keep your own progress before trying a completion or modded save.')) +
    part('folders','USB folder outline',
      tree('PS3 game save on USB', 'USB drive/\n└── PS3/\n    └── SAVEDATA/\n        └── <original game-save folder>/\n            ├── PARAM.SFO\n            ├── PARAM.PFD\n            ├── ICON0.PNG  (when supplied)\n            └── <game save files>') +
      p('On the PS3, Apollo scans <code>/dev_usb00x/PS3/SAVEDATA/</code> for USB saves and <code>/dev_hdd0/home/000000XX/savedata/</code> for the current local user’s HDD saves. <code>XX</code> is the local User ID, not the PSN username.') +
      p('The folder immediately inside SAVEDATA is the save itself. Do not leave it inside an extra archive-name directory, and do not copy only PARAM.SFO.')) +
    part('more','Patches, unlocks and memory cards',
      '<dl class="apollo-definitions"><div><dt>Save patches</dt><dd>Select only patches offered for your exact supported save. Start with one change, apply and resign, then verify it in the game before stacking more changes.</dd></div><div><dt>Copy protection</dt><dd>Apollo supports removing the copy-lock flag from supported PS3 saves. This enables copying; it does not replace resigning for a different owner.</dd></div><div><dt>PS1 and PS2 saves</dt><dd>Apollo has separate virtual-memory-card import/export and PSV conversion tools. Those formats and paths differ from PS3/SAVEDATA. Use the official format tables before converting a memory card.</dd></div><div><dt>Trophies and licenses</dt><dd>These are separate tool groups with their own account and console requirements. A game-save transfer does not transfer a trophy set or PSN purchase.</dd></div></dl>' +
      note(p('Keep PS3 instructions separate from the ' + link(guide('ps4'),'Apollo PS4 guide') + '. The PS4 activation, encrypted USB containers and keystone procedures are not interchangeable with PS3 save handling.'))) +
    part('help','Troubleshooting',
      faq('My save is missing from USB Saves.', p('Check the drive is PS3-readable FAT32, extract the archive, and put the complete original save folder directly under PS3/SAVEDATA. Reload the list. A PS4 save or a PS1/PS2 memory-card image belongs to a different workflow.')) +
      faq('The game still reports another owner.', p('Confirm the PS3 user you logged into and whether owners.xml is overriding automatic detection. Reopen the working save, select the intended owner if needed, finish Apply Changes & Resign and copy that prepared version back to the intended user.')) +
      faq('It says Copying Prohibited.', p('Preserve a backup. Use Apollo’s supported copy/unlock operation for that save; the normal PS3 copy menu may remain restricted until its copy-lock flag is removed. Then resign separately if the owner is changing.')) +
      faq('The save appears but is corrupt or incompatible.', p('Check the exact game/title ID, update, DLC and all original save files. Do not swap PARAM.SFO by itself or assume that renaming BLES/BLUS directories converts regions. Restore your original if a working copy still fails.')) +
      faq('Do I need the PS4 activation instructions?', p('No. Apollo PS3 automatically detects the current user and console for normal save resigning. Its own backup/activation features are separate from the PS4 User Tools workflow.')) +
      faq('Can I transfer online progression or convert PS3 progress to PS4?', p('Local resigning changes save ownership. Server-side account progress and cross-generation conversion require support from the game or publisher; Apollo ownership changes alone do not provide them.'))) +
    part('sources','Official references and image credits',refs('ps3'));
  build('ps3', outline, body);
}
function vita() {
  const repo = 'https://github.com/bucanero/apollo-vita';
  const screenshot = (name, alt, caption) => figure('vita-' + name + '.jpg', alt, caption, 960, 544);
  const outline = [
    ['before', 'Install and prepare'], ['account-ids', 'PSN ID vs Account ID'],
    ['backup', 'Back up a Vita save'], ['resign', 'Change save ownership'],
    ['restore', 'Restore a save'], ['folders', 'Save folder layout'],
    ['adrenaline', 'PSP and PS1 saves'], ['patches', 'Apply a save patch'],
    ['help', 'Troubleshooting'], ['sources', 'Sources and screenshots']
  ];
  const body =
    part('before', 'Install and prepare',
      p('Start on a Vita that already runs homebrew. Get the Vita VPK from the site’s Save Tools page, transfer it with VitaShell and open the VPK in VitaShell to install it. Launch Apollo from LiveArea so it can detect the Vita’s user and Account ID.') +
      '<div class="guide-links">' + link('/console/psvita/save-tools.html#save-tools', 'Get Apollo for Vita') +
      link('/console/psvita/apps.html#install', 'VitaShell installation steps') + '</div>' +
      screenshot('main', 'Apollo Save Tool main menu on PS Vita', 'The Vita edition starts here. Open About to see the Account ID Apollo detected.')) +
    ids('psvita') +
    part('backup', '1. Back up your Vita save',
      steps([
        ['Close the game', 'Return to LiveArea and close the game so it cannot write to the save while Apollo copies it.'],
        ['Select the installed save', 'Open the internal save list in Apollo. Highlight the game and use View Save Details or Triangle to confirm its title ID and slot.'],
        ['Copy the whole save', 'Open Copy save game → Copy Save to Backup Storage. Choose the storage mount and record the folder shown by Apollo. Keep the full folder, including sce_sys, and transfer an untouched copy to your computer with VitaShell.']
      ]) +
      screenshot('saves', 'Apollo Vita internal save list showing game names and title IDs', 'The upstream screenshot calls the internal list HDD Saves. Use the title ID shown next to the game to match the edition.')) +
    part('resign', '2. Assign the save to the receiving Vita',
      steps([
        ['Prepare the receiving console', 'Use the Vita that will run the game. Open the matching edition, create an ordinary save, then close the game. Back up that save before copying anything over it.'],
        ['Check the destination Account ID', 'On that Vita, open About in Apollo and check the 16-character Account ID it detected. View Save Details on the imported copy to see the owner recorded in the save.'],
        ['Resign the backup copy', 'Open the external or backup save list and select the matching decrypted Vita save. Choose <strong>Apply Changes &amp; Resign</strong> without selecting any gameplay patches. Apollo writes the receiving Vita’s detected identity to the save metadata. If Apollo reports an account error, stop and check the save before restoring.'],
        ['Check the result', 'Open View Save Details again and compare the save’s Account ID with About. When they match, restore the copy using the next section.']
      ]) +
      note(p('For a transfer between two accounts, do the resigning on the destination Vita. Your public PSN name stays the same. An all-zero value in About is not a verified match for a specific PSN account.'))) +
    part('restore', '3. Import or restore a Vita save',
      steps([
        ['Stage a decrypted copy', 'Extract a compatible save archive and place the intact save folder under the selected mount’s data/savegames directory. For a community save, you can also use Online DB → the matching title → Download to Backup Storage, then return to the backup save list.'],
        ['Back up the destination slot', 'Check that the matching game has created a save and that you have a separate copy of it. Copying into user storage can overwrite files for that title.'],
        ['Restore from Apollo', 'Select the prepared copy in the backup save list. Choose Copy save game → Copy Save to User Storage (ux0:user/). Open the game and verify the expected progress. Keep both originals until it works.']
      ]) +
      p('For an existing backup that already belongs to this Vita’s account, check its details and restore it directly. Use the ownership step above when the saved Account ID differs.')) +
    part('folders', 'Save folder layout',
      tree('Example decrypted Vita backup on ux0', 'ux0:data/savegames/\n└── PCSE00019/\n    ├── sce_sys/\n    │   └── param.sfo\n    └── <the game’s save files>') +
      p('Keep the folder name and layout created by Apollo. This is one title-ID example. Depending on your storage configuration, backup storage may use <code>uma0:</code>, <code>imc0:</code>, <code>xmc0:</code> or <code>ux0:</code>. Installed Vita saves live under <code>ux0:user/00/savedata/</code>. Restore through Apollo so it can mount the destination save.')) +
    part('adrenaline', 'PSP and PS1 saves in Adrenaline',
      '<h3>PSP games</h3>' +
      p('Adrenaline normally reads PSP saves from <code>ux0:pspemu/PSP/SAVEDATA/</code>. If your Adrenaline setup uses another memory-stick location, verify which mount the game actually reads. Back up the whole PSP save folder. For PSP resigning, follow Apollo’s documented FuseID setup. Decrypting or patching a PSP save can also require that game’s save key.') +
      '<h3>PS1 memory cards</h3>' +
      p('Keep an untouched copy of the virtual memory card before editing it. Apollo scans external card images under <code>data/PS1/VMC/</code> on the selected mount and can import individual saves from <code>data/PS1/SAVEDATA/</code>. Use the memory-card tools for your format and confirm that the game is using the card you edited.') +
      '<div class="guide-links">' + link(repo + '/tree/v2.4.0#psp-saves-requirements', 'Official PSP save requirements') + '</div>') +
    part('patches', 'Apply a supported save patch',
      p('Keep an untouched backup. Open the save for the exact game and title ID, select the relevant patch, then choose <strong>Apply Changes &amp; Resign</strong>. Read any required companion patch in the list and test the result in the game before making another change.') +
      screenshot('codes', 'Vita patch list for Dragon’s Crown, title ID PCSE00019', 'Available patches depend on the game. This example shows the Dragon’s Crown patch list and its required checksum entry.') +
      screenshot('patch', 'Apollo Vita patch view showing the selected Dragon’s Crown patch', 'The patch viewer shows the selected patch’s code. You can use Apollo’s listed patch without typing code.')) +
    part('help', 'Troubleshooting',
      faq('The backup does not appear.', p('Check the selected storage mount. Extract ZIP files and put the actual save folder directly inside data/savegames. Keep sce_sys and the payload together, then press Square to refresh the list.')) +
      faq('Copying to user storage fails.', p('Make a save in the matching game on the receiving Vita first, close the game and check the title ID. If Apollo still cannot mount it, keep your backups and check the project’s release notes before replacing any files.')) +
      faq('The game cannot read the save.', p('Check the title ID, edition, update and any required DLC. Confirm the copy is a decrypted Vita save and check its Account ID after resigning. Restore the untouched backup if the replacement fails.')) +
      faq('Can I move progress between different game editions or consoles?', p('Check the game’s own save compatibility. Resigning changes ownership metadata. Progress stored on a game server follows that game’s account system.'))) +
    part('sources', 'Official references and image credits',
      sourceList([
        [repo + '/releases/tag/v2.4.0', 'Apollo Vita v2.4.0 release notes'],
        [repo + '/tree/v2.4.0#data-folders', 'Apollo Vita storage paths and formats'],
        [repo + '/blob/v2.4.0/source/saves.c', 'Apollo Vita save menus'],
        [repo + '/blob/v2.4.0/source/exec_cmd.c', 'Apollo Vita copy and resign behavior']
      ]) +
      p('Screenshots come from the official Apollo project. Menu wording can differ by version or language. ' + link(images + 'sources.json', 'Image sources and checksums') + '.') +
      p('Guide checked against the project documentation and the v2.4.0 source. Save transfers were not tested on a physical Vita.'));
  build('psvita', outline, body, 'PS Vita', 'vita-main.jpg');
}

function build(platform, outline, content, name = platform.toUpperCase(), hero = platform + '-main.' + (platform === 'ps4' ? 'jpg' : 'png')) {
  const file = 'console/' + platform + '/apollo-guide.html';
  const contents = '<div class="container apollo-layout"><aside class="apollo-outline"><nav aria-label="Guide outline"><h2>On this page</h2><ol>' + outline.map(([id,title]) => '<li>' + link('#'+id,esc(title)) + '</li>').join('') + '</ol></nav></aside><article class="apollo-article" aria-label="Apollo ' + name + ' instructions">' + content + '</article></div>';
  page(file, 'Apollo Save Tool · ' + name, 'Back up saves, change the account owner, resign and restore. Follow the illustrated ' + name + ' steps.', images + hero, [
    [guide('ps4'),'PS4 guide'], [guide('ps3'),'PS3 guide'], [guide('psvita'),'PS Vita guide'],
    ['/console/'+platform+'/save-tools.html','Saves and downloads'], ['#resign','Change save owner']
  ], contents, '#resign','Change save owner', '<a class="btn btn-outline" href="#backup">Back up first</a>');
  let html=fs.readFileSync(path.join(root,file),'utf8');
  html=html.replace('<body class="','<body class="apollo-guide ')
    .replace('<h1>Apollo Save Tool · ' + name + '</h1>', '<h1>Apollo Save Tool <span class="apollo-platform-title">' + name + ' guide</span></h1>')
    .replace('</head>','<link rel="stylesheet" href="/assets/apollo-guide.css?v=20261111-shell">\n<script defer src="/assets/apollo-guide.js?v=20261111"></script>\n</head>')
    .replace(/<footer class="guide-footer">[\s\S]*?<\/footer>/,'<footer class="guide-footer"><div class="container">Apollo is developed by bucanero and project contributors. Guide checked 11 November 2026. ' + link('/pages/contact.html','Report a guide issue') + '.</div></footer>');
  require('./apollo-tools.cjs').writeWithSiteShell(file, require('./search-page-output.cjs').finish(file, html));
}
function buildApolloGuides() { ps4(); ps3(); vita(); }
if (require.main === module) { buildApolloGuides(); console.log('Built illustrated Apollo PS3, PS4 and PS Vita guides.'); }
module.exports = {buildApolloGuides};
