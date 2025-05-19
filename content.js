// State
const state = {
  profiles: [],
  isActive: false,
  options: {
    includeEmails: false,
    autoScroll: true,
    scrapingDepth: 2,
    scrapeDelay: 500,
    batchSize: 25
  },
  scrollTimeout: null,
  scrapingInterval: null,
  totalAvailable: 0,
  processedProfiles: new Set()
};

// Setup message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startScraping') {
    state.options = { ...state.options, ...message.options };
    startScraping();
    sendResponse({ status: 'Scraping started' });
  } else if (message.action === 'stopScraping') {
    stopScraping();
    sendResponse({ status: 'Scraping stopped' });
  } else if (message.action === 'getState') {
    sendResponse({
      profiles: state.profiles,
      isActive: state.isActive
    });
  } else if (message.action === 'clearProfiles') {
    state.profiles = [];
    state.processedProfiles.clear();
    sendResponse({ status: 'Profiles cleared' });
  } else if (message.action === 'removeProfile') {
    const profileId = message.profileId;
    state.profiles = state.profiles.filter(p => p.id !== profileId);
    sendResponse({ status: 'Profile removed' });
  }
  return true;
});

// Main function to start scraping
function startScraping() {
  if (state.isActive) return;
  state.isActive = true;
  
  // Reset state for new scraping session if needed
  if (state.scrapingInterval) {
    clearInterval(state.scrapingInterval);
  }
  
  if (state.scrollTimeout) {
    clearTimeout(state.scrollTimeout);
  }
  
  // Determine total available results if possible
  determineTotalResults();
  
  // Send initial status
  sendStatusUpdate('Starting scraper...');
  
  // Start scraping interval
  state.scrapingInterval = setInterval(() => {
    if (!state.isActive) {
      clearInterval(state.scrapingInterval);
      return;
    }
    
    try {
      scrapeVisibleProfiles();
      
      if (state.options.autoScroll) {
        autoScroll();
      }
    } catch (error) {
      console.error('Error during scraping:', error);
      sendStatusUpdate(`Error: ${error.message}`);
    }
  }, 1000); // Check for new profiles every second
}

// Function to stop scraping
function stopScraping() {
  state.isActive = false;
  
  if (state.scrapingInterval) {
    clearInterval(state.scrapingInterval);
    state.scrapingInterval = null;
  }
  
  if (state.scrollTimeout) {
    clearTimeout(state.scrollTimeout);
    state.scrollTimeout = null;
  }
  
  sendStatusUpdate('Scraping stopped');
}

// Auto scroll function
function autoScroll() {
  if (state.scrollTimeout) {
    clearTimeout(state.scrollTimeout);
  }
  
  state.scrollTimeout = setTimeout(() => {
    // Scroll down smoothly
    window.scrollBy({
      top: 300,
      behavior: 'smooth'
    });
    
    // If we're near the bottom, scroll back to top and try again
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
      sendStatusUpdate('Reached bottom, scrolling back to top...');
      
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 1000);
    }
  }, state.options.scrapeDelay);
}

// Determine total available results
function determineTotalResults() {
  try {
    // Look for result count in the page
    const resultCountElem = document.querySelector('.artdeco-spotlight-tab-label-count') || 
                          document.querySelector('.search-results__total') ||
                          document.querySelector('[data-control-name="pagination.results-count"]');
    
    if (resultCountElem) {
      const text = resultCountElem.textContent.trim();
      const match = text.match(/(\d+[\,\.\s]?)+/);
      if (match) {
        state.totalAvailable = parseInt(match[0].replace(/[\,\.\s]/g, ''), 10);
        sendStatusUpdate(`Found ${state.totalAvailable} potential results`);
      }
    }
  } catch (error) {
    console.error('Error determining total results:', error);
    // Default behavior if we can't find the count
    state.totalAvailable = 0;
  }
}

