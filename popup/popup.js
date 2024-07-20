document.addEventListener('DOMContentLoaded', () => {
  const totalDistanceElement = document.getElementById('totalDistance');
  const realWorldDistanceElement = document.getElementById('realWorldDistance');

  function updateDistance() {
    chrome.runtime.sendMessage({ type: 'getTotalDistance' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      const pixelDistance = Math.round(response.totalDistance);
      totalDistanceElement.textContent = pixelDistance;
      
      const cmDistance = (pixelDistance / 96 * 2.54).toFixed(2);
      realWorldDistanceElement.textContent = cmDistance;
    });
  }

  updateDistance();
  setInterval(updateDistance, 1000);
});
