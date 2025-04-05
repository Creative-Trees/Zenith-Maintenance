<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />

  <!-- Title + Canonical -->
  <title>🚧 Maintenance - M' Dev</title>
  <link rel="canonical" href="https://halfirzhadev.me/" />

  <!-- Content Security Policy (CSP) -->
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com 'unsafe-inline';
    style-src 'self' https://fonts.googleapis.com 'unsafe-inline';
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://ipinfo.io;
    object-src 'none';
    media-src 'self';
  " />

  <!-- SEO Meta -->
  <meta name="description" content="Situs kami sedang dalam pemeliharaan. Kami kembali secepatnya dengan pengalaman terbaik untuk Anda." />
  <meta name="keywords" content="maintenance, upgrade, perbaikan sistem, coming soon, M' Dev" />
  <meta name="author" content="M'HALFIRZZHATULLAH" />
  <meta name="robots" content="index, follow" />

  <!-- Open Graph (Facebook, WhatsApp, etc.) -->
  <meta property="og:title" content="🚧 Maintenance - Halfirzzha Dev" />
  <meta property="og:description" content="Situs kami sedang dalam pemeliharaan. Kami kembali secepatnya!" />
  <meta property="og:url" content="https://halfirzhadev.me/" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://halfirzhadev.me/assets/img/M.png" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="🚧 Maintenance - Halfirzzha Dev" />
  <meta name="twitter:description" content="Situs kami sedang dalam pemeliharaan. Kami kembali secepatnya!" />
  <meta name="twitter:image" content="https://halfirzhadev.me/assets/img/M.png" />

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Halfirzzha Dev",
    "url": "https://halfirzhadev.me",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://halfirzhadev.me?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
  </script>

  <!-- Mobile + Theming -->
  <meta name="theme-color" content="#000000" />
  <meta name="mobile-web-app-capable" content="yes" />

  <!-- Favicon -->
  <link rel="icon" href="assets/img/M.png" type="image/x-icon" />

  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

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
      <p>Waktu: <span id="time"><?= date('H:i:s') ?></span></p>
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
  
</body>
</html>
  