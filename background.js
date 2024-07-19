let totalDistance = 0;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ totalDistance: 0 });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'updateDistance') {
    totalDistance += request.distance;
    chrome.storage.local.set({ totalDistance: totalDistance });
  } else if (request.type === 'getTotalDistance') {
    sendResponse({ totalDistance: totalDistance });
  }
  return true;
});