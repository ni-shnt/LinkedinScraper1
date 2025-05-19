// State management
const state = {
  profiles: [],
  isActive: false,
  includeEmails: false,
  autoScroll: true,
  scrapingDepth: 2,
  scrapeDelay: 500,
  batchSize: 25,
  notifications: true,
  syncWithBackend: false,
  backendUrl: 'http://localhost:5000', // Default backend URL
  currentFilter: '',
  currentTab: null,
  currentPanel: 'main', // 'main', 'export', 'settings'
};

// DOM elements
const elements = {
  statusBadge: document.getElementById('status-badge'),
  currentPage: document.getElementById('current-page'),
  profilesFound: document.getElementById('profiles-found'),
  progressBar: document.getElementById('progress-bar'),
  profileCount: document.getElementById('profile-count'),
  companyCount: document.getElementById('company-count'),
  emailCount: document.getElementById('email-count'),
  resultsContainer: document.getElementById('results-container'),
  statusMessage: document.getElementById('status-message'),
  scrapeBtn: document.getElementById('scrape-btn'),
  emailToggle: document.getElementById('email-toggle'),
  scrollToggle: document.getElementById('scroll-toggle'),
  depthSelect: document.getElementById('depth-select'),
  delayRange: document.getElementById('delay-range'),
  delayValue: document.getElementById('delay-value'),
  batchSize: document.getElementById('batch-size'),
  notificationToggle: document.getElementById('notification-toggle'),
  backendToggle: document.getElementById('backend-toggle'),
  backendUrl: document.getElementById('backend-url'),
  filterInput: document.getElementById('filter-input'),
  settingsPanel: document.getElementById('settings-panel'),
  exportPanel: document.getElementById('export-panel'),
  settingsBtn: document.getElementById('settings-btn'),
  exportBtn: document.getElementById('export-btn'),
  clearBtn: document.getElementById('clear-btn'),
  cancelExportBtn: document.getElementById('cancel-export-btn'),
  downloadBtn: document.getElementById('download-btn'),
  resetSettingsBtn: document.getElementById('reset-settings-btn'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  helpBtn: document.getElementById('help-btn'),
  docsBtn: document.getElementById('docs-btn'),
  filename: document.getElementById('filename'),
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings from storage
  await loadSettings();
  
  // Initialize UI based on loaded settings
  updateUI();
  
  // Check current tab
  await checkCurrentTab();
  
  // Set up event listeners
  setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
  // Scraping Control
  elements.scrapeBtn.addEventListener('click', toggleScraping);
  elements.emailToggle.addEventListener('change', () => {
    state.includeEmails = elements.emailToggle.checked;
    updateToggleStyle(elements.emailToggle);
    saveSettings();
  });
  elements.scrollToggle.addEventListener('change', () => {
    state.autoScroll = elements.scrollToggle.checked;
    updateToggleStyle(elements.scrollToggle);
    saveSettings();
  });
  elements.depthSelect.addEventListener('change', () => {
    state.scrapingDepth = parseInt(elements.depthSelect.value, 10);
    saveSettings();
  });
  
  // UI Control
  elements.clearBtn.addEventListener('click', clearResults);
  elements.exportBtn.addEventListener('click', showExportPanel);
  elements.settingsBtn.addEventListener('click', toggleSettingsPanel);
  
  // Export Panel
  elements.cancelExportBtn.addEventListener('click', hideExportPanel);
  elements.downloadBtn.addEventListener('click', exportData);
  
  // Settings Panel
  elements.notificationToggle.addEventListener('change', () => {
    state.notifications = elements.notificationToggle.checked;
    updateToggleStyle(elements.notificationToggle);
    saveSettings();
  });
  elements.backendToggle.addEventListener('change', () => {
    state.syncWithBackend = elements.backendToggle.checked;
    updateToggleStyle(elements.backendToggle);
    saveSettings();
  });
  elements.backendUrl.addEventListener('change', () => {
    state.backendUrl = elements.backendUrl.value;
    saveSettings();
  });
  elements.delayRange.addEventListener('input', () => {
    state.scrapeDelay = parseInt(elements.delayRange.value, 10);
    elements.delayValue.textContent = `${state.scrapeDelay}ms`;
    saveSettings();
  });
  elements.batchSize.addEventListener('change', () => {
    state.batchSize = parseInt(elements.batchSize.value, 10);
    saveSettings();
  });
  elements.resetSettingsBtn.addEventListener('click', resetSettings);
  elements.saveSettingsBtn.addEventListener('click', () => {
    saveSettings();
    hideSettingsPanel();
    updateStatusMessage('Settings saved');
  });
  
  // Filter
  elements.filterInput.addEventListener('input', () => {
    state.currentFilter = elements.filterInput.value.toLowerCase();
    renderProfiles();
  });
  
  // Help
  elements.helpBtn.addEventListener('click', showHelp);
  elements.docsBtn.addEventListener('click', openDocs);
}

// Update toggle button styling
function updateToggleStyle(toggleElement) {
  const label = toggleElement.nextElementSibling;
  if (toggleElement.checked) {
    label.classList.add('bg-linkedin-blue');
    label.classList.remove('bg-neutral-light');
  } else {
    label.classList.remove('bg-linkedin-blue');
    label.classList.add('bg-neutral-light');
  }
}

// Check if the current tab is a LinkedIn Sales Navigator tab
async function checkCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    state.currentTab = tab;
    
    // Update UI based on tab URL
    if (tab.url && tab.url.includes('linkedin.com/sales')) {
      elements.currentPage.textContent = 'Sales Navigator';
      elements.scrapeBtn.disabled = false;
      updateStatusMessage('Ready to scrape');
    } else {
      elements.currentPage.textContent = 'Not Sales Navigator';
      elements.scrapeBtn.disabled = true;
      updateStatusMessage('Navigate to LinkedIn Sales Navigator');
    }
    
    // Request profile data from content script if tab is LinkedIn
    if (tab.url && tab.url.includes('linkedin.com/sales')) {
      chrome.tabs.sendMessage(tab.id, { action: 'getState' }, (response) => {
        if (response && response.profiles) {
          state.profiles = response.profiles;
          state.isActive = response.isActive;
          updateUI();
        }
      });
    }
  } catch (error) {
    console.error('Error checking current tab:', error);
    updateStatusMessage('Error: Unable to access tab');
  }
}

