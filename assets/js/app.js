// Constants
const COUNTDOWN_STORAGE_KEY = 'countdownDate';
const AUTOPLAY_NOTICE_COOKIE = 'autoplayNoticeAcknowledged';
const COOKIE_EXPIRY_DAYS = 30;

// Initialize Feather Icons
feather.replace();

// Initialize particle effect
particlesJS.load('particles', {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: ["#00f3ff", "#9d00ff", "#ff00f7"] },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        move: { enable: true, speed: 2, direction: "none", random: true, out_mode: "out" }
    }
});

// Text Scramble Effect Class
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }

    setText(newText) {
        const oldText = this.el.textContent;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => (this.resolve = resolve));
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;
        for (const item of this.queue) {
            const { from, to, start, end, char } = item;
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

// Initialize text scramble effect
const phrases = ['Under Maintenance 🚧', 'System Upgrade 🛠️', 'Coming Soon 🚀', 'Improving Experience 🌟'];
const el = document.querySelector('.message h1');
const fx = new TextScramble(el);

let counter = 0;
const nextPhrase = () => {
    fx.setText(phrases[counter])
        .then(() => setTimeout(nextPhrase, 2000))
        .catch((error) => console.error('Error setting text:', error));
    counter = (counter + 1) % phrases.length;
};
nextPhrase();

// Countdown Timer
let countdownDate = localStorage.getItem(COUNTDOWN_STORAGE_KEY);
try {
    countdownDate = countdownDate ? parseInt(countdownDate, 10) : null;
    if (!countdownDate || isNaN(countdownDate)) {
        countdownDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem(COUNTDOWN_STORAGE_KEY, countdownDate);
    }
} catch (error) {
    console.error('Error accessing localStorage:', error);
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

// Update Current Year
document.getElementById('year').textContent = new Date().getFullYear();

// Update Current Time
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('time').textContent = `${hours}:${minutes}:${seconds}`;
}
updateTime();
setInterval(updateTime, 1000);

// Cookie Management
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return value;
    }
    return null;
}

// Autoplay Notice
document.addEventListener('DOMContentLoaded', () => {
    const autoplayNotice = document.getElementById('autoplay-notice');
    if (!getCookie(AUTOPLAY_NOTICE_COOKIE)) {
        autoplayNotice.classList.add('show');
        setTimeout(() => autoplayNotice.classList.remove('show'), 5000);
    }

    document.getElementById('autoplay-notice-close')?.addEventListener('click', () => {
        autoplayNotice.classList.remove('show');
        setCookie(AUTOPLAY_NOTICE_COOKIE, 'true', COOKIE_EXPIRY_DAYS);
    });
});