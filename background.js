// Background script for LinkedIn Sales Navigator Scraper

// Initialize state
let extensionState = {
  isActive: false,
  activeTabId: null
};

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the page is a LinkedIn Sales Navigator page
  if (tab.url && tab.url.includes('linkedin.com/sales') && changeInfo.status === 'complete') {
    // Make the extension icon active for this tab
    chrome.action.setIcon({
      tabId: tabId,
      path: {
        16: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA3N0I1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1saW5rZWRpbiI+PHBhdGggZD0iTTE2IDhMMTYgMTMgTTE4IDExIEwyMiA4TDIyIDEzIChNMjAgMTEpIE0yIDlIMTIgTTIgMTNIMTIgTTIgMTdIMTIiLz48cGF0aCBkPSJNMTYgOGEyIDIgMCAwIDEgMiAySE0xNiA4YTIgMiAwIDAgMC0yIDJNMTggMThhMiAyIDAgMCAxLTIgMk0xOCAxOGEyIDIgMCAwIDAgMiAyTTQgOGEyIDIgMCAwIDEgMi0yaDEyYTIgMiAwIDAgMSAyIDJ2OGEyIDIgMCAwIDEtMiAySDZhMiAyIDAgMCAxLTItMlY4eiI+PC9wYXRoPjwvc3ZnPg=="
      }
    });
  }
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages based on action
  if (message.action === 'startScraping') {
    extensionState.isActive = true;
    extensionState.activeTabId = sender.tab ? sender.tab.id : null;
    sendResponse({ success: true });
  } 
  else if (message.action === 'stopScraping') {
    extensionState.isActive = false;
    sendResponse({ success: true });
  }
  // Return true to keep the message channel open for async responses
  return true;
});

// Optional: Handle browser action click (to support click-to-activate functionality)
chrome.action.onClicked.addListener(tab => {
  if (tab.url && tab.url.includes('linkedin.com/sales')) {
    // Open the popup if we're on a LinkedIn Sales Navigator page
    chrome.action.openPopup();
  } else {
    // Notify the user they need to navigate to LinkedIn Sales Navigator
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA3N0I1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1saW5rZWRpbiI+PHBhdGggZD0iTTE2IDhMMTYgMTMgTTE4IDExIEwyMiA4TDIyIDEzIChNMjAgMTEpIE0yIDlIMTIgTTIgMTNIMTIgTTIgMTdIMTIiLz48cGF0aCBkPSJNMTYgOGEyIDIgMCAwIDEgMiAySE0xNiA4YTIgMiAwIDAgMC0yIDJNMTggMThhMiAyIDAgMCAxLTIgMk0xOCAxOGEyIDIgMCAwIDAgMiAyTTQgOGEyIDIgMCAwIDEgMi0yaDEyYTIgMiAwIDAgMSAyIDJ2OGEyIDIgMCAwIDEtMiAySDZhMiAyIDAgMCAxLTItMlY4eiI+PC9wYXRoPjwvc3ZnPg==',
      title: 'LinkedIn Sales Navigator Scraper',
      message: 'Please navigate to LinkedIn Sales Navigator to use this extension.'
    });
  }
});
