let clockInterval = null;

function formatDateTime(date) {
  const time = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return { time, date: dateStr };
}

function updateClockDisplay() {
  const timeEl = document.getElementById('clock-time');
  const dateEl = document.getElementById('clock-date');
  if (!timeEl || !dateEl) return;

  const { time, date } = formatDateTime(new Date());
  timeEl.textContent = time;
  dateEl.textContent = date;
}

export function initClock() {
  updateClockDisplay();
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(updateClockDisplay, 1000);
}
