// Initialize Feather Icons
feather.replace();

// Initialize particle effect
particlesJS.load('particles', {
    particles: {
        number: {
            value: 80,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: ["#00f3ff", "#9d00ff", "#ff00f7"]
        },
        shape: {
            type: "circle"
        },
        opacity: {
            value: 0.5,
            random: true
        },
        size: {
            value: 3,
            random: true
        },
        move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: true,
            out_mode: "out"
        }
    }
});

// Text Scramble Effect Class
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }

    // Set new text with scramble effect
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
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

    // Update scramble effect
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="glitch">${char}</span>`;
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

    // Get random character for scramble effect
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// Initialize text scramble effect
const phrases = [
    'Under Maintenance 🚧',
    'System Upgrade 🛠️',
    'Coming Soon 🚀',
    'Improving Experience 🌟',
];

const el = document.querySelector('.message h1');
const fx = new TextScramble(el);

let counter = 0;
const next = () => {
    fx.setText(phrases[counter]).then(() => {
        setTimeout(next, 2000);
    }).catch((error) => {
        console.error('Error setting text:', error);
    });
    counter = (counter + 1) % phrases.length;
};

next();

// Set countdown date (30 days from now)
let countdownDate = localStorage.getItem('countdownDate');
if (!countdownDate) {
    countdownDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime();
    localStorage.setItem('countdownDate', countdownDate);
} else {
    countdownDate = parseInt(countdownDate, 10);
}

// Update countdown timer
function updateCountdown() {
    const now = new Date().getTime();
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

// Initialize countdown
updateCountdown();
setInterval(updateCountdown, 1000);

// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// Update current time
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('time').textContent = `${hours}:${minutes}:${seconds}`;
}

// Initialize time update
updateTime();
setInterval(updateTime, 1000);

// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Function to get a cookie
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Show autoplay notice if not already acknowledged
document.addEventListener('DOMContentLoaded', function() {
    const autoplayNotice = document.getElementById('autoplay-notice');
    const autoplayNoticeClose = document.getElementById('autoplay-notice-close');

    if (!getCookie('autoplayNoticeAcknowledged')) {
        autoplayNotice.classList.add('show');
        setTimeout(() => {
            autoplayNotice.classList.remove('show');
        }, 5000); // Hide after 5 seconds
    }

    autoplayNoticeClose.addEventListener('click', function() {
        autoplayNotice.classList.remove('show');
        setCookie('autoplayNoticeAcknowledged', 'true', 30); // Cookie expires in 30 days
    });
});