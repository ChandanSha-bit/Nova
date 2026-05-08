// Background service worker for Nova

chrome.runtime.onInstalled.addListener(() => {
  console.log('Nova installed successfully');
});

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.action.openPopup();
});