// Toggle scraping on/off
function toggleScraping() {
  if (!state.currentTab) return;
  
  state.isActive = !state.isActive;
  
  if (state.isActive) {
    // Start scraping
    elements.scrapeBtn.classList.remove('bg-linkedin-blue');
    elements.scrapeBtn.classList.add('bg-error');
    elements.scrapeBtn.innerHTML = '<i class="ri-stop-fill mr-1"></i><span>Stop Scraping</span>';
    elements.statusBadge.classList.remove('bg-success');
    elements.statusBadge.classList.add('bg-warning');
    elements.statusBadge.textContent = 'Scraping';
    updateStatusMessage('Scraping in progress...');
    
    // Send message to content script to start scraping
    chrome.tabs.sendMessage(state.currentTab.id, {
      action: 'startScraping',
      options: {
        includeEmails: state.includeEmails,
        autoScroll: state.autoScroll,
        scrapingDepth: state.scrapingDepth,
        scrapeDelay: state.scrapeDelay,
        batchSize: state.batchSize,
        syncWithBackend: state.syncWithBackend,
        backendUrl: state.backendUrl
      }
    });
  } else {
    // Stop scraping
    elements.scrapeBtn.classList.remove('bg-error');
    elements.scrapeBtn.classList.add('bg-linkedin-blue');
    elements.scrapeBtn.innerHTML = '<i class="ri-play-fill mr-1"></i><span>Start Scraping</span>';
    elements.statusBadge.classList.remove('bg-warning');
    elements.statusBadge.classList.add('bg-success');
    elements.statusBadge.textContent = 'Ready';
    updateStatusMessage('Scraping stopped');
    
    // Send message to content script to stop scraping
    chrome.tabs.sendMessage(state.currentTab.id, { action: 'stopScraping' });
  }
}

