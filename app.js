const TZ = 'Australia/Sydney';
const STORAGE_KEY = 'floating-countdown-target-web-v1';
const DEFAULT_TARGET = '13/03/26 11:05am';

const els = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  settings: document.getElementById('settings'),
  settingsBtn: document.getElementById('settings-btn'),
  closeBtn: document.getElementById('close-btn'),
  saveBtn: document.getElementById('save-btn'),
  targetInput: document.getElementById('target'),
  hearts: document.getElementById('hearts'),
};

function getTimeZoneOffset(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUTC - date.getTime();
}

function parseAEST(input) {
  const match = input
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = 2000 + Number(match[3]);
  let hour = Number(match[4]);
  const minute = Number(match[5]);
  const meridian = match[6].toLowerCase();

  if (hour === 12) hour = 0;
  if (meridian === 'pm') hour += 12;

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = getTimeZoneOffset(new Date(utcGuess), TZ);
  const utc = utcGuess - offset;
  return new Date(utc);
}

function formatParts(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

function setDigits(container, value) {
  const digits = container.querySelectorAll('.digit');
  const text = String(value).padStart(2, '0').slice(-2);
  digits[0].textContent = text[0];
  digits[1].textContent = text[1];
}

function setDisplay({ days, hours, minutes }) {
  setDigits(els.days, days);
  setDigits(els.hours, hours);
  setDigits(els.minutes, minutes);
}

function loadTarget() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    els.targetInput.value = stored;
    return parseAEST(stored);
  }
  els.targetInput.value = DEFAULT_TARGET;
  return parseAEST(DEFAULT_TARGET);
}

let targetDate = loadTarget();
let celebrationActive = false;
let heartsInterval = null;
let vibrationTimeout = null;

function spawnHeart() {
  const heart = document.createElement('div');
  heart.className = 'heart';
  const maxLeft = Math.max(40, els.hearts.clientWidth - 24);
  const left = 12 + Math.random() * (maxLeft - 12);
  const bottom = 16 + Math.random() * 20;
  const delay = Math.random() * 200;
  heart.style.left = `${left}px`;
  heart.style.bottom = `${bottom}px`;
  heart.style.animationDelay = `${delay}ms`;
  els.hearts.appendChild(heart);
  setTimeout(() => heart.remove(), 1500);
}

function startCelebration() {
  if (celebrationActive) return;
  celebrationActive = true;
  document.body.classList.add('celebrate');
  document.body.classList.add('vibrate');
  heartsInterval = setInterval(() => {
    for (let i = 0; i < 6; i += 1) spawnHeart();
  }, 700);
  vibrationTimeout = setTimeout(() => {
    document.body.classList.remove('vibrate');
    vibrationTimeout = null;
  }, 60000);
}

function stopCelebration() {
  celebrationActive = false;
  document.body.classList.remove('celebrate');
  document.body.classList.remove('vibrate');
  if (heartsInterval) clearInterval(heartsInterval);
  heartsInterval = null;
  if (vibrationTimeout) clearTimeout(vibrationTimeout);
  vibrationTimeout = null;
}

function tick() {
  if (!targetDate) {
    setDisplay({ days: '--', hours: '--', minutes: '--' });
    return;
  }
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) {
    setDisplay({ days: 0, hours: 0, minutes: 0 });
    startCelebration();
    return;
  }
  stopCelebration();
  const parts = formatParts(diff);
  setDisplay(parts);
}

els.settingsBtn.addEventListener('click', () => {
  els.settings.classList.toggle('hidden');
});

els.closeBtn.addEventListener('click', () => {
  els.settings.classList.add('hidden');
});

els.saveBtn.addEventListener('click', () => {
  const input = els.targetInput.value;
  const parsed = parseAEST(input);
  if (!parsed) {
    els.targetInput.focus();
    els.targetInput.style.borderColor = '#ff6f3c';
    return;
  }
  els.targetInput.style.borderColor = 'rgba(30, 30, 30, 0.1)';
  localStorage.setItem(STORAGE_KEY, input);
  targetDate = parsed;
  stopCelebration();
  els.settings.classList.add('hidden');
  tick();
});

setInterval(tick, 1000);
window.addEventListener('load', tick);
