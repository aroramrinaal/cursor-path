chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['dailyDistances', 'lastResetDate', 'lifetimeDistance', 'activityTimeline'], (result) => {
    if (!result.dailyDistances) {
      chrome.storage.local.set({ 
        dailyDistances: {},
        lastResetDate: new Date().toDateString(),
        lifetimeDistance: 0,
        fiveDayAverage: 0,
        activityTimeline: {}
      });
    }
  });
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update') {
    chrome.storage.local.clear(() => {
      console.log('Local storage cleared due to extension update');
      // Initialize with default values
      chrome.storage.local.set({
        dailyDistances: {},
        lastResetDate: new Date().toDateString(),
        lifetimeDistance: 0,
        fiveDayAverage: 0,
        activityTimeline: {}
      });
    });
  }
});

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function updateDistances(distance, timestamp) {
  chrome.storage.local.get(['dailyDistances', 'lastResetDate', 'lifetimeDistance', 'activityTimeline'], (result) => {
    const today = getTodayKey();
    const dailyDistances = result.dailyDistances || {};
    const activityTimeline = result.activityTimeline || {};
    let lifetimeDistance = result.lifetimeDistance || 0;
    
    // Reset if it's a new day
    if (result.lastResetDate !== new Date().toDateString()) {
      chrome.storage.local.set({ lastResetDate: new Date().toDateString() });
    }

    dailyDistances[today] = (dailyDistances[today] || 0) + distance;
    lifetimeDistance += distance;

    // Update activity timeline
    if (!activityTimeline[today]) {
      activityTimeline[today] = [];
    }
    activityTimeline[today].push({ distance: distance, timestamp: timestamp });

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
      fiveDayAverage: fiveDayAverage,
      activityTimeline: activityTimeline
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'updateDistance') {
    updateDistances(request.distance, request.timestamp);
    sendResponse({ success: true });
    return true;
  } else if (request.type === 'getDistanceStats') {
    chrome.storage.local.get(['dailyDistances', 'lifetimeDistance', 'fiveDayAverage', 'activityTimeline'], (result) => {
      sendResponse({
        dailyDistances: result.dailyDistances || {},
        lifetimeDistance: result.lifetimeDistance || 0,
        fiveDayAverage: result.fiveDayAverage || 0,
        activityTimeline: result.activityTimeline || {}
      });
    });
    return true;
  } else if (request.type === 'checkDateChange') {
    const dateChanged = checkDateChange();
    sendResponse({ dateChanged: dateChanged });
    return true;
  } else if (request.type === 'manualReset') {
    const today = new Date().toDateString();
    chrome.storage.local.get(['dailyDistances', 'activityTimeline'], (result) => {
      const dailyDistances = result.dailyDistances || {};
      const activityTimeline = result.activityTimeline || {};
      const todayKey = getTodayKey();

      dailyDistances[todayKey] = 0;
      activityTimeline[todayKey] = [];

      chrome.storage.local.set({
        lastResetDate: today,
        dailyDistances: dailyDistances,
        activityTimeline: activityTimeline
      }, () => {
        sendResponse({ success: true });
        chrome.runtime.sendMessage({ type: 'updateStats' });
      });
    });
    return true;
  }
});

function checkDateChange() {
  const today = new Date().toDateString();
  chrome.storage.local.get(['lastResetDate', 'dailyDistances', 'activityTimeline'], (result) => {
    if (result.lastResetDate !== today) {
      const newDailyDistances = { [getTodayKey()]: 0 };
      const newActivityTimeline = { [getTodayKey()]: [] };
      
      chrome.storage.local.set({
        lastResetDate: today,
        dailyDistances: newDailyDistances,
        activityTimeline: newActivityTimeline
      }, () => {
        chrome.runtime.sendMessage({ type: 'updateStats' });
      });
      return true; // Date changed
    }
    return false; // Date didn't change
  });
}

function scheduleNextCheck() {
  const now = new Date();
  const nextCheck = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timeUntilNextCheck = nextCheck - now;

  setTimeout(() => {
    checkDateChange();
    scheduleNextCheck();
  }, timeUntilNextCheck);
}

// Initial check and scheduling
checkDateChange();
scheduleNextCheck();

// Also check every minute to ensure robustness
setInterval(checkDateChange, 60000);