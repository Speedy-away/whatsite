# Site Management Guide

## Easy Cheat Management System

This guide explains how to easily add, remove, and manage cheats on your website.

### 🎮 Adding New Game Pages

1. **Create New Game Folder**
   ```
   games/
   └── [game-name]/
       └── index.html
   ```

2. **Copy Template Structure**
   - Copy `games/gta/index.html` as your template
   - Replace all GTA-specific content with your new game

3. **Update Main Homepage**
   - Edit `index.html`
   - Find the games grid section
   - Add new game card:

   ```html
   <div class="game-card" data-search="your game keywords">
       <div class="game-image">
           <img src="assets/images/your-game.png" alt="Game Name" loading="lazy">
           <div class="game-overlay">
               <span class="game-status available">Available</span>
           </div>
       </div>
       <div class="game-info">
           <h3 class="game-title">Game Name</h3>
           <p class="game-description">Brief description</p>
           <div class="game-tags">
               <span class="tag">PC</span>
               <span class="tag">Free</span>
           </div>
           <a href="games/game-name/index.html" class="game-link">
               <i class="fas fa-download"></i>
               View Cheats
           </a>
       </div>
   </div>
   ```

### 🛠️ Adding New Cheats to Existing Games

1. **Open Game Page**
   - Navigate to `games/[game-name]/index.html`

2. **Find Cheats Section**
   - Look for `<div class="cheats-grid">` or similar section

3. **Add New Cheat Card**
   ```html
   <div class="cheat-card" data-search="cheat keywords">
       <div class="cheat-header">
           <div class="cheat-icon">
               <i class="fas fa-crosshairs"></i>
           </div>
           <div class="cheat-info">
               <h3>Cheat Name</h3>
               <p>Brief description of what the cheat does</p>
           </div>
           <div class="cheat-status">
               <span class="status-badge detected">Undetected</span>
           </div>
       </div>

       <div class="cheat-features">
           <div class="features-grid">
               <div class="feature">
                   <i class="fas fa-eye"></i>
                   <span>Feature 1</span>
               </div>
               <div class="feature">
                   <i class="fas fa-shield"></i>
                   <span>Feature 2</span>
               </div>
           </div>
       </div>

       <div class="cheat-actions">
           <a href="your-download-link" class="btn btn-primary" target="_blank">
               <i class="fas fa-download"></i>
               Download
           </a>
           <button class="btn btn-outline" onclick="showInfo('cheat-id')">
               <i class="fas fa-info"></i>
               More Info
           </button>
       </div>
   </div>
   ```

### 🗑️ Removing Cheats

1. **Find the Cheat**
   - Open the game page file
   - Locate the cheat card you want to remove

2. **Delete the Entire Card**
   - Remove the complete `<div class="cheat-card">...</div>` block
   - Save the file

### 📱 Adding New Tools

1. **Open Tools Page**
   - Edit `tools/injectors.html` or create new tool page

2. **Add Tool Card**
   ```html
   <div class="tool-card" data-search="tool keywords">
       <div class="tool-icon">
           <i class="fas fa-wrench"></i>
       </div>
       <div class="tool-content">
           <h3>Tool Name</h3>
           <p>Tool description and what it does</p>
           <div class="tool-tags">
               <span class="tag safe">Safe</span>
               <span class="tag free">Free</span>
           </div>
           <div class="tool-features">
               <ul>
                   <li>Feature 1</li>
                   <li>Feature 2</li>
               </ul>
           </div>
           <a href="download-link" class="tool-download" target="_blank">
               <i class="fas fa-download"></i>
               Download
           </a>
       </div>
   </div>
   ```

### 🎨 Adding Images

1. **Upload Images**
   - Place PNG images in `assets/images/` folder
   - Use descriptive names like `gta-v-cheat.png`

2. **Update Image References**
   - Replace `src="assets/images/your-image.png"`
   - Ensure images are optimized (under 500KB recommended)

### 🔧 Status Badge Options

- `<span class="status-badge detected">Undetected</span>` - Green
- `<span class="status-badge updating">Updating</span>` - Yellow
- `<span class="status-badge offline">Offline</span>` - Red

### 📊 Feature Icons (FontAwesome)

Common icons you can use:
- `fas fa-crosshairs` - Aimbot
- `fas fa-eye` - ESP/Wallhack
- `fas fa-shield` - Protection
- `fas fa-magic` - Special features
- `fas fa-cog` - Settings
- `fas fa-bolt` - Speed hacks
- `fas fa-gem` - Premium features

### 🎯 Search Keywords

When adding `data-search` attributes, include:
- Game name and abbreviations
- Cheat type (aimbot, wallhack, etc.)
- Platform (PC, console)
- Status (free, premium, safe)

Example: `data-search="call of duty warzone aimbot wallhack pc free safe"`

### 🔄 Quick Updates

**To change cheat status:**
1. Find the status badge in the cheat card
2. Change the class: `detected`, `updating`, or `offline`
3. Update the text accordingly

**To update download links:**
1. Find the download button `href` attribute
2. Replace with new download URL

**To modify features:**
1. Edit the features list in the cheat card
2. Add/remove `<li>` items as needed

### 📝 Best Practices

1. **Always backup** files before making changes
2. **Test changes** on a local copy first
3. **Use consistent naming** for files and folders
4. **Optimize images** before uploading
5. **Keep descriptions short** and informative
6. **Update search keywords** when adding content
7. **Maintain consistent styling** across all pages

### 🚨 Important Notes

- Never edit the core CSS (`style.css`) or JavaScript (`script.js`) files unless you know what you're doing
- Always use relative paths for links and images
- Test the website on mobile devices after making changes
- Keep download links up to date and working
- Remove broken or outdated cheats promptly

### 📞 Need Help?

If you need assistance with more complex changes or run into issues:
1. Check the browser console for errors (F12)
2. Validate your HTML structure
3. Test changes in a local environment first
4. Consider creating a backup before major modifications