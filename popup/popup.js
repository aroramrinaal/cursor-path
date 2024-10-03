document.addEventListener('DOMContentLoaded', () => {
  const todayDateElement = document.getElementById('todayDate');
  const todayDistanceElement = document.getElementById('todayDistance');
  const lifetimeDistanceElement = document.getElementById('lifetimeDistance');
  const fiveDayAverageElement = document.getElementById('fiveDayAverage');
  const realWorldDistanceElement = document.getElementById('realWorldDistance');
  const ctx = document.getElementById('distanceChart').getContext('2d');
  let chart;

  const ctxTimeline = document.getElementById('activityTimelineChart').getContext('2d');
  let timelineChart;

  function updateStats() {
    chrome.runtime.sendMessage({ type: 'getDistanceStats' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }

      const { dailyDistances, lifetimeDistance, fiveDayAverage, activityTimeline } = response;
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
        type: 'line',
        data: {
          labels: dates.map(formatDate),
          datasets: [{
            label: 'Daily Distance (pixels)',
            data: distances,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: 'rgba(75, 192, 192, 1)'
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: 'hsl(180, 100%, 90%)', // Set ticks color to match theme
              },
              grid: {
                color: 'hsl(180, 100%, 90%)' // Set grid line color to match theme
              },
              title: {
                display: true,
                text: 'Distance (px)',
                color: 'hsl(180, 100%, 90%)' // Set axis title color to match theme
              }
            },
            x: {
              ticks: {
                color: 'hsl(180, 100%, 90%)', // Set ticks color to match theme
              },
              grid: {
                color: 'hsl(180, 100%, 90%)' // Set grid line color to match theme
              },
              title: {
                display: true,
                text: 'Date',
                color: 'hsl(180, 100%, 90%)' // Set axis title color to match theme
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: 'hsl(180, 100%, 90%)' // Set legend text color to match theme
              }
            },
            tooltip: {
              titleColor: 'hsl(180, 100%, 90%)',
              bodyColor: 'hsl(180, 100%, 90%)', // Set tooltip body color
              backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark background for contrast
              borderColor: 'hsl(180, 100%, 90%)', // Tooltip border color
              borderWidth: 1
            }
          }
        }
      });

      updateActivityTimeline(activityTimeline);
    });
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function updateActivityTimeline(activityTimeline) {
    const today = new Date().toISOString().split('T')[0];
    const todayActivity = activityTimeline[today] || [];

    const hourlyActivity = new Array(24).fill(0);
    todayActivity.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      hourlyActivity[hour] += entry.distance;
    });

    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    if (timelineChart) {
      timelineChart.destroy();
    }

    timelineChart = new Chart(ctxTimeline, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Hourly Cursor Activity',
          data: hourlyActivity,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Distance (px)',
              color: 'hsl(180, 100%, 90%)'
            },
            ticks: {
              color: 'hsl(180, 100%, 90%)'
            },
            grid: {
              color: 'hsl(180, 100%, 90%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Hour',
              color: 'hsl(180, 100%, 90%)'
            },
            ticks: {
              color: 'hsl(180, 100%, 90%)'
            },
            grid: {
              color: 'hsl(180, 100%, 90%)'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: 'hsl(180, 100%, 90%)'
            }
          },
          tooltip: {
            titleColor: 'hsl(180, 100%, 90%)',
            bodyColor: 'hsl(180, 100%, 90%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderColor: 'hsl(180, 100%, 90%)',
            borderWidth: 1
          }
        }
      }
    });
  }

  updateStats();
  setInterval(updateStats, 5000);
});