// Scrape visible profiles on the page
function scrapeVisibleProfiles() {
  // Target profile cards - adapt these selectors based on Sales Navigator DOM structure
  const profileCards = document.querySelectorAll('.search-results__result-item, .artdeco-list__item, [data-item-id]');
  
  if (profileCards.length === 0) {
    sendStatusUpdate('No profile cards found on page. Are you on a Sales Navigator search page?');
    return;
  }
  
  sendStatusUpdate(`Found ${profileCards.length} visible profile cards`);
  
  let newProfiles = 0;
  
  // Process each visible profile
  profileCards.forEach(card => {
    try {
      // Skip if already processed
      const dataId = card.getAttribute('data-item-id') || card.getAttribute('data-id') || Math.random().toString(36).substr(2, 9);
      
      if (state.processedProfiles.has(dataId)) {
        return;
      }
      
      state.processedProfiles.add(dataId);
      
      // Extract basic profile information
      const profile = extractProfileData(card);
      
      if (profile && profile.name) {
        // Add unique identifier
        profile.id = dataId;
        
        // Optional: Extract emails if enabled
        if (state.options.includeEmails) {
          const email = extractEmail(card);
          if (email) {
            profile.email = email;
          }
          
          // If depth > 1, try additional methods to find email
          if (state.options.scrapingDepth >= 2) {
            expandProfileDetails(card).then(expandedEmail => {
              if (expandedEmail && !profile.email) {
                profile.email = expandedEmail;
                // Update the existing profile
                const index = state.profiles.findIndex(p => p.id === dataId);
                if (index >= 0) {
                  state.profiles[index] = {...state.profiles[index], email: expandedEmail};
                  syncProfiles();
                }
              }
            });
          }
        }
        
        // Add to profiles collection if not already there
        if (!state.profiles.some(p => p.id === profile.id)) {
          state.profiles.push(profile);
          newProfiles++;
        }
      }
    } catch (error) {
      console.error('Error processing profile card:', error);
    }
  });
  
  if (newProfiles > 0) {
    sendStatusUpdate(`Added ${newProfiles} new profiles (total: ${state.profiles.length})`);
    
    // Deduplicate and clean profiles
    deduplicateAndCleanProfiles();
    
    // Send updated profiles to popup
    syncProfiles();
  }
  
  // Check if we've reached the batch size limit
  if (state.profiles.length >= state.options.batchSize && state.options.batchSize > 0) {
    sendStatusUpdate(`Reached batch limit of ${state.options.batchSize} profiles`, true);
    stopScraping();
  }
}

// Extract profile data from a card
function extractProfileData(card) {
  const profile = {
    name: '',
    title: '',
    company: '',
    profileUrl: '',
    companyUrl: '',
    email: ''
  };
  
  try {
    // Name
    const nameElement = card.querySelector('.artdeco-entity-lockup__title a, .result-lockup__name a, [data-control-name="view_profile"]');
    if (nameElement) {
      profile.name = nameElement.textContent.trim();
      profile.profileUrl = nameElement.href;
    }
    
    // Title
    const titleElement = card.querySelector('.artdeco-entity-lockup__subtitle, .result-lockup__highlight-keyword, [data-control-name="view_position"]');
    if (titleElement) {
      profile.title = titleElement.textContent.trim();
    }
    
    // Company
    const companyElement = card.querySelector('.artdeco-entity-lockup__caption, .result-lockup__position-company, [data-control-name="view_company"]');
    if (companyElement) {
      profile.company = companyElement.textContent.trim();
      
      // Try to find company URL
      const companyLink = companyElement.querySelector('a');
      if (companyLink) {
        profile.companyUrl = companyLink.href;
      }
    }
  } catch (error) {
    console.error('Error extracting profile data:', error);
  }
  
  return profile;
}

// Extract email from a profile card
function extractEmail(card) {
  try {
    // Look for email elements (could be in the main card or in a hover card)
    const emailElements = [
      card.querySelector('[href^="mailto:"]'),
      card.querySelector('.artdeco-entity-lockup__metadata [data-control-name="view_email"]'),
      document.querySelector('.profile-view [href^="mailto:"]'),
      document.querySelector('.spotlight-result-lockup__email-address')
    ];
    
    for (const elem of emailElements) {
      if (elem) {
        let email = '';
        if (elem.href) {
          email = elem.href.replace('mailto:', '').trim();
        } else {
          email = elem.textContent.trim();
        }
        
        // Validate email
        if (isValidEmail(email)) {
          return email;
        }
      }
    }
    
    // Look in text content for email patterns
    const text = card.textContent;
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && isValidEmail(emailMatch[0])) {
      return emailMatch[0];
    }
  } catch (error) {
    console.error('Error extracting email:', error);
  }
  
  return '';
}