// Clear scraped results
function clearResults() {
  if (confirm('Are you sure you want to clear all scraped data?')) {
    state.profiles = [];
    renderProfiles();
    updateUI();
    
    if (state.currentTab) {
      chrome.tabs.sendMessage(state.currentTab.id, { action: 'clearProfiles' });
    }
    
    updateStatusMessage('Results cleared');
  }
}

// Show export panel
function showExportPanel() {
  elements.exportPanel.classList.remove('hidden');
  elements.settingsPanel.classList.add('hidden');
  state.currentPanel = 'export';
}

// Hide export panel
function hideExportPanel() {
  elements.exportPanel.classList.add('hidden');
  state.currentPanel = 'main';
}

// Toggle settings panel
function toggleSettingsPanel() {
  if (elements.settingsPanel.classList.contains('hidden')) {
    elements.settingsPanel.classList.remove('hidden');
    elements.exportPanel.classList.add('hidden');
    state.currentPanel = 'settings';
  } else {
    elements.settingsPanel.classList.add('hidden');
    state.currentPanel = 'main';
  }
}

// Hide settings panel
function hideSettingsPanel() {
  elements.settingsPanel.classList.add('hidden');
  state.currentPanel = 'main';
}

// Show help dialog
function showHelp() {
  alert('LinkedIn Sales Navigator Scraper\n\n' +
        '• Start on a Sales Navigator search results page\n' +
        '• Click "Start Scraping" to begin extraction\n' +
        '• Toggle "Include Emails" to attempt to find emails\n' +
        '• Use the filter to search within results\n' +
        '• Export your data in CSV or JSON format\n\n' +
        'Note: Make sure to only collect data in compliance with LinkedIn\'s terms of service.');
}

// Open documentation
function openDocs() {
  chrome.tabs.create({ url: 'https://github.com/yourusername/linkedin-sales-navigator-scraper' });
}

// Export scraped data
function exportData() {
  if (state.profiles.length === 0) {
    alert('No data to export. Please scrape profiles first.');
    return;
  }
  
  // Get selected format
  const format = document.querySelector('input[name="format"]:checked').value;
  
  // Get selected fields
  const selectedFields = {};
  document.querySelectorAll('#export-panel input[type="checkbox"]').forEach(checkbox => {
    selectedFields[checkbox.dataset.field] = checkbox.checked;
  });
  
  // Filter profiles to only include selected fields
  const filteredProfiles = state.profiles.map(profile => {
    const filtered = {};
    if (selectedFields.name) filtered.name = profile.name || '';
    if (selectedFields.title) filtered.title = profile.title || '';
    if (selectedFields.company) filtered.company = profile.company || '';
    if (selectedFields.email) filtered.email = profile.email || '';
    if (selectedFields.profile_url) filtered.profile_url = profile.profileUrl || '';
    if (selectedFields.company_url) filtered.company_url = profile.companyUrl || '';
    return filtered;
  });
  
  // Get filename
  const filename = elements.filename.value || 'linkedin_leads_export';
  
  // Export based on format
  if (format === 'csv') {
    // Use PapaParse to generate CSV
    const csv = Papa.unparse(filteredProfiles);
    downloadFile(csv, `${filename}.csv`, 'text/csv');
  } else if (format === 'json') {
    // Generate JSON
    const json = JSON.stringify(filteredProfiles, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
  }
  
  hideExportPanel();
  updateStatusMessage('Data exported successfully');
}

// Download file helper
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  
  // Use Chrome downloads API
  chrome.downloads.download({
    url: URL.createObjectURL(blob),
    filename: filename,
    saveAs: true
  });
}

