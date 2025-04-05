<?php
/**
 * Enhanced Log Handler - Script untuk menyimpan data log dengan format terstruktur
 * 
 * Script ini menerima data log dalam format JSON melalui request POST,
 * memvalidasi dan menyimpannya ke file teks dan JSON dengan rotasi log otomatis.
 * Setiap entri log memiliki UUID unik untuk pelacakan yang lebih baik.
 * 
 * @author  Improved by Claude
 * @version 1.2
 */

// Set header untuk JSON response
header('Content-Type: application/json');

// Konfigurasi
define('LOG_FILE', __DIR__ . '/assets/data/IP.txt');
define('JSON_FILE', __DIR__ . '/assets/data/IP.json');
define('BACKUP_DIR', __DIR__ . '/assets/data/backup');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5 MB
define('TIMEZONE', 'Asia/Jakarta');

try {
    // Set timezone
    date_default_timezone_set(TIMEZONE);
    
    // Pastikan direktori backup ada
    if (!file_exists(BACKUP_DIR)) {
        if (!mkdir(BACKUP_DIR, 0755, true)) {
            throw new Exception('Failed to create backup directory');
        }
    }
    
    // Ambil data JSON dari request POST
    $jsonInput = file_get_contents('php://input');
    $log = json_decode($jsonInput, true);
    
    // Validasi data log
    if (!isset($log['log']) || empty($log['log'])) {
        throw new Exception('Invalid log data');
    }
    
    // Sanitasi data log
    $log['log'] = sanitizeData($log['log']);
    if (isset($log['suspicious'])) {
        $log['suspicious'] = sanitizeData($log['suspicious']);
    }
    
    // Pastikan folder tujuan dapat ditulis
    if (!is_writable(dirname(LOG_FILE)) || !is_writable(dirname(JSON_FILE))) {
        throw new Exception('Log directory is not writable');
    }
    
    // Periksa ukuran file log sebelum menulis
    checkLogFileSize(LOG_FILE, MAX_FILE_SIZE, 'txt');
    checkLogFileSize(JSON_FILE, MAX_FILE_SIZE, 'json');
    
    // Generate UUID untuk entri log ini
    $uuid = generateUUID();
    
    // Format entri log untuk file teks
    $textLogEntry = formatTextLogEntry($log, $uuid);
    
    // Format entri log untuk file JSON
    $jsonLogEntry = formatJsonLogEntry($log, $uuid);
    
    // Simpan log ke file teks
    if (file_put_contents(LOG_FILE, $textLogEntry, FILE_APPEND | LOCK_EX) === false) {
        throw new Exception('Failed to save text log');
    }
    
    // Simpan log ke file JSON
    saveJsonLog(JSON_FILE, $jsonLogEntry);
    
    // Sukses
    sendResponse('success', 'Log saved successfully with UUID: ' . $uuid);
    
} catch (Exception $e) {
    // Tangani semua exception
    $code = ($e->getCode() > 0) ? $e->getCode() : 500;
    http_response_code($code);
    sendResponse('error', $e->getMessage());
}

/**
 * Generate UUID v4
 * 
 * @return string UUID v4
 */
