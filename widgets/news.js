import { CONFIG, saveToCache, loadFromCache } from '../config.js';

const WIDGET_ID = 'news';

function getElements() {
  return {
    containers: [
      document.getElementById('news-content'),
      document.getElementById('news-content-tab'),
    ].filter(Boolean),
    statuses: [
      document.getElementById('news-status'),
      document.getElementById('news-status-tab'),
    ].filter(Boolean),
  };
}

function buildNewsHtml(articles, limit) {
  return `
    <ul class="news-list">
      ${articles.slice(0, limit).map((article) => `
        <li class="news-item glass-inner">
          <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="news-link">
            <span class="news-title">${escapeHtml(article.title)}</span>
            <span class="news-meta">${escapeHtml(article.source)} · ${formatDate(article.pubDate)}</span>
          </a>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderNews(articles, fromCache = false) {
  const { containers, statuses } = getElements();
  if (!containers.length) return;

  const limits = [6, 12];
  containers.forEach((container, i) => {
    container.innerHTML = buildNewsHtml(articles, limits[i] || 6);
    container.classList.add('data-updated');
    setTimeout(() => container.classList.remove('data-updated'), 600);
  });

  const statusText = fromCache ? 'Кэш' : 'Обновлено';
  const statusClass = 'widget-status' + (fromCache ? ' widget-status--cache' : '');
  statuses.forEach((status) => {
    status.textContent = statusText;
    status.className = statusClass;
  });
}

function renderError(message, cachedData = null) {
  const { containers, statuses } = getElements();
  if (!containers.length) return;

  if (cachedData?.length) {
    renderNews(cachedData, true);
    statuses.forEach((status) => {
      status.textContent = 'Офлайн (кэш)';
      status.className = 'widget-status widget-status--error';
    });
    return;
  }

  const errorHtml = `<div class="widget-error"><span class="error-icon">⚠</span><p>${message}</p></div>`;
  containers.forEach((container) => { container.innerHTML = errorHtml; });
  statuses.forEach((status) => {
    status.textContent = 'Ошибка';
    status.className = 'widget-status widget-status--error';
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

async function fetchNews() {
  if (!CONFIG.newsApiKey) {
    throw new Error('Добавьте API-ключ newsdata.io в secrets.js');
  }

  const params = new URLSearchParams({
    apikey: CONFIG.newsApiKey,
    language: 'ru',
    country: 'kg',
  });

  const url = `https://newsdata.io/api/1/news?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (data.status !== 'success') throw new Error(data.message || 'API error');

  const articles = data.results
    .filter((item) => item.title)
    .map((item) => ({
      title: item.title,
      link: item.link,
      source: item.source_name || item.source_id || 'Новости',
      pubDate: item.pubDate,
    }));

  if (!articles.length) throw new Error('Нет новостей из Кыргызстана');
  return articles;
}

export async function updateNewsWidget() {
  const { containers } = getElements();
  containers.forEach((c) => c.classList.add('loading'));

  try {
    const articles = await fetchNews();
    saveToCache(WIDGET_ID, articles);
    renderNews(articles);
    return articles;
  } catch (err) {
    console.error('Ошибка новостей:', err);
    const cached = loadFromCache(WIDGET_ID);
    renderError('Не удалось загрузить новости', cached);
    return cached;
  } finally {
    containers.forEach((c) => c.classList.remove('loading'));
  }
}