// Load settings from Chrome storage
async function loadSettings() {
  try {
    const saved = await chrome.storage.sync.get([
      'includeEmails',
      'autoScroll',
      'scrapingDepth',
      'scrapeDelay',
      'batchSize',
      'notifications',
      'syncWithBackend',
      'backendUrl'
    ]);
    
    // Apply saved settings with fallbacks to defaults
    state.includeEmails = saved.includeEmails !== undefined ? saved.includeEmails : false;
    state.autoScroll = saved.autoScroll !== undefined ? saved.autoScroll : true;
    state.scrapingDepth = saved.scrapingDepth || 2;
    state.scrapeDelay = saved.scrapeDelay || 500;
    state.batchSize = saved.batchSize || 25;
    state.notifications = saved.notifications !== undefined ? saved.notifications : true;
    state.syncWithBackend = saved.syncWithBackend !== undefined ? saved.syncWithBackend : false;
    state.backendUrl = saved.backendUrl || 'http://localhost:5000';
  } catch (error) {
    console.error('Error loading settings:', error);
    // Fall back to defaults
  }
}

// Save settings to Chrome storage
function saveSettings() {
  chrome.storage.sync.set({
    includeEmails: state.includeEmails,
    autoScroll: state.autoScroll,
    scrapingDepth: state.scrapingDepth,
    scrapeDelay: state.scrapeDelay,
    batchSize: state.batchSize,
    notifications: state.notifications,
    syncWithBackend: state.syncWithBackend,
    backendUrl: state.backendUrl
  });
}

// Reset settings to defaults
function resetSettings() {
  state.includeEmails = false;
  state.autoScroll = true;
  state.scrapingDepth = 2;
  state.scrapeDelay = 500;
  state.batchSize = 25;
  state.notifications = true;
  state.syncWithBackend = false;
  state.backendUrl = 'http://localhost:5000';
  
  // Update UI to reflect defaults
  elements.emailToggle.checked = false;
  elements.scrollToggle.checked = true;
  elements.depthSelect.value = '2';
  elements.delayRange.value = '500';
  elements.delayValue.textContent = '500ms';
  elements.batchSize.value = '25';
  elements.notificationToggle.checked = true;
  elements.backendToggle.checked = false;
  elements.backendUrl.value = 'http://localhost:5000';
  
  // Update toggle styling
  updateToggleStyle(elements.emailToggle);
  updateToggleStyle(elements.scrollToggle);
  updateToggleStyle(elements.notificationToggle);
  updateToggleStyle(elements.backendToggle);
  
  // Save defaults
  saveSettings();
  
  updateStatusMessage('Settings reset to defaults');
}

// Update UI with current state
function updateUI() {
  // Update form controls to match state
  elements.emailToggle.checked = state.includeEmails;
  elements.scrollToggle.checked = state.autoScroll;
  elements.depthSelect.value = state.scrapingDepth.toString();
  elements.delayRange.value = state.scrapeDelay.toString();
  elements.delayValue.textContent = `${state.scrapeDelay}ms`;
  elements.batchSize.value = state.batchSize.toString();
  elements.notificationToggle.checked = state.notifications;
  elements.backendToggle.checked = state.syncWithBackend;
  elements.backendUrl.value = state.backendUrl;
  
  // Update toggle styling
  updateToggleStyle(elements.emailToggle);
  updateToggleStyle(elements.scrollToggle);
  updateToggleStyle(elements.notificationToggle);
  updateToggleStyle(elements.backendToggle);
  
  // Update scrape button state
  if (state.isActive) {
    elements.scrapeBtn.classList.remove('bg-linkedin-blue');
    elements.scrapeBtn.classList.add('bg-error');
    elements.scrapeBtn.innerHTML = '<i class="ri-stop-fill mr-1"></i><span>Stop Scraping</span>';
    elements.statusBadge.classList.remove('bg-success');
    elements.statusBadge.classList.add('bg-warning');
    elements.statusBadge.textContent = 'Scraping';
  } else {
    elements.scrapeBtn.classList.remove('bg-error');
    elements.scrapeBtn.classList.add('bg-linkedin-blue');
    elements.scrapeBtn.innerHTML = '<i class="ri-play-fill mr-1"></i><span>Start Scraping</span>';
    elements.statusBadge.classList.remove('bg-warning');
    elements.statusBadge.classList.add('bg-success');
    elements.statusBadge.textContent = 'Ready';
  }
  
  // Update stats
  elements.profilesFound.textContent = state.profiles.length.toString();
  elements.profileCount.textContent = state.profiles.length.toString();
  
  // Count unique companies
  const uniqueCompanies = new Set(state.profiles.map(p => p.company).filter(Boolean));
  elements.companyCount.textContent = uniqueCompanies.size.toString();
  
  // Count profiles with emails
  const profilesWithEmail = state.profiles.filter(p => p.email && p.email.trim() !== '').length;
  elements.emailCount.textContent = profilesWithEmail.toString();
  
  // Render profile list
  renderProfiles();
}

