(function () {
  const data = window.DEMO_DATA || {
    overview: [],
    performance: [],
    events: []
  };

  const overviewGrid = document.getElementById('overview-grid');
  const kickChart = document.getElementById('kick-chart');
  const eventGrid = document.getElementById('event-grid');

  function renderOverviewCards() {
    overviewGrid.innerHTML = data.overview
      .map(
        (card) => `
          <article class="metric-card panel">
            <p>${card.label}</p>
            <strong>${card.value}</strong>
            <span>${card.note}</span>
          </article>
        `
      )
      .join('');
  }

  function renderChart() {
    const max = Math.max(...data.performance.map((item) => item.value), 100);

    kickChart.innerHTML = data.performance
      .map(
        (item) => `
          <div class="bar-group">
            <div class="bar-meta">
              <span>${item.label}</span>
              <strong>${item.value}</strong>
            </div>
            <div class="bar-track">
              <span class="bar-fill" style="width: ${(item.value / max) * 100}%; background: ${item.color};"></span>
            </div>
          </div>
        `
      )
      .join('');
  }

  function renderEvents() {
    eventGrid.innerHTML = data.events
      .map(
        (item) => `
          <div class="event-item">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
          </div>
        `
      )
      .join('');
  }

  renderOverviewCards();
  renderChart();
  renderEvents();
})();
