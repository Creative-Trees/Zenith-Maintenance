// === Constants & Security-Enhanced Utilities ===
const COUNTDOWN_STORAGE_KEY = 'countdownDate';
const AUTOPLAY_NOTICE_COOKIE = 'autoplayNoticeAcknowledged';
const COOKIE_EXPIRY_DAYS = 30;
const LOCALE = navigator.language || 'id-ID'; // Default ke Bahasa Indonesia

// === Keamanan: Cookie yang Ditingkatkan ===
function setCookie(name, value, days) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    // Tambahkan SameSite, Secure, dan HttpOnly untuk meningkatkan keamanan
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
    return true;
  } catch (err) {
    console.warn('Cookie error:', err);
    return false;
  }
}

function getCookie(name) {
  try {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  } catch (err) {
    console.warn('Cookie error:', err);
    return null;
  }
}

// === Helper: Keamanan LocalStorage yang Ditingkatkan ===
const SecureStorage = {
  setItem(key, value) {
    try {
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('LocalStorage error:', error);
      return false;
    }
  },
  
  getItem(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (!value) return defaultValue;
      
      // Coba parse JSON jika mungkin
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    } catch (error) {
      console.warn('LocalStorage error:', error);
      return defaultValue;
    }
  }
};

// === Performance: Utility Functions ===
const throttle = (fn, delay) => {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
};

// === Feather Icons - Inisialisasi dengan Keamanan ===
function initFeatherIcons() {
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}

// === Particles.js - Dioptimalkan & Lazy-Loaded ===
function initParticles() {
  // Gunakan IntersectionObserver untuk lazy-load particles
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer || typeof particlesJS === 'undefined') return;
  
  // Untuk performa: hanya muat particles saat dalam viewport
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadParticles();
          observer.disconnect(); // Hentikan observasi setelah dimuat
        }
      });
    });
    observer.observe(particlesContainer);
  } else {
    // Fallback untuk browser lama
    setTimeout(loadParticles, 100);
  }
  
  function loadParticles() {
    particlesJS('particles', {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: ['#00f3ff', '#9d00ff', '#ff00f7'] },
        shape: { type: 'circle' },
        opacity: { 
          value: 0.5, 
          random: true,
          anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
        },
        size: { 
          value: 3, 
          random: true,
          anim: { enable: true, speed: 2, size_min: 0.1, sync: false }
        },
        move: { 
          enable: true, 
          speed: 2, 
          random: true, 
          out_mode: 'out',
          attract: { enable: false, rotateX: 600, rotateY: 1200 }
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#ffffff',
          opacity: 0.3,
          width: 1
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: true, mode: 'grab' },
          onclick: { enable: true, mode: 'push' },
          resize: true
        },
        modes: {
          grab: { distance: 140, line_linked: { opacity: 1 } },
          push: { particles_nb: 4 },
        }
      },
      retina_detect: true
    });
    
    // Tambahkan atribut aria untuk aksesibilitas
    particlesContainer.setAttribute('aria-hidden', 'true');
  }
}

