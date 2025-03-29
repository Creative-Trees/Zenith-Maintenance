<?php
// Set header untuk JSON response
header('Content-Type: application/json');

// Path ke file log
$file = __DIR__ . '/assets/js/IP.txt';
$maxFileSize = 5 * 1024 * 1024; // Maksimal ukuran file log: 5 MB

// Ambil data JSON dari request POST
$data = file_get_contents('php://input');
$log = json_decode($data, true);

// Validasi data log
if (!isset($log['log']) || empty($log['log'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Invalid log data']);
    exit;
}

// Fungsi untuk sanitasi data
function sanitizeData($data) {
    return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

// Fungsi untuk membatasi ukuran file log
function checkLogFileSize($file, $maxFileSize) {
    if (file_exists($file) && filesize($file) > $maxFileSize) {
        // Ambil waktu saat ini untuk nama file backup
        date_default_timezone_set('Asia/Jakarta');
        $currentDate = date('d-M-Y'); // Format: 30-Maret-2025
        $backupFile = __DIR__ . "/assets/js/IP-backup-log-$currentDate.txt";

        // Backup file log lama
        if (!rename($file, $backupFile)) {
            throw new Exception("Failed to create backup log file.");
        }
    }
}

// Sanitasi data log
$log['log'] = sanitizeData($log['log']);
if (isset($log['suspicious'])) {
    $log['suspicious'] = sanitizeData($log['suspicious']);
}

// Pastikan folder tujuan dapat ditulis
if (!is_writable(dirname($file))) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['status' => 'error', 'message' => 'Log directory is not writable']);
    exit;
}

// Ambil waktu saat ini dengan format lengkap
date_default_timezone_set('Asia/Jakarta'); // Pastikan timezone sesuai
$dayNames = [
    'Sunday' => 'Minggu',
    'Monday' => 'Senin',
    'Tuesday' => 'Selasa',
    'Wednesday' => 'Rabu',
    'Thursday' => 'Kamis',
    'Friday' => 'Jumat',
    'Saturday' => 'Sabtu'
];
$currentDay = $dayNames[date('l')]; // Hari dalam bahasa Indonesia
$currentDate = date('d'); // Tanggal
$currentMonth = date('F'); // Bulan
$currentYear = date('Y'); // Tahun
$currentTime = date('H:i:s'); // Jam:Menit:Detik

// Ambil metadata tambahan
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'Unknown IP';

// Format log utama
$logEntry = "==============================================================\n";
$logEntry .= "📅 Hari: $currentDay\n";
$logEntry .= "📅 Tanggal: $currentDate\n";
$logEntry .= "📅 Bulan: $currentMonth\n";
$logEntry .= "📅 Tahun: $currentYear\n";
$logEntry .= "⏰ Waktu: $currentTime\n";
$logEntry .= "🌐 IP Address: $clientIp\n";
$logEntry .= "==============================================================\n";
$logEntry .= $log['log']; // Log utama tanpa Tanggal dan Waktu
$logEntry .= "==============================================================\n\n";

// Tambahkan log aktivitas mencurigakan jika ada
if (isset($log['suspicious'])) {
    $suspiciousLog = "==============================================================\n";
    $suspiciousLog .= "⚠️ Aktivitas Mencurigakan Terdeteksi\n";
    $suspiciousLog .= "📝 Deskripsi: " . $log['suspicious'] . "\n";
    $suspiciousLog .= "==============================================================\n\n";
    $logEntry .= $suspiciousLog;
}

// Periksa ukuran file log sebelum menulis
try {
    checkLogFileSize($file, $maxFileSize);
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
}

// Simpan log ke file dengan pengecekan error
if (file_put_contents($file, $logEntry, FILE_APPEND | LOCK_EX) === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['status' => 'error', 'message' => 'Failed to save log']);
    exit;
}

// Sukses
echo json_encode(['status' => 'success', 'message' => 'Log saved successfully']);
?>