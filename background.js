// Background service worker for Vaultify

chrome.runtime.onInstalled.addListener(() => {
  console.log('Vaultify installed successfully');
});

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.action.openPopup();
});
