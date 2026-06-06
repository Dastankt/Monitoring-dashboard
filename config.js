export const CONFIG = {
  city: 'Bishkek',
  cityCoords: { lat: 42.8746, lon: 74.5698 },
  currencyBase: 'USD',
  currencyTargets: ['USD', 'EUR', 'RUB', 'KGS'],
  refreshInterval: 60000,
  cachePrefix: 'dashboard_',
};

export function saveToCache(key, data) {
  try {
    localStorage.setItem(
      CONFIG.cachePrefix + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (err) {
    console.error('Ошибка сохранения в кэш:', err);
  }
}

export function loadFromCache(key) {
  try {
    const raw = localStorage.getItem(CONFIG.cachePrefix + key);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data;
  } catch (err) {
    console.error('Ошибка чтения из кэша:', err);
    return null;
  }
}
