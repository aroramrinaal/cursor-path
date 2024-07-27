chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('totalDistance', (result) => {
    if (result.totalDistance === undefined) {
      chrome.storage.local.set({ totalDistance: 0 });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'updateDistance') {
    chrome.storage.local.get('totalDistance', (result) => {
      const newTotalDistance = (result.totalDistance || 0) + request.distance;
      chrome.storage.local.set({ totalDistance: newTotalDistance }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  } else if (request.type === 'getTotalDistance') {
    chrome.storage.local.get('totalDistance', (result) => {
      sendResponse({ totalDistance: result.totalDistance || 0 });
    });
    return true;
  }
});