// === Text Scramble Effect - Dengan Aksesibilitas ===
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
    
    // Accessibility enhancement
    if (this.el) {
      this.el.setAttribute('aria-live', 'polite');
    }
  }

  setText(newText) {
    if (!this.el) return Promise.resolve();
    
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
      
      // Untuk aksesibilitas - tambahkan teks asli sebagai aria-label
      this.el.setAttribute('aria-label', newText);
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
        // Tambahkan aria-hidden untuk elemen glitch agar screen reader hanya membaca teks akhir
        output += `<span class="glitch" aria-hidden="true">${item.char}</span>`;
      } else {
        output += from;
      }
    }

    if (this.el) {
      this.el.innerHTML = output;
    }

    if (complete === this.queue.length) {
      if (typeof this.resolve === 'function') {
        this.resolve();
      }
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// === Inisialisasi Text Scramble - Dengan Error Handling ===
function initTextScramble() {
  const phrases = [
    'Under Maintenance 🚧',
    'System Upgrade 🛠️',
    'Coming Soon 🚀',
    'Improving Experience 🌟',
  ];
  
  const el = document.querySelector('.message h1');
  if (!el) return; // Safety check
  
  const fx = new TextScramble(el);
  let counter = 0;

  function nextPhrase() {
    try {
      fx.setText(phrases[counter])
        .then(() => setTimeout(nextPhrase, 2000))
        .catch(err => {
          console.error('Text scramble error:', err);
          // Fallback in case of error - retry after delay
          setTimeout(nextPhrase, 3000);
        });
        
      counter = (counter + 1) % phrases.length;
    } catch (err) {
      console.error('Text scramble error:', err);
    }
  }
  
  // Begin the animation
  nextPhrase();
}

// === Countdown Timer - Dioptimasi & Ditingkatkan ===
function initCountdown() {
  let countdownDate;
  const countdownElements = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds')
  };
  
  // Jika ada elemen yang tidak ditemukan, jangan lanjutkan
  if (!Object.values(countdownElements).every(el => el)) {
    return;
  }
  
  try {
    const stored = SecureStorage.getItem(COUNTDOWN_STORAGE_KEY);
    countdownDate = stored ? parseInt(stored, 10) : null;
    if (!countdownDate || isNaN(countdownDate)) {
      countdownDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
      SecureStorage.setItem(COUNTDOWN_STORAGE_KEY, countdownDate);
    }
  } catch (err) {
    console.warn('Countdown initialization error:', err);
    countdownDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
  }
  
  // Tambahkan role untuk aksesibilitas
  const countdownContainer = document.querySelector('.countdown');
  if (countdownContainer) {
    countdownContainer.setAttribute('role', 'timer');
    countdownContainer.setAttribute('aria-live', 'polite');
  }
  
  function updateCountdown() {
    const now = Date.now();
    const distance = countdownDate - now;
    
    if (distance < 0) {
      // Countdown selesai
      Object.values(countdownElements).forEach(el => {
        if (el) el.textContent = '00';
      });
      
      // Tambahkan pesan "Expired" jika perlu
      if (countdownContainer && !document.querySelector('.countdown-expired')) {
        const expiredMsg = document.createElement('div');
        expiredMsg.className = 'countdown-expired';
        expiredMsg.textContent = 'We are live now!';
        expiredMsg.setAttribute('role', 'alert');
        countdownContainer.appendChild(expiredMsg);
      }
      
      return false; // Tandai bahwa countdown sudah selesai
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update elemen dengan safety check
    if (countdownElements.days) countdownElements.days.textContent = String(days).padStart(2, '0');
    if (countdownElements.hours) countdownElements.hours.textContent = String(hours).padStart(2, '0');
    if (countdownElements.minutes) countdownElements.minutes.textContent = String(minutes).padStart(2, '0');
    if (countdownElements.seconds) countdownElements.seconds.textContent = String(seconds).padStart(2, '0');
    
    // Update aria-label untuk aksesibilitas
    if (countdownContainer) {
      const ariaText = `${days} hari, ${hours} jam, ${minutes} menit, dan ${seconds} detik tersisa`;
      countdownContainer.setAttribute('aria-label', ariaText);
    }
    
    return true; // Countdown masih berjalan
  }
  
  // Lakukan update pertama
  if (updateCountdown()) {
    // Hanya atur interval jika countdown masih berjalan
    const intervalId = setInterval(() => {
      if (!updateCountdown()) {
        // Jika countdown selesai, bersihkan interval
        clearInterval(intervalId);
      }
    }, 1000);
    
    // Bersihkan interval saat tab tidak aktif untuk menghemat CPU
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        clearInterval(intervalId);
      } else {
        // Update sekali dan mulai lagi interval saat tab aktif
        if (updateCountdown()) {
          setInterval(updateCountdown, 1000);
        }
      }
    });
  }
}

