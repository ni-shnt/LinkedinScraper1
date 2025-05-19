#!/usr/bin/env node
// build.js - Script to generate the Chrome extension distribution package
const fs = require('fs');
const path = require('path');

// Configuration
const sourceFiles = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'background.js',
  'content.js'
];

const libFiles = [
  'lib/papaparse.min.js'
];

const docFiles = [
  {
    filename: 'README.txt',
    content: `# LinkedIn Sales Navigator Scraper - Installation Guide

## How to Install the Chrome Extension

1. **Unzip the files** (if you downloaded a ZIP file)

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Type \`chrome://extensions/\` in the address bar and press Enter

3. **Enable Developer Mode**
   - Look for the "Developer mode" toggle in the top-right corner
   - Make sure it's turned ON

4. **Install the Extension**
   - Click the "Load unpacked" button that appears after enabling Developer mode
   - Navigate to and select THIS folder (the folder containing this README.txt file)
   - Click "Open" or "Select Folder"

5. **Verify Installation**
   - The extension should now appear in your extensions list
   - You should see "LinkedIn Sales Navigator Scraper" with its icon

6. **Using the Extension**
   - Go to LinkedIn Sales Navigator (you need a Sales Navigator account)
   - Perform a search for the leads you want to extract
   - Click on the extension icon in your toolbar to open the interface
   - Configure your settings and click "Start Scraping"

## Troubleshooting

- If the extension icon is grayed out, make sure you're on a LinkedIn Sales Navigator page
- If scraping doesn't work, try refreshing the page and restarting the extension
- For database integration, ensure your backend server is running

## Files in This Package

- manifest.json - Extension configuration
- popup.html, popup.css, popup.js - User interface
- content.js - Scraping logic that runs on LinkedIn pages
- background.js - Background processes
- lib/papaparse.min.js - CSV export functionality

For more information, please see the full documentation at the project repository.`
  },
  {
    filename: 'INSTALL_STEPS.md',
    content: `# Installation Steps for LinkedIn Sales Navigator Scraper

## Visual Installation Guide

### Step 1: Open Chrome Extensions Page
Navigate to \`chrome://extensions/\` in your Chrome browser.

### Step 2: Enable Developer Mode
Toggle the "Developer mode" switch in the top-right corner.

### Step 3: Load the Extension
Click the "Load unpacked" button that appears.

### Step 4: Select the Extension Folder
Navigate to and select this folder (the folder containing all extension files).

### Step 5: Verify Installation
The extension should now appear in your extensions list.

### Step 6: Pin the Extension (Optional)
Click the puzzle piece icon in Chrome's toolbar, then pin the LinkedIn Sales Navigator Scraper for easy access.

## Using the Extension

1. Go to LinkedIn Sales Navigator
2. Perform a search for the leads you want to scrape
3. Click the extension icon in your browser toolbar
4. Configure scraping options in the popup interface
5. Click "Start Scraping"
6. View, filter, and export your results

## Enabling Database Integration (Optional)

1. Set up the backend server (see main README)
2. In the extension settings, toggle "Sync with Database"
3. Enter your backend URL (default: http://localhost:5000)
4. Profiles will now be stored in your database as you scrape

## Need Help?

Refer to the README.txt file in this folder or the full documentation at the project repository.`
  }
];

// Create dist directory if it doesn't exist
console.log('Creating dist directory...');
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Create lib directory inside dist if it doesn't exist
const libDir = path.join(distDir, 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir);
}

// Copy source files to dist
console.log('Copying source files...');
sourceFiles.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const destPath = path.join(distDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${file}`);
  } else {
    console.error(`✗ Error: Could not find ${file}`);
  }
});

// Copy lib files to dist/lib
console.log('\nCopying library files...');
libFiles.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const destPath = path.join(distDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${file}`);
  } else {
    console.error(`✗ Error: Could not find ${file}`);
  }
});

// Create documentation files
console.log('\nCreating documentation files...');
docFiles.forEach(doc => {
  const filePath = path.join(distDir, doc.filename);
  fs.writeFileSync(filePath, doc.content);
  console.log(`✓ Created ${doc.filename}`);
});

console.log('\n✅ Build complete! The extension package is ready in the dist/ directory.');
console.log('To install in Chrome:\n1. Go to chrome://extensions/\n2. Enable Developer mode\n3. Click "Load unpacked"\n4. Select the dist/ folder');