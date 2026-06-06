import { CONFIG, saveToCache, loadFromCache } from '../config.js';

const WIDGET_ID = 'currency';

const CURRENCY_NAMES = {
  USD: 'Доллар',
  EUR: 'Евро',
  RUB: 'Рубль',
  KGS: 'Сом',
};

function getRate(code, rates, base) {
  if (code === base) return 1;
  return rates[code];
}

function getElements() {
  return {
    container: document.getElementById('currency-content'),
    status: document.getElementById('currency-status'),
  };
}

function formatRate(code, value) {
  if (value == null) return '—';
  if (code === 'USD') return '1.00';
  const decimals = code === 'RUB' || code === 'KGS' ? 2 : 4;
  return value.toFixed(decimals);
}

function renderCurrency(data, fromCache = false) {
  const { container, status } = getElements();
  if (!container) return;

  const rates = data.rates;
  const targets = CONFIG.currencyTargets;

  container.innerHTML = `
    <div class="currency-base">1 ${data.base} =</div>
    <div class="currency-list">
      ${targets.map((code) => `
        <div class="currency-item glass-inner">
          <div class="currency-info">
            <span class="currency-code">${code}</span>
            <span class="currency-name">${CURRENCY_NAMES[code] || code}</span>
          </div>
          <span class="currency-rate">${formatRate(code, getRate(code, rates, data.base))}</span>
        </div>
      `).join('')}
    </div>
    <div class="currency-updated">Дата: ${data.date || '—'}</div>
  `;

  if (status) {
    status.textContent = fromCache ? 'Кэш' : 'Обновлено';
    status.className = 'widget-status' + (fromCache ? ' widget-status--cache' : '');
  }

  container.classList.add('data-updated');
  setTimeout(() => container.classList.remove('data-updated'), 600);
}

function renderError(message, cachedData = null) {
  const { container, status } = getElements();
  if (!container) return;

  if (cachedData) {
    renderCurrency(cachedData, true);
    if (status) {
      status.textContent = 'Офлайн (кэш)';
      status.className = 'widget-status widget-status--error';
    }
    return;
  }

  container.innerHTML = `<div class="widget-error"><span class="error-icon">⚠</span><p>${message}</p></div>`;
  if (status) {
    status.textContent = 'Ошибка';
    status.className = 'widget-status widget-status--error';
  }
}

async function fetchCurrency() {
  const base = CONFIG.currencyBase;
  const url = `https://api.exchangerate-api.com/v4/latest/${base}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateCurrencyWidget() {
  const { container } = getElements();
  if (container) container.classList.add('loading');

  try {
    const data = await fetchCurrency();
    saveToCache(WIDGET_ID, data);
    renderCurrency(data);
    return data;
  } catch (err) {
    console.error('Ошибка курсов валют:', err);
    const cached = loadFromCache(WIDGET_ID);
    renderError('Не удалось загрузить курсы валют', cached);
    return cached;
  } finally {
    if (container) container.classList.remove('loading');
  }
}

export function getCurrencyChartData() {
  const cached = loadFromCache(WIDGET_ID);
  if (!cached?.rates) return null;

  const targets = CONFIG.currencyTargets;
  return {
    labels: targets.map((code) => CURRENCY_NAMES[code] || code),
    values: targets.map((code) => getRate(code, cached.rates, cached.base) ?? 0),
  };
}