// Render profile list with filtering
function renderProfiles() {
  const container = elements.resultsContainer;
  container.innerHTML = '';
  
  if (state.profiles.length === 0) {
    container.innerHTML = '<div class="text-center text-neutral-medium py-4">No profiles found yet</div>';
    return;
  }
  
  // Apply filtering
  let filteredProfiles = state.profiles;
  if (state.currentFilter) {
    filteredProfiles = state.profiles.filter(profile => {
      const searchableText = `${profile.name} ${profile.title} ${profile.company}`.toLowerCase();
      return searchableText.includes(state.currentFilter);
    });
  }
  
  if (filteredProfiles.length === 0) {
    container.innerHTML = '<div class="text-center text-neutral-medium py-4">No matching profiles found</div>';
    return;
  }
  
  // Create and append profile elements
  filteredProfiles.forEach(profile => {
    const profileElement = createProfileElement(profile);
    container.appendChild(profileElement);
  });
}

// Create a profile element
function createProfileElement(profile) {
  const profileDiv = document.createElement('div');
  profileDiv.className = 'profile-item';
  profileDiv.dataset.id = profile.id;
  
  const hasEmail = profile.email && profile.email.trim() !== '';
  
  profileDiv.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-medium text-sm">${profile.name || 'Unnamed Profile'}</h3>
        <p class="text-xs text-neutral-medium">${profile.title || 'No Title'}</p>
        <p class="text-xs">${profile.company || 'No Company'}</p>
      </div>
      <div class="flex space-x-1">
        <button class="text-xs hover:text-linkedin-blue open-profile" title="View on LinkedIn">
          <i class="ri-external-link-line"></i>
        </button>
        <button class="text-xs hover:text-error remove-profile" title="Remove">
          <i class="ri-close-line"></i>
        </button>
      </div>
    </div>
    <div class="mt-1 flex items-center text-xs ${hasEmail ? 'text-linkedin-blue' : 'text-neutral-medium italic'}">
      <i class="ri-mail-line text-xs mr-1 text-neutral-medium"></i>
      <span>${hasEmail ? profile.email : 'No email found'}</span>
    </div>
  `;
  
  // Set up event listeners
  profileDiv.querySelector('.open-profile').addEventListener('click', () => {
    if (profile.profileUrl) {
      chrome.tabs.create({ url: profile.profileUrl });
    }
  });
  
  profileDiv.querySelector('.remove-profile').addEventListener('click', () => {
    // Remove profile
    state.profiles = state.profiles.filter(p => p.id !== profile.id);
    profileDiv.remove();
    updateUI();
    
    // Sync with content script
    if (state.currentTab) {
      chrome.tabs.sendMessage(state.currentTab.id, { 
        action: 'removeProfile', 
        profileId: profile.id 
      });
    }
  });
  
  return profileDiv;
}

// Update status message in footer
function updateStatusMessage(message) {
  elements.statusMessage.textContent = message;
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateProfiles') {
    state.profiles = message.profiles;
    updateUI();
    
    // Update progress indicator
    if (message.totalAvailable && message.totalAvailable > 0) {
      const progress = Math.min(100, Math.round((state.profiles.length / message.totalAvailable) * 100));
      elements.progressBar.style.width = `${progress}%`;
    }
  }
  
  if (message.action === 'updateStatus') {
    updateStatusMessage(message.status);
    if (message.isComplete) {
      state.isActive = false;
      updateUI();
    }
  }
  
  sendResponse({ received: true });
  return true;
});