// Expand profile details to look for more information (especially emails)
async function expandProfileDetails(card) {
  if (state.options.scrapingDepth < 2) return '';
  
  try {
    // Look for a view profile button or link
    const viewButton = card.querySelector('[data-control-name="view_profile"], .result-lockup__name a, .artdeco-entity-lockup__title a');
    
    if (viewButton) {
      // Rather than opening the profile in a new tab, we'll try to trigger any hover card or info panel
      viewButton.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      
      // Wait for potential hover card to appear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for emails in the hover card
      const hoverCard = document.querySelector('.artdeco-hoverable-content--visible, .profile-view, .spotlight-result');
      
      if (hoverCard) {
        const email = extractEmail(hoverCard);
        if (email) return email;
      }
      
      // If depth level is 3 (deep), we might click to see more details
      if (state.options.scrapingDepth >= 3) {
        // Find and click "See more" buttons or similar
        const seeMoreButton = document.querySelector('[data-control-name="more_info"], .spotlight-result__simple-insight-lockup-see-more');
        
        if (seeMoreButton) {
          seeMoreButton.click();
          
          // Wait for expanded content
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check for email in expanded view
          const expandedInfo = document.querySelector('.profile-view, .spotlight-result--expanded');
          if (expandedInfo) {
            const email = extractEmail(expandedInfo);
            if (email) return email;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error expanding profile details:', error);
  }
  
  return '';
}

// Deduplicate and clean profiles
function deduplicateAndCleanProfiles() {
  // Create a map to deduplicate by LinkedIn URL
  const uniqueProfiles = new Map();
  
  state.profiles.forEach(profile => {
    // Clean profile data
    const cleanedProfile = {
      ...profile,
      name: (profile.name || '').trim(),
      title: (profile.title || '').trim(),
      company: (profile.company || '').trim(),
      email: (profile.email || '').trim(),
      profileUrl: (profile.profileUrl || '').trim(),
      companyUrl: (profile.companyUrl || '').trim()
    };
    
    // Use profile URL as unique key if available, otherwise use name + company
    const key = cleanedProfile.profileUrl || `${cleanedProfile.name}-${cleanedProfile.company}`;
    
    // If this is a new profile or has more information than existing one, update it
    const existing = uniqueProfiles.get(key);
    if (!existing || 
        (!existing.email && cleanedProfile.email) || 
        (!existing.title && cleanedProfile.title) ||
        (!existing.company && cleanedProfile.company)) {
      uniqueProfiles.set(key, cleanedProfile);
    }
  });
  
  // Convert map back to array
  state.profiles = Array.from(uniqueProfiles.values());
}

// Send updates to the popup
function syncProfiles() {
  chrome.runtime.sendMessage({
    action: 'updateProfiles',
    profiles: state.profiles,
    totalAvailable: state.totalAvailable
  });
}

// Send status updates to the popup
function sendStatusUpdate(status, isComplete = false) {
  chrome.runtime.sendMessage({
    action: 'updateStatus',
    status: status,
    isComplete: isComplete
  });
}

// Helper: Validate email format
function isValidEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// Initial setup when script loads
function initialize() {
  console.log('LinkedIn Sales Navigator Scraper initialized');
  
  // Check if we're on a Sales Navigator page
  if (window.location.href.includes('linkedin.com/sales')) {
    // Observe DOM changes to detect when new profiles are loaded
    setupMutationObserver();
  }
}

// Setup mutation observer to detect when new results load
function setupMutationObserver() {
  const observer = new MutationObserver(mutations => {
    if (state.isActive) {
      // Check if new profile cards were added
      const hasNewProfiles = mutations.some(mutation => {
        return Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            return node.querySelector('.search-results__result-item, .artdeco-list__item, [data-item-id]');
          }
          return false;
        });
      });
      
      if (hasNewProfiles) {
        sendStatusUpdate('New profiles detected, processing...');
        scrapeVisibleProfiles();
      }
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize the script
initialize();
