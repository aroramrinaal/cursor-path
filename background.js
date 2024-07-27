chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['dailyDistances', 'lastResetDate', 'lifetimeDistance'], (result) => {
    if (!result.dailyDistances) {
      chrome.storage.local.set({ 
        dailyDistances: {},
        lastResetDate: new Date().toDateString(),
        lifetimeDistance: 0,
        fiveDayAverage: 0
      });
    }
  });
});

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function updateDistances(distance) {
  chrome.storage.local.get(['dailyDistances', 'lastResetDate', 'lifetimeDistance'], (result) => {
    const today = getTodayKey();
    const dailyDistances = result.dailyDistances || {};
    let lifetimeDistance = result.lifetimeDistance || 0;
    
    // Reset if it's a new day
    if (result.lastResetDate !== new Date().toDateString()) {
      chrome.storage.local.set({ lastResetDate: new Date().toDateString() });
    }

    dailyDistances[today] = (dailyDistances[today] || 0) + distance;
    lifetimeDistance += distance;

    // Keep only the last 5 days
    const sortedDates = Object.keys(dailyDistances).sort().slice(-5);
    const last5DaysDistances = {};
    sortedDates.forEach(date => {
      last5DaysDistances[date] = dailyDistances[date];
    });

    // Calculate 5-day average
    const fiveDayAverage = sortedDates.length > 0
      ? sortedDates.reduce((sum, date) => sum + last5DaysDistances[date], 0) / sortedDates.length
      : 0;

    chrome.storage.local.set({ 
      dailyDistances: last5DaysDistances,
      lifetimeDistance: lifetimeDistance,
      fiveDayAverage: fiveDayAverage
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'updateDistance') {
    updateDistances(request.distance);
    sendResponse({ success: true });
    return true;
  } else if (request.type === 'getDistanceStats') {
    chrome.storage.local.get(['dailyDistances', 'lifetimeDistance', 'fiveDayAverage'], (result) => {
      sendResponse({
        dailyDistances: result.dailyDistances || {},
        lifetimeDistance: result.lifetimeDistance || 0,
        fiveDayAverage: result.fiveDayAverage || 0
      });
    });
    return true;
  }
});