// === Constants ===
const COUNTDOWN_STORAGE_KEY = 'countdownDate';
const AUTOPLAY_NOTICE_COOKIE = 'autoplayNoticeAcknowledged';
const COOKIE_EXPIRY_DAYS = 30;

// === Feather Icons ===
feather.replace();

// === Particles.js ===
particlesJS.load('particles', {
  particles: {
    number: { value: 80, density: { enable: true, value_area: 800 } },
    color: { value: ['#00f3ff', '#9d00ff', '#ff00f7'] },
    shape: { type: 'circle' },
    opacity: { value: 0.5, random: true },
    size: { value: 3, random: true },
    move: { enable: true, speed: 2, random: true, out_mode: 'out' },
  },
});

// === Text Scramble Effect ===
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }

  setText(newText) {
    const oldText = this.el.textContent;
    const length = Math.max(oldText.length, newText.length);
    this.queue = Array.from({ length }, (_, i) => {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      return { from, to, start, end };
    });

    this.frame = 0;
    cancelAnimationFrame(this.frameRequest);
    return new Promise(resolve => {
      this.resolve = resolve;
      this.update();
    });
  }

  update() {
    let output = '';
    let complete = 0;

    for (const item of this.queue) {
      const { from, to, start, end } = item;

      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!item.char || Math.random() < 0.28) {
          item.char = this.randomChar();
        }
        output += `<span class="glitch">${item.char}</span>`;
      } else {
        output += from;
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// === Inisialisasi Text Scramble ===
const phrases = [
  'Under Maintenance 🚧',
  'System Upgrade 🛠️',
  'Coming Soon 🚀',
  'Improving Experience 🌟',
];
const el = document.querySelector('.message h1');
const fx = new TextScramble(el);
let counter = 0;

function nextPhrase() {
  fx.setText(phrases[counter])
    .then(() => setTimeout(nextPhrase, 2000))
    .catch(console.error);
  counter = (counter + 1) % phrases.length;
}
nextPhrase();

// === Countdown Timer ===
let countdownDate;

try {
  const stored = localStorage.getItem(COUNTDOWN_STORAGE_KEY);
  countdownDate = stored ? parseInt(stored, 10) : null;
  if (!countdownDate || isNaN(countdownDate)) {
    countdownDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(COUNTDOWN_STORAGE_KEY, countdownDate);
  }
} catch (err) {
  console.warn('LocalStorage unavailable:', err);
  countdownDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
}

function updateCountdown() {
  const now = Date.now();
  const distance = countdownDate - now;

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById('days').textContent = String(days).padStart(2, '0');
  document.getElementById('hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// === Current Year & Time ===
document.getElementById('year').textContent = new Date().getFullYear();

function updateTime() {
  const now = new Date();
  const [hours, minutes, seconds] = [
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ].map(unit => String(unit).padStart(2, '0'));

  document.getElementById('time').textContent = `${hours}:${minutes}:${seconds}`;
}
updateTime();
setInterval(updateTime, 1000);

// === Cookie Utils ===
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/`;
}

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1] ?? null;
}

// === Autoplay Notice Handler ===
document.addEventListener('DOMContentLoaded', () => {
  const notice = document.getElementById('autoplay-notice');
  const closeBtn = document.getElementById('autoplay-notice-close');

  if (!getCookie(AUTOPLAY_NOTICE_COOKIE)) {
    notice?.classList.add('show');
    setTimeout(() => notice?.classList.remove('show'), 5000);
  }

  closeBtn?.addEventListener('click', () => {
    notice?.classList.remove('show');
    setCookie(AUTOPLAY_NOTICE_COOKIE, 'true', COOKIE_EXPIRY_DAYS);
  });
});