function generateUUID() {
    // Menghasilkan 16 bytes (128 bits) dari data acak
    $data = random_bytes(16);
    
    // Set versi UUID ke 4 (acak)
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    // Set bits teratas dari byte clock_seq_hi_and_reserved ke 0 dan bits kedua teratas ke 1
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    
    // Format UUID sebagai string
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/**
 * Sanitasi data untuk mencegah XSS
 * 
 * @param string $data Data yang akan disanitasi
 * @return string Data yang sudah disanitasi
 */
function sanitizeData($data) {
    return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

/**
 * Memeriksa ukuran file log dan melakukan rotasi jika diperlukan
 * 
 * @param string $file Path ke file log
 * @param int $maxFileSize Ukuran maksimal file log dalam bytes
 * @param string $type Tipe file ('txt' atau 'json')
 * @throws Exception Jika gagal membuat file backup
 */
function checkLogFileSize($file, $maxFileSize, $type) {
    if (file_exists($file) && filesize($file) > $maxFileSize) {
        // Ambil waktu saat ini untuk nama file backup
        $currentDate = date('d-M-Y-His'); // Format: 05-Apr-2025-153045
        $backupFile = BACKUP_DIR . "/IP-backup-{$currentDate}.{$type}";
        
        // Backup file log lama
        if (!rename($file, $backupFile)) {
            throw new Exception("Failed to create backup {$type} file", 500);
        }
        
        // Jika file JSON, inisialisasi dengan struktur yang benar
        if ($type === 'json' && !file_exists($file)) {
            $initialJson = [
                'metadata' => [
                    'created_at' => date('Y-m-d H:i:s'),
                    'version' => '1.0'
                ],
                'entries' => []
            ];
            file_put_contents($file, json_encode($initialJson, JSON_PRETTY_PRINT));
        }
    } elseif (!file_exists($file) && $type === 'json') {
        // Inisialisasi file JSON jika belum ada
        $initialJson = [
            'metadata' => [
                'created_at' => date('Y-m-d H:i:s'),
                'version' => '1.0'
            ],
            'entries' => []
        ];
        file_put_contents($file, json_encode($initialJson, JSON_PRETTY_PRINT));
    }
}

/**
 * Format entri log teks dengan metadata dan UUID
 * 
 * @param array $log Data log yang akan diformat
 * @param string $uuid UUID untuk entri log ini
 * @return string Log entry yang sudah diformat dalam bentuk teks
 */
function formatTextLogEntry($log, $uuid) {
    // Daftar nama hari dalam bahasa Indonesia
    $dayNames = [
        'Sunday' => 'Minggu',
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu'
    ];
    
    // Ambil data waktu
    $currentDay = $dayNames[date('l')]; 
    $currentDate = date('d');
    $currentMonth = date('F');
    $currentYear = date('Y');
    $currentTime = date('H:i:s');
    
    // Ambil IP address client dan informasi tambahan
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'Unknown IP';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown User Agent';
    $referer = $_SERVER['HTTP_REFERER'] ?? 'Direct Access';
    
    // Format log utama
    $logEntry = "==============================================================\n";
    $logEntry .= "🔑 Log ID: $uuid\n";
    $logEntry .= "📅 Hari: $currentDay\n";
    $logEntry .= "📅 Tanggal: $currentDate\n";
    $logEntry .= "📅 Bulan: $currentMonth\n";
    $logEntry .= "📅 Tahun: $currentYear\n";
    $logEntry .= "⏰ Waktu: $currentTime\n";
    $logEntry .= "🌐 IP Address: $clientIp\n";
    $logEntry .= "🖥️ User Agent: $userAgent\n";
    $logEntry .= "🔗 Referer: $referer\n";
    $logEntry .= "==============================================================\n";
    $logEntry .= $log['log'] . "\n";
    $logEntry .= "==============================================================\n\n";
    
    // Tambahkan log aktivitas mencurigakan jika ada
    if (isset($log['suspicious']) && !empty($log['suspicious'])) {
        $logEntry .= "==============================================================\n";
        $logEntry .= "⚠️ Aktivitas Mencurigakan Terdeteksi\n";
        $logEntry .= "📝 Deskripsi: " . $log['suspicious'] . "\n";
        
        // Tambahkan deteksi metode akses jika tersedia
        if (isset($log['attack_vector'])) {
            $logEntry .= "🛡️ Vektor Serangan: " . sanitizeData($log['attack_vector']) . "\n";
        }
        
        // Tambahkan tingkat keparahan jika tersedia
        if (isset($log['severity'])) {
            $logEntry .= "⚠️ Tingkat Keparahan: " . sanitizeData($log['severity']) . "\n";
        }
        
        $logEntry .= "==============================================================\n\n";
    }
    
    return $logEntry;
}

/**
 * Format entri log untuk format JSON dengan struktur yang lebih detail
 * 
 * @param array $log Data log yang akan diformat
 * @param string $uuid UUID untuk entri log ini
 * @return array Data log yang sudah diformat dalam bentuk array untuk JSON
 */
function formatJsonLogEntry($log, $uuid) {
    $timestamp = date('Y-m-d H:i:s');
    $dayNames = [
        'Sunday' => 'Minggu',
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu'
    ];
    
    // Informasi client
    $clientInfo = [
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown IP',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown User Agent',
        'referer' => $_SERVER['HTTP_REFERER'] ?? 'Direct Access',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown Method',
        'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Unknown Protocol'
    ];
    
    // Coba dapatkan informasi lokasi berdasarkan IP (dummy)
    $geoInfo = [
        'country' => 'Unknown',
        'city' => 'Unknown',
        'region' => 'Unknown',
        'timezone' => TIMEZONE
    ];
    
    // Entry log utama
    $entry = [
        'id' => $uuid,
        'timestamp' => $timestamp,
        'datetime' => [
            'day_name' => $dayNames[date('l')],
            'date' => (int)date('d'),
            'month' => date('F'),
            'year' => (int)date('Y'),
            'time' => date('H:i:s'),
            'timestamp_unix' => time()
        ],
        'client' => $clientInfo,
        'geo' => $geoInfo,
        'content' => $log['log']
    ];
    
    // Tambahkan informasi aktivitas mencurigakan jika ada
    if (isset($log['suspicious']) && !empty($log['suspicious'])) {
        $securityInfo = [
            'is_suspicious' => true,
            'description' => $log['suspicious'],
            'detected_at' => $timestamp
        ];
        
        // Tambahkan metode serangan jika tersedia
        if (isset($log['attack_vector'])) {
            $securityInfo['attack_vector'] = sanitizeData($log['attack_vector']);
        }
        
        // Tambahkan tingkat keparahan jika tersedia
        if (isset($log['severity'])) {
            $securityInfo['severity'] = sanitizeData($log['severity']);
        }
        
        $entry['security'] = $securityInfo;
    } else {
        $entry['security'] = [
            'is_suspicious' => false
        ];
    }
    
    return $entry;
}

/**
 * Simpan entri log ke file JSON dengan struktur yang lebih terorganisir
 * 
 * @param string $jsonFile Path ke file JSON
 * @param array $logEntry Data log yang akan disimpan
 * @throws Exception Jika gagal menyimpan log
 */
function saveJsonLog($jsonFile, $logEntry) {
    // Baca file JSON yang ada atau buat struktur baru jika tidak ada
    $jsonData = [
        'metadata' => [
            'created_at' => date('Y-m-d H:i:s'),
            'version' => '1.0'
        ],
        'entries' => []
    ];
    
    if (file_exists($jsonFile) && filesize($jsonFile) > 0) {
        $jsonContent = file_get_contents($jsonFile);
        $tempData = json_decode($jsonContent, true);
        
        // Jika file ada dan valid, gunakan metadata dan entries yang sudah ada
        if ($tempData !== null && isset($tempData['entries'])) {
            $jsonData = $tempData;
        }
    }
    
    // Tambahkan entry baru ke array entries
    $jsonData['entries'][] = $logEntry;
    
    // Update last_updated di metadata
    $jsonData['metadata']['last_updated'] = date('Y-m-d H:i:s');
    $jsonData['metadata']['entry_count'] = count($jsonData['entries']);
    
    // Simpan kembali file JSON dengan format yang lebih rapi
    if (file_put_contents($jsonFile, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) {
        throw new Exception('Failed to save JSON log');
    }
}

/**
 * Kirim response JSON
 * 
 * @param string $status Status response ('success' atau 'error')
 * @param string $message Pesan response
 */
function sendResponse($status, $message) {
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
?>