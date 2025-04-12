<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
  
  <!-- Resource Hints untuk performa lebih baik -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin />
  <link rel="preconnect" href="https://unpkg.com" crossorigin />
  
  <!-- Preload resource kritis -->
  <link rel="preload" href="assets/css/style.css" as="style" />
  <link rel="preload" href="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js" as="script" />
  <link rel="preload" href="assets/img/M.png" as="image" type="image/png" />
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" as="style" />

  <!-- Title + Canonical -->
  <title>🚧 Maintenance - M' Halfirzzha Dev</title>
  <link rel="canonical" href="https://halfirzhadev.me/" />
  
  <!-- Language alternates (jika memiliki versi multi-bahasa) -->
  <link rel="alternate" hreflang="id" href="https://halfirzhadev.me/" />
  <link rel="alternate" hreflang="x-default" href="https://halfirzhadev.me/" />


  <!-- Content Security Policy (CSP) -->
  <meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com 'unsafe-inline';
  style-src 'self' https://fonts.googleapis.com 'unsafe-inline';
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' *;
  img-src * data:;
" />

 <!-- SEO Meta - Dioptimalkan -->
 <meta name="description" content="Halaman M' Halfirzzha Dev sedang dalam pemeliharaan dan akan kembali dengan tampilan dan fitur yang lebih baik. Terima kasih atas kesabaran Anda." />
  <meta name="keywords" content="maintenance, upgrade, perbaikan sistem, coming soon, M' Dev, Halfirzzha, web development" />
  <meta name="author" content="M'HALFIRZZHATULLAH" />
  <meta name="robots" content="index, follow, max-image-preview:large" />

  <!-- Open Graph (Facebook, WhatsApp, etc.) -->
  <meta property="og:title" content="🚧 Maintenance - Halfirzzha Dev" />
  <meta property="og:description" content="Halaman M' Halfirzzha Dev sedang dalam pemeliharaan dan akan kembali dengan tampilan dan fitur yang lebih baik. Terima kasih atas kesabaran Anda." />
  <meta property="og:url" content="https://halfirzhadev.me/" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://halfirzhadev.me/assets/img/M.png" />
  <meta property="og:image:alt" content="Logo Halfirzzha Dev" />
  <meta property="og:site_name" content="Halfirzzha Dev" />
  <meta property="og:locale" content="id_ID" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="🚧 Maintenance - Halfirzzha Dev" />
  <meta name="twitter:description" content="Halaman M' Halfirzzha Dev sedang dalam pemeliharaan dan akan kembali dengan tampilan dan fitur yang lebih baik. Terima kasih atas kesabaran Anda." />
  <meta name="twitter:image" content="https://halfirzhadev.me/assets/img/M.png" />
  <meta name="twitter:image:alt" content="Logo Halfirzzha Dev" />
  <meta name="twitter:creator" content="@halfirzzha" />

  <!-- Schema.org JSON-LD - Ditingkatkan -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Halfirzzha Dev",
    "url": "https://halfirzhadev.me",
    "description": "Halaman M' Halfirzzha Dev sedang dalam pemeliharaan dan akan kembali dengan tampilan dan fitur yang lebih baik.",
    "author": {
      "@type": "Person",
      "name": "M'HALFIRZZHATULLAH",
      "sameAs": [
        "https://linkedin.com/in/halfirzzha",
        "https://instagram.com/halfirzzha",
        "https://github.com/halfirzzha"
      ]
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "mainContentOfPage": {
        "@type": "SpecialAnnouncement",
        "name": "Situs dalam Pemeliharaan",
        "text": "Situs ini sedang dalam pemeliharaan dan akan kembali secepatnya.",
        "category": "https://schema.org/BusinessClosure",
        "datePosted": "2025-04-11T00:00:00+00:00"
      }
    }
  }
  </script>

<!-- Mobile + Theming -->
<meta name="theme-color" content="#000000" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="application-name" content="Halfirzzha Dev" />
  <meta name="apple-mobile-web-app-title" content="Halfirzzha Dev" />

  <!-- PWA Support -->
  <link rel="manifest" href="site.webmanifest" />
  <link rel="apple-touch-icon" href="assets/img/M.png" />

  <!-- Favicon -->
  <link rel="icon" href="assets/img/M.png" type="image/x-icon" />

 <!-- Fonts - Dengan display=swap -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
  <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" /></noscript>

  <!-- Stylesheets -->
  <link href="assets/css/style.css" rel="stylesheet" />
</head>
<body>
  <div id="particles" class="particles" aria-hidden="true"></div>
  <div class="glitch-overlay" aria-hidden="true"></div>

  <main class="container">
    <section class="card" role="region" aria-labelledby="maintenance-title">
      <div class="countdown" id="countdown" role="timer" aria-live="polite">
        <div class="time-block"><span id="days">00</span><span class="label">Hari</span></div>
        <div class="time-block"><span id="hours">00</span><span class="label">Jam</span></div>
        <div class="time-block"><span id="minutes">00</span><span class="label">Menit</span></div>
        <div class="time-block"><span id="seconds">00</span><span class="label">Detik</span></div>
      </div>

      <div class="message">
        <h1 id="maintenance-title">Dalam Pemeliharaan</h1>
        <p>Kami sedang meningkatkan sistem untuk pengalaman yang lebih baik. Terima kasih atas pengertiannya!</p>
      </div>

      <section class="visitor-info" aria-labelledby="visitor-title">
        <h2 id="visitor-title">Informasi Pengunjung</h2>
        <pre id="visitor-data">
            <?php
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'Tidak diketahui';
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Tidak diketahui';
            echo "IP Address: $ip\nUser Agent: $ua";
            ?>
        </pre>
      </section>

      <div class="buttons">
        <div class="social-buttons">
          <a href="https://linkedin.com/in/halfirzzha" class="btn social" rel="noopener noreferrer" aria-label="LinkedIn" target="_blank">
            <i data-feather="linkedin" aria-hidden="true"></i>
          </a>
          <a href="https://instagram.com/halfirzzha" class="btn social" rel="noopener noreferrer" aria-label="Instagram" target="_blank">
            <i data-feather="instagram" aria-hidden="true"></i>
          </a>
          <a href="https://github.com/halfirzzha" class="btn social" rel="noopener noreferrer" aria-label="GitHub" target="_blank">
            <i data-feather="github" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="footer-content">
      <p>Developed by M' | &copy; 2020 - <?= date('Y') ?></p>
      <p>Jam: <span id="time"><?= date('H:i:s') ?></span></p>
    </div>
  </footer>

  <!-- Audio -->
  <audio id="background-music" src="assets/music/backsound.mp3" preload="none" loop aria-label="Background music" controls style="display: none;"></audio>
  <div id="autoplay-notice" class="autoplay-notice" role="alert">
    <div class="autoplay-notice-content">
      <p>Aktifkan fitur Autoplay di browser Anda agar musik dapat diputar otomatis saat website dibuka.</p>
    </div>
  </div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js" defer></script>
  <script src="https://unpkg.com/feather-icons" defer></script>
  <script src="assets/js/visitor.js" defer></script>
  <script src="assets/js/music.js" defer></script>
  <script src="assets/js/app.js" defer></script>
  
  <!-- Inline initialization for Lighthouse performance -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Mark particles as loaded when ready
      document.getElementById('particles').classList.add('loaded');
    });
  </script>
   <!-- Noscript fallback -->
   <noscript>
    <div class="noscript-message">
      <p>Situs ini membutuhkan JavaScript untuk tampilan optimal. Silakan aktifkan JavaScript di browser Anda.</p>
    </div>
  </noscript>
</body>
</html>
  