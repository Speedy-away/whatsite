#!/bin/bash

# Site Fixes Auto-Apply Script
# This script automatically adds the site-fixes.css to all HTML files

echo "🎮 Applying Site Improvements..."
echo "================================"

# Navigate to project directory
cd "$(dirname "$0")"

# Counter
count=0

# Find all HTML files and add site-fixes.css if not already present
for file in $(find . -name "*.html" -not -path "./node_modules/*" -not -path "./.git/*"); do
    # Check if file already has site-fixes.css
    if grep -q "site-fixes.css" "$file"; then
        echo "⏭️  Skipping $file (already has site-fixes.css)"
    else
        # Check if file has style.css
        if grep -q "style.css" "$file"; then
            # Add site-fixes.css after style.css
            sed -i 's|</head>|    <link rel="stylesheet" href="assets/css/site-fixes.css">\n</head>|' "$file"
            echo "✅ Updated: $file"
            ((count++))
        else
            echo "⚠️  Warning: $file doesn't have style.css, skipping..."
        fi
    fi
done

echo ""
echo "================================"
echo "✨ Site improvements applied!"
echo "📊 Updated $count file(s)"
echo ""
echo "Changes made:"
echo "- ✅ Fixed sidebar scrollbar issue"
echo "- ✅ Enhanced Recent Activity feed"
echo "- ✅ Improved YouTube integration"
echo "- ✅ Better mobile responsiveness"
echo "- ✅ Custom scrollbars"
echo "- ✅ Performance optimizations"
echo ""
echo "Next steps:"
echo "1. Test your site in a browser"
echo "2. Check mobile responsiveness"
echo "3. Verify YouTube page functionality"
echo ""
echo "📖 For more info, see: SITE-IMPROVEMENTS-COMPLETE.md"
