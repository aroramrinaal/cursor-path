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