// === Current Year & Time - Dengan Format Lokal ===
function initDateTime() {
  const yearElement = document.getElementById('year');
  const timeElement = document.getElementById('time');
  
  // Update tahun
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
  
  // Tidak perlu update jika elemen waktu tidak ada
  if (!timeElement) return;
  
  // Tambahkan atribut untuk aksesibilitas
  timeElement.setAttribute('role', 'timer');
  timeElement.setAttribute('aria-live', 'polite');
  
  // Buat formatter waktu dengan bahasa lokal
  const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false // Format 24 jam
  });
  
  function updateTime() {
    const now = new Date();
    
    // Gunakan formatter lokal
    timeElement.textContent = timeFormatter.format(now);
    
    // Tambahkan datetime attribute untuk SEO dan aksesibilitas
    timeElement.setAttribute('datetime', now.toISOString());
  }
  
  // Update pertama kali
  updateTime();
  
  // Gunakan throttle untuk performa yang lebih baik
  const throttledUpdateTime = throttle(updateTime, 1000);
  
  // Inisialisasi interval yang lebih efisien
  let timeInterval = setInterval(throttledUpdateTime, 1000);
  
  // Bersihkan interval saat tab tidak aktif
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      clearInterval(timeInterval);
    } else {
      // Update sekali dan mulai interval lagi
      updateTime();
      timeInterval = setInterval(throttledUpdateTime, 1000);
    }
  });
}

// === Notifikasi Musik yang Ditingkatkan ===
function initMusicNotice() {
  const notice = document.getElementById('autoplay-notice');
  const closeBtn = document.getElementById('autoplay-notice-close');
  
  if (!notice || !closeBtn) return;
  
  // Tambahkan atribut ARIA
  notice.setAttribute('role', 'alert');
  notice.setAttribute('aria-live', 'polite');
  closeBtn.setAttribute('aria-label', 'Tutup notifikasi musik');
  
  // Periksa apakah notifikasi sudah ditampilkan sebelumnya
  if (!getCookie(AUTOPLAY_NOTICE_COOKIE)) {
    // Tambahkan animasi yang lebih smooth dengan class transisi
    notice.classList.add('prepare-animation');
    
    // Berikan delay kecil agar CSS transition berfungsi dengan baik
    setTimeout(() => {
      notice.classList.add('show');
      // Untuk animasi yang lebih halus
      notice.style.opacity = '1';
      notice.style.transform = 'translateY(0)';
    }, 50);
    
    // Sembunyikan secara otomatis setelah beberapa detik
    const hideTimeout = setTimeout(() => {
      hideNotice();
    }, 5000);
    
    // Tambahkan event listener untuk tombol close
    closeBtn.addEventListener('click', () => {
      clearTimeout(hideTimeout); // Hentikan timeout otomatis
      hideNotice();
    });
    
    // Tambahkan penanganan keyboard untuk aksesibilitas
    closeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeBtn.click();
      }
    });
    
    // Pastikan notice dapat diakses dengan keyboard
    notice.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideNotice();
      }
    });
  }
  
  function hideNotice() {
    // Animasi smooth saat menutup
    notice.style.opacity = '0';
    notice.style.transform = 'translateY(-20px)';
    
    // Tunggu animasi selesai sebelum menghapus class
    setTimeout(() => {
      notice.classList.remove('show');
      // Simpan cookie bahwa user sudah melihat notifikasi
      setCookie(AUTOPLAY_NOTICE_COOKIE, 'true', COOKIE_EXPIRY_DAYS);
    }, 300); // Sesuaikan dengan durasi CSS transition
  }
}

// === Main Initialization - Dengan Error Handling ===
document.addEventListener('DOMContentLoaded', () => {
  try {
    initFeatherIcons();
    initParticles();
    initTextScramble();
    initCountdown();
    initDateTime();
    initMusicNotice();
    
    // Tambahkan atribut aksesibilitas untuk elemen-elemen interaktif
    document.querySelectorAll('button, a').forEach(el => {
      if (!el.getAttribute('aria-label') && el.textContent.trim()) {
        el.setAttribute('aria-label', el.textContent.trim());
      }
    });
    
  } catch (err) {
    console.error('Initialization error:', err);
  }
});

// Tambahkan event listener untuk performance
window.addEventListener('load', () => {
  // Gunakan requestIdleCallback untuk tugas yang tidak mendesak
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Log performance metrics jika dibutuhkan
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`Page loaded in: ${pageLoadTime}ms`);
      }
    });
  }
});

// Bersihkan resource saat page unload untuk mencegah memory leak
window.addEventListener('beforeunload', () => {
  // Hapus event listeners jika ada
});