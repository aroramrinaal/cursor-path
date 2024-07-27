document.addEventListener('DOMContentLoaded', () => {
  const todayDateElement = document.getElementById('todayDate');
  const todayDistanceElement = document.getElementById('todayDistance');
  const lifetimeDistanceElement = document.getElementById('lifetimeDistance');
  const fiveDayAverageElement = document.getElementById('fiveDayAverage');
  const realWorldDistanceElement = document.getElementById('realWorldDistance');
  const ctx = document.getElementById('distanceChart').getContext('2d');
  let chart;

  function updateStats() {
    chrome.runtime.sendMessage({ type: 'getDistanceStats' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }

      const { dailyDistances, lifetimeDistance, fiveDayAverage } = response;
      const dates = Object.keys(dailyDistances).sort();
      const distances = dates.map(date => dailyDistances[date]);

      // Get today's date and distance
      const today = new Date().toISOString().split('T')[0];
      const todayDistance = dailyDistances[today] || 0;

      // Update today's date and distance
      todayDateElement.textContent = formatDate(today);
      todayDistanceElement.textContent = Math.round(todayDistance);

      lifetimeDistanceElement.textContent = Math.round(lifetimeDistance);
      fiveDayAverageElement.textContent = Math.round(fiveDayAverage);
      
      const cmDistance = (lifetimeDistance / 96 * 2.54).toFixed(2);
      realWorldDistanceElement.textContent = cmDistance;

      if (chart) {
        chart.destroy();
      }

      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dates.map(formatDate),
          datasets: [{
            label: 'Daily Distance (pixels)',
            data: distances,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    });
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  updateStats();
  setInterval(updateStats, 5000);
});
