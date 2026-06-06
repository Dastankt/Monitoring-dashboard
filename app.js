import { CONFIG } from './config.js';
import { initClock } from './widgets/clock.js';
import { updateWeatherWidget, getWeatherChartData } from './widgets/weather.js';
import { updateCurrencyWidget, getCurrencyChartData } from './widgets/currency.js';
import { updateNewsWidget } from './widgets/news.js';
import {
  initCharts,
  updateTemperatureChart,
  updateCurrencyChart,
  refreshChartTheme,
} from './chart-setup.js';

async function loadSecrets() {
  try {
    const { SECRETS } = await import('./secrets.js');
    if (SECRETS.newsApiKey) CONFIG.newsApiKey = SECRETS.newsApiKey;
  } catch (err) {
    console.warn('secrets.js не найден, новости могут не загрузиться');
  }
}

let isUpdating = false;
let refreshTimer = null;

async function updateAllWidgets() {
  if (isUpdating) return;
  isUpdating = true;

  const indicator = document.getElementById('refresh-indicator');
  if (indicator) indicator.classList.add('active');

  try {
    await Promise.all([
      updateWeatherWidget(),
      updateCurrencyWidget(),
      updateNewsWidget(),
    ]);

    updateTemperatureChart(getWeatherChartData());
    updateCurrencyChart(getCurrencyChartData());
  } finally {
    isUpdating = false;
    if (indicator) indicator.classList.remove('active');
  }
}

function initTheme() {
  const saved = localStorage.getItem('dashboard_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('dashboard_theme', next);
  updateThemeIcon(next);
  refreshChartTheme();
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === target));
      panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === target));
    });
  });
}

async function init() {
  await loadSecrets();
  initTheme();
  initClock();
  initCharts();
  initTabs();

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  updateAllWidgets();

  refreshTimer = setInterval(updateAllWidgets, CONFIG.refreshInterval);
}

window.addEventListener('load', init);
