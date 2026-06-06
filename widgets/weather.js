import { CONFIG, saveToCache, loadFromCache } from '../config.js';

const WIDGET_ID = 'weather';

function getElements() {
  return {
    container: document.getElementById('weather-content'),
    status: document.getElementById('weather-status'),
  };
}

function renderWeather(data, fromCache = false) {
  const { container, status } = getElements();
  if (!container) return;

  const current = data.current;
  const daily = data.daily;
  const description = data.description || getWeatherDescription(current.weather_code);

  container.innerHTML = `
    <div class="weather-main">
      <div class="weather-temp">${Math.round(current.temperature_2m)}°</div>
      <div class="weather-desc">${description}</div>
    </div>
    <div class="weather-details">
      <div class="weather-detail glass-inner">
        <span class="detail-label">Влажность</span>
        <span class="detail-value">${current.relative_humidity_2m}%</span>
      </div>
      <div class="weather-detail glass-inner">
        <span class="detail-label">Ветер</span>
        <span class="detail-value">${Math.round(current.wind_speed_10m)} км/ч</span>
      </div>
      <div class="weather-detail glass-inner">
        <span class="detail-label">Ощущается</span>
        <span class="detail-value">${Math.round(current.apparent_temperature)}°</span>
      </div>
    </div>
    <div class="weather-forecast">
      ${daily.time.slice(0, 5).map((day, i) => `
        <div class="forecast-day glass-inner">
          <span class="forecast-label">${formatDayLabel(day, i)}</span>
          <span class="forecast-temp">${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</span>
        </div>
      `).join('')}
    </div>
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
    renderWeather(cachedData, true);
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

function formatDayLabel(dateStr, index) {
  if (index === 0) return 'Сегодня';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { weekday: 'short' });
}

function getWeatherDescription(code) {
  const codes = {
    0: 'Ясно',
    1: 'Преимущественно ясно',
    2: 'Переменная облачность',
    3: 'Пасмурно',
    45: 'Туман',
    48: 'Изморозь',
    51: 'Морось',
    53: 'Морось',
    55: 'Морось',
    61: 'Дождь',
    63: 'Дождь',
    65: 'Ливень',
    71: 'Снег',
    73: 'Снег',
    75: 'Снегопад',
    80: 'Ливень',
    81: 'Ливень',
    82: 'Ливень',
    95: 'Гроза',
    96: 'Гроза с градом',
    99: 'Гроза с градом',
  };
  return codes[code] || 'Неизвестно';
}

async function fetchFromOpenMeteo() {
  const { lat, lon } = CONFIG.cityCoords;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia%2FBishkek&forecast_days=5`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchFromWttr() {
  const city = encodeURIComponent(CONFIG.city);
  const url = `https://wttr.in/${city}?format=j1&lang=ru`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const wttr = await res.json();
  const current = wttr.current_condition[0];
  const forecast = wttr.weather || [];

  return {
    current: {
      temperature_2m: parseFloat(current.temp_C),
      relative_humidity_2m: parseFloat(current.humidity),
      apparent_temperature: parseFloat(current.FeelsLikeC),
      weather_code: 0,
      wind_speed_10m: parseFloat(current.windspeedKmph),
    },
    daily: {
      time: forecast.slice(0, 5).map((d) => d.date),
      temperature_2m_max: forecast.slice(0, 5).map((d) => parseFloat(d.maxtempC)),
      temperature_2m_min: forecast.slice(0, 5).map((d) => parseFloat(d.mintempC)),
      weather_code: forecast.slice(0, 5).map(() => 0),
    },
    description: current.lang_ru?.[0]?.value || current.weatherDesc?.[0]?.value || '—',
  };
}

async function fetchWttrDescription() {
  const city = encodeURIComponent(CONFIG.city);
  const url = `https://wttr.in/${city}?format=j1&lang=ru`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const wttr = await res.json();
  const current = wttr.current_condition[0];
  return current.lang_ru?.[0]?.value || current.weatherDesc?.[0]?.value || null;
}

async function fetchWeather() {
  try {
    const data = await fetchFromOpenMeteo();
    try {
      const description = await fetchWttrDescription();
      if (description) data.description = description;
    } catch {
      // wttr.in — дополнение, не критично
    }
    return data;
  } catch (openMeteoErr) {
    console.warn('open-meteo недоступен, пробуем wttr.in:', openMeteoErr);
    return fetchFromWttr();
  }
}

export async function updateWeatherWidget() {
  const { container } = getElements();
  if (container) container.classList.add('loading');

  try {
    const data = await fetchWeather();
    saveToCache(WIDGET_ID, data);
    renderWeather(data);
    return data;
  } catch (err) {
    console.error('Ошибка погоды:', err);
    const cached = loadFromCache(WIDGET_ID);
    renderError('Не удалось загрузить погоду', cached);
    return cached;
  } finally {
    if (container) container.classList.remove('loading');
  }
}

export function getWeatherChartData() {
  const cached = loadFromCache(WIDGET_ID);
  if (!cached?.daily) return null;

  return {
    labels: cached.daily.time.slice(0, 5).map((d, i) => formatDayLabel(d, i)),
    max: cached.daily.temperature_2m_max.slice(0, 5),
    min: cached.daily.temperature_2m_min.slice(0, 5),
  };
}
