let lastX, lastY;

function calculateDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

document.addEventListener('mousemove', (e) => {
  if (lastX !== undefined && lastY !== undefined) {
    const distance = calculateDistance(lastX, lastY, e.clientX, e.clientY);
    const timestamp = Date.now();
    chrome.runtime.sendMessage({ type: 'updateDistance', distance: distance, timestamp: timestamp });
  }
  lastX = e.clientX;
  lastY = e.clientY;
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastX = undefined;
    lastY = undefined;
  }
});

if (window.location.hostname === 'cursorpath.vercel.app' && window.location.pathname === '/stats') {
  const event = new CustomEvent('extension-detected');
  window.dispatchEvent(event);

  // Injecting CSS styles
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Andika&display=swap');
    
    body {
        background-color: hsl(210, 100%, 6%);
        color: hsl(180, 100%, 90%);
        font-family: 'Andika', sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        padding: 20px;
    }
    
    #extension-stats {
        background-color: hsl(210, 100%, 12%);
        color: hsl(180, 100%, 90%);
        padding: 60px;
        border-radius: 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        text-align: center;
        font-size: 36px;
        color: hsl(198, 70%, 50%);
        max-width: 800px;
        width: 100%;
    }
    
    #extension-stats h2 {
        margin: 20px 0;
        font-size: 36px;
        color: hsl(180, 100%, 90%);
    }
    
    #extension-stats p {
        margin: 15px 0;
        font-size: 28px;
    }
  `;
  document.head.appendChild(style);

  const statsDiv = document.getElementById('extension-stats');
  statsDiv.innerHTML = `
    <h2>Cursor Path Statistics</h2>
    <p>Total Distance: <span id="totalDistance"></span> pixels</p>
    <p>Approximate Real-World Distance: <span id="realWorldDistance"></span></p>
  `;

  function updateStats() {
    chrome.storage.local.get(['dailyDistances', 'lifetimeDistance', 'fiveDayAverage'], (result) => {
      const { lifetimeDistance, fiveDayAverage } = result;
      const totalDistance = lifetimeDistance || 0;
      const pixelDistance = Math.round(totalDistance);
      const cmDistance = (pixelDistance / 96 * 2.54).toFixed(2);
      const metersDistance = (pixelDistance / 3779.527559055).toFixed(2);
      const kilometersDistance = (pixelDistance / 3779527.559055).toFixed(4);
      const milesDistance = (pixelDistance / 63360).toFixed(4);

      document.getElementById('totalDistance').textContent = pixelDistance;
      document.getElementById('realWorldDistance').innerHTML = `
        ${cmDistance} cm<br>
        ${metersDistance} meters<br>
        ${kilometersDistance} kilometers<br>
        ${milesDistance} miles
      `;
    });
  }

  updateStats();
  setInterval(updateStats, 1000);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'updateStats') {
      updateStats();
    }
  });
}
