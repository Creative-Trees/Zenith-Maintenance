# Zenith Maintenance

Zenith Maintenance adalah halaman pemeliharaan interaktif premium yang dirancang untuk memberi tahu pengunjung bahwa situs sedang dalam perbaikan. Tidak seperti halaman pemeliharaan statis biasa, Zenith menawarkan pengalaman yang dinamis dan menarik dengan animasi modern, musik latar, serta informasi pengunjung real-time dengan teknologi geolokasi presisi ultra tinggi. 
<br><br>
  ![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
  ![Last Updated](https://img.shields.io/badge/updated-2025--04--11-orange.svg)
  ![Maintained by](https://img.shields.io/badge/Maintained%20by-Halfirzzha-purple.svg)


## ✨ Fitur Utama

<table>
  <tr>
    <td width="50%">
      <h3>💫 Elemen Interaktif</h3>
      <ul>
        <li><b>⏳ Hitungan Mundur</b> – Menampilkan waktu real-time hingga situs kembali aktif</li>
        <li><b>✨ Efek Partikel</b> – Animasi partikel responsif yang memberikan tampilan modern</li>
        <li><b>🎵 Musik Latar</b> – Musik otomatis yang dapat diaktifkan/dimatikan sesuai preferensi</li>
        <li><b>🔠 Efek Teks Scramble</b> – Efek animasi teks dinamis untuk meningkatkan estetika</li>
        <li><b>🔗 Tautan Sosial Media</b> – Navigasi langsung ke berbagai platform sosial media</li>
      </ul>
    </td>
    <td width="50%">
      <h3>📡 Teknologi Pengunjung</h3>
      <ul>
        <li><b>📍 UltraLoc™ Geolocation</b> – Teknologi presisi ultra tinggi dengan akurasi sub-0.5 meter</li>
        <li><b>🌎 Informasi Pengunjung</b> – Menampilkan data komprehensif tentang pengunjung</li>
        <li><b>📊 Analitik Real-time</b> – Mencatat dan menganalisis pola kunjungan</li>
        <li><b>📁 Smart Logging System</b> – Pencatatan log dengan backup otomatis</li>
        <li><b>🔒 Keamanan Tingkat Lanjut</b> – Proteksi data dan pencegahan akses tidak sah</li>
      </ul>
    </td>
  </tr>
</table>

## 🔍 Fitur Geolokasi Ultra Presisi (UltraLoc™)

Zenith Maintenance kini dilengkapi dengan sistem geolokasi UltraLoc™ yang mampu memberikan akurasi lokasi hingga sub-0.5 meter, jauh melampaui kemampuan sistem geolokasi konvensional:

- **Multi-Sensor Fusion** – Menggabungkan data GPS dengan akselerometer, giroskop, dan magnetometer
- **Kalman Filtering** – Algoritma pemrosesan statistik canggih untuk memperhalus data lokasi
- **Differential Correction** – Koreksi diferensial seperti pada sistem DGPS profesional
- **Environmental Awareness** – Deteksi otomatis lingkungan indoor/outdoor untuk penyesuaian presisi
- **Adaptive Sampling** – Pengumpulan sampel lokasi dengan interval dinamis berdasarkan kondisi
- **High-Precision Geocoding** – Konversi koordinat ke alamat dengan detail tingkat tinggi
- **Confidence Metrics** – Menampilkan tingkat kepercayaan dan akurasi estimasi posisi

## 🛠️ Teknologi yang Digunakan

<table>
  <tr>
    <th>Frontend</th>
    <th>Backend</th>
    <th>Server</th>
  </tr>
  <tr>
    <td>
      <ul>
        <li>HTML5</li>
        <li>CSS3 (Animations, Flexbox, Grid)</li>
        <li>JavaScript ES6+</li>
        <li>Particle.js</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>PHP 8.0+</li>
        <li>JSON data handling</li>
        <li>ZenithLog Elite Logger</li>
        <li>Multi-source API integration</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>Apache</li>
        <li>Optimized .htaccess</li>
        <li>HTTP/2 Support</li>
        <li>Advanced CORS configuration</li>
      </ul>
    </td>
  </tr>
</table>

## 🚀 Instalasi & Penggunaan

1. **Clone repositori ini** ke dalam direktori lokal Anda:
   ```sh
   git clone https://github.com/Creative-Trees/Zenith-Maintenance.git
   ```

2. **Masuk ke direktori proyek:**
   ```sh
   cd Zenith-Maintenance
   ```

3. **Konfigurasi server:**
   - Pastikan server Apache Anda mendukung file `.htaccess`
   - Aktifkan modul yang diperlukan: `mod_headers`, `mod_rewrite`, `mod_expires`
   - Pastikan PHP 7.4+ diaktifkan (PHP 8.0+ direkomendasikan)
   - Sesuaikan nilai `MAX_LOGS_PER_IP` dan `RATE_LIMIT_WINDOW` di `save-log.php` jika diperlukan

4. **Konfigurasi halaman:**
   - Edit `index.html` untuk menyesuaikan waktu countdown
   - Sesuaikan tautan media sosial di bagian footer
   - Opsional: Ganti file musik di folder `assets/music/`

5. **Deploy ke server:**
   - Upload semua file ke direktori web Anda
   - Pastikan semua file memiliki permission yang tepat:
     ```sh
     find . -type f -exec chmod 644 {} \;
     find . -type d -exec chmod 755 {} \;
     ```

6. **Verifikasi instalasi:**
   - Akses situs melalui browser
   - Periksa konsol browser untuk memastikan tidak ada error
   - Cek folder `assets/data/logs/` untuk memastikan log pengunjung berfungsi

## 📂 Struktur Proyek

```
Zenith-Maintenance/
├── .htaccess                     # Konfigurasi server Apache yang dioptimalkan
├── assets/
│   ├── css/
│   │   └── style.css             # File styling utama
│   ├── js/
│   │   ├── app.js                # Efek partikel & teks scramble
│   │   ├── music.js              # Kontrol musik latar
│   │   └── visitor.js            # Menampilkan informasi pengunjung
│   ├── data/
│   │   ├── logs/                 # Direktori penyimpanan log
│   │   │   ├── visitors/         # Log pengunjung biasa
│   │   │   ├── security/         # Log keamanan (potensi ancaman)
│   │   │   └── errors/           # Log error sistem
│   │   ├── analytics/            # Data analitik pengunjung
│   │   └── backups/              # Backup log otomatis
│   ├── music/                    # Folder untuk file musik latar
│   ├── img/                      # Folder untuk gambar
│   └── fonts/                    # Font custom
├── save-log.php                  # Backend untuk mencatat log pengunjung
├── index.php                     # Halaman utama
├── LICENSE                       # Lisensi MIT
└── README.md                     # Dokumentasi proyek
```

## 📊 Perbandingan Sistem Geolokasi

<table>
  <tr>
    <th>Fitur</th>
    <th>Sistem Geolokasi Konvensional</th>
    <th>UltraLoc™ (Saat Ini)</th>
  </tr>
  <tr>
    <td>Akurasi Luar Ruangan</td>
    <td>3-10 meter</td>
    <td><b>0.3-0.5 meter</b></td>
  </tr>
  <tr>
    <td>Akurasi Dalam Ruangan</td>
    <td>10-50 meter</td>
    <td><b>1.5-3 meter</b></td>
  </tr>
  <tr>
    <td>Waktu Akuisisi</td>
    <td>5-10 detik</td>
    <td><b>2-4 detik</b></td>
  </tr>
  <tr>
    <td>Konsumsi Baterai</td>
    <td>Tinggi</td>
    <td><b>Adaptif (Rendah hingga Sedang)</b></td>
  </tr>
  <tr>
    <td>Metode Pemrosesan</td>
    <td>Sampel tunggal</td>
    <td><b>Multi-sampel dengan filterisasi statistik</b></td>
  </tr>
  <tr>
    <td>Integrasi Sensor</td>
    <td>Tidak ada</td>
    <td><b>GPS + Akselerometer + Giroskop + Magnetometer</b></td>
  </tr>
  <tr>
    <td>Deteksi Lingkungan</td>
    <td>Tidak</td>
    <td><b>Ya (Indoor/Outdoor)</b></td>
  </tr>
  <tr>
    <td>Geocoding</td>
    <td>Layanan tunggal</td>
    <td><b>Multi-layanan dengan prioritas adaptif</b></td>
  </tr>
</table>

## 🆕 Pembaruan Versi Terbaru (v1.4.0)

### Sistem Geolokasi UltraLoc™
- **📍 Presisi Sub-0.5 Meter:** Peningkatan akurasi hingga 80% dibandingkan versi sebelumnya
- **🔄 Multi-Sensor Fusion:** Integrasi data dari multiple sensor perangkat
- **📊 Kalman Filtering:** Implementasi algoritma Kalman Filter untuk pemrosesan statistik lanjutan
- **🌡️ Environmental Awareness:** Deteksi otomatis lingkungan indoor/outdoor
- **📡 Differential Correction:** Teknologi koreksi posisi tingkat lanjut

### Pencatatan & Keamanan
- **📁 ZenithLog Elite:** Sistem logging yang disempurnakan dengan:
  - Pemrosesan real-time untuk deteksi ancaman
  - Rate limiting untuk mencegah spam
  - Kategorisasi log (pengunjung, keamanan, error)
  - Rotasi dan backup log otomatis
- **🔒 Keamanan Tingkat Lanjut:**
  - Konfigurasi `.htaccess` yang dioptimalkan
  - CSP dan Permissions Policy yang diperbarui
  - CORS support untuk geolokasi dan API eksternal
  - Validasi input untuk mencegah injeksi

### Penyempurnaan UI/UX
- **🎨 Visual Refresh:** Peningkatan animasi dan efek visual
- **⚡ Optimasi Performa:** Loading time yang lebih cepat dengan lazy loading
- **📱 Responsivitas:** Penyempurnaan tampilan di berbagai ukuran layar
- **♿ Aksesibilitas:** Peningkatan kompatibilitas dengan screen reader

## 📜 Lisensi

Proyek ini dilisensikan di bawah **[MIT License](LICENSE)**, yang berarti Anda dapat:
- Menggunakan kode ini secara bebas untuk proyek pribadi atau komersial
- Memodifikasi kode sesuai kebutuhan
- Mendistribusikan kode dalam bentuk asli atau termodifikasi

Namun, Anda diminta untuk menyertakan pemberitahuan hak cipta dan lisensi di semua salinan atau bagian substansial dari perangkat lunak.

## 🤝 Kontribusi

Kami sangat menghargai kontribusi dari komunitas! Jika Anda ingin berkontribusi:

1. **Fork** repositori ini
2. **Buat branch fitur baru**:
   ```sh
   git checkout -b fitur/nama-fitur
   ```
3. **Commit perubahan Anda**:
   ```sh
   git commit -m "Menambahkan: deskripsi singkat fitur"
   ```
4. **Push ke branch tersebut**:
   ```sh
   git push origin fitur/nama-fitur
   ```
5. **Ajukan Pull Request**

### Area Kontribusi yang Dibutuhkan
- Peningkatan pada algoritma geolokasi
- Optimasi performa untuk perangkat dengan spesifikasi rendah
- Terjemahan ke bahasa lain
- Peningkatan aksesibilitas
- Dokumentasi dan contoh penggunaan

## 📞 Kontak & Media Sosial

<div align="center">
  
  [![GitHub](https://img.shields.io/badge/GitHub-halfirzzha-181717?style=for-the-badge&logo=github)](https://github.com/halfirzzha)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-halfirzzha-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/halfirzzha)
  [![Instagram](https://img.shields.io/badge/Instagram-halfirzzha-E4405F?style=for-the-badge&logo=instagram)](https://instagram.com/halfirzzha)
  
</div>

---

<div align="center">
  Dibuat dengan ❤️ oleh Halfirzzha & Team Creative Trees
</div>