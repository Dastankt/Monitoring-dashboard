let temperatureChart = null;
let currencyChart = null;

function getChartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    text: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.15)',
    max: '#f97316',
    min: '#3b82f6',
    currency: ['#22d3ee', '#6366f1', '#8b5cf6', '#14b8a6'],
  };
}

function baseOptions() {
  const colors = getChartColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: colors.text, font: { size: 13 } },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.text },
        grid: { color: colors.grid },
      },
      y: {
        ticks: { color: colors.text },
        grid: { color: colors.grid },
      },
    },
  };
}

export function initCharts() {
  const tempCtx = document.getElementById('temperatureChart');
  const currCtx = document.getElementById('currencyChart');
  const colors = getChartColors();

  if (tempCtx) {
    temperatureChart = new Chart(tempCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Макс °C',
            data: [],
            borderColor: colors.max,
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.3,
          },
          {
            label: 'Мин °C',
            data: [],
            borderColor: colors.min,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: baseOptions(),
    });
  }

  if (currCtx) {
    currencyChart = new Chart(currCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Курс к USD',
            data: [],
            backgroundColor: colors.currency,
            borderRadius: 8,
          },
        ],
      },
      options: {
        ...baseOptions(),
        plugins: {
          ...baseOptions().plugins,
          legend: { display: false },
        },
      },
    });
  }
}

export function updateTemperatureChart(chartData) {
  if (!temperatureChart || !chartData) return;
  temperatureChart.data.labels = chartData.labels;
  temperatureChart.data.datasets[0].data = chartData.max;
  temperatureChart.data.datasets[1].data = chartData.min;
  temperatureChart.update('active');
}

export function updateCurrencyChart(chartData) {
  if (!currencyChart || !chartData) return;
  currencyChart.data.labels = chartData.labels;
  currencyChart.data.datasets[0].data = chartData.values;
  currencyChart.update('active');
}

export function refreshChartTheme() {
  const colors = getChartColors();
  const options = baseOptions();

  [temperatureChart, currencyChart].forEach((chart) => {
    if (!chart) return;
    chart.options.plugins.legend.labels.color = colors.text;
    if (chart.options.scales?.x) {
      chart.options.scales.x.ticks.color = colors.text;
      chart.options.scales.x.grid.color = colors.grid;
    }
    if (chart.options.scales?.y) {
      chart.options.scales.y.ticks.color = colors.text;
      chart.options.scales.y.grid.color = colors.grid;
    }
    chart.update('none');
  });
}
