document.addEventListener('DOMContentLoaded', () => {
    const totalDistanceElement = document.getElementById('totalDistance');
    const realWorldDistanceElement = document.getElementById('realWorldDistance');
    const resetButton = document.getElementById('resetButton');
  
    function updateDistance() {
      chrome.runtime.sendMessage({ type: 'getTotalDistance' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }
        const pixelDistance = Math.round(response.totalDistance);
        totalDistanceElement.textContent = pixelDistance;
        
        // Assuming 96 DPI (dots per inch) for the conversion
        const cmDistance = (pixelDistance / 96 * 2.54).toFixed(2);
        realWorldDistanceElement.textContent = cmDistance;
      });
    }
  
    resetButton.addEventListener('click', () => {
      chrome.storage.local.set({ totalDistance: 0 }, () => {
        updateDistance();
      });
    });
  
    updateDistance();
    setInterval(updateDistance, 1000); // Update every second
  });