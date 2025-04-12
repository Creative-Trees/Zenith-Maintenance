<?php
/**
 * ZenithLog Elite - Professional Logging and Security Tracking System
 *
 * @author  M'HALFIRZZHATULLHA & Team Creative Trees
 * @version 1.4.0
 * @copyright 2025 Creative Trees
 */

// ======================= SECURITY FIRST =======================
// Prevent direct script access
if (!defined('ZENITH_SECURE_ACCESS') && 
    (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || 
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest')) {
    header('HTTP/1.1 403 Forbidden');
    header('Content-Type: application/json; charset=UTF-8');
    exit(json_encode([
        'status' => 'error',
        'message' => 'Access Denied',
        'timestamp' => date('Y-m-d H:i:s')
    ]));
}

// Set JSON response header
header('Content-Type: application/json; charset=UTF-8');

// Prevent caching
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// ======================= MAIN CONFIGURATION =======================
/**
 * ZenithConfig - Central configuration management
 */
final class ZenithConfig {
    // Base directory paths
    const ROOT_DIR          = __DIR__;
    const ASSETS_DIR        = self::ROOT_DIR . '/assets';
    const DATA_DIR          = self::ASSETS_DIR . '/data';
    
    // Log storage paths
    const LOGS_DIR          = self::DATA_DIR . '/logs';
    const VISITORS_DIR      = self::LOGS_DIR . '/visitors';
    const SECURITY_DIR      = self::LOGS_DIR . '/security';
    const ERRORS_DIR        = self::LOGS_DIR . '/errors';
    
    // Analytics data
    const ANALYTICS_DIR     = self::DATA_DIR . '/analytics';
    const IP_DATABASE       = self::ANALYTICS_DIR . '/ip_intel.json';
    const URL_DATABASE      = self::ANALYTICS_DIR . '/url_tracker.json';
    const STATS_DATABASE    = self::ANALYTICS_DIR . '/statistics.json';
    
    // Backups
    const BACKUPS_DIR       = self::DATA_DIR . '/backups';
    const BACKUP_SIZE_LIMIT = 5 * 1024 * 1024;  // 5MB in bytes
    const MAX_BACKUPS       = 10; // Batasi jumlah backup untuk menghemat ruang disk
    
    // Performance and security
    const MAX_LOGS_PER_IP   = 10;         // Maximum logs per IP per time window
    const RATE_LIMIT_WINDOW = 3600;       // Time window for rate limiting (1 hour)
    const LOG_RETENTION     = 30;         // Days to keep logs before archiving
    const TIMEZONE          = 'Asia/Jakarta';
    const CACHE_DURATION    = 300;        // Durasi cache dalam detik (5 menit)
    
    // Threat detection patterns - Improved security patterns
    const ATTACK_PATTERNS = [
        'xss' => [
            'pattern' => '/<script|javascript:|on(load|click|mouse|error|key|submit|change|focus|blur)|alert\(|eval\(|document\.|window\.|fetch\(|\(\)|expression\(|innerHTML/i',
            'severity' => 'critical'
        ],
        'sql' => [
            'pattern' => '/\b(union\s+select|select\s+.*\s+from|insert\s+into|update\s+.*\s+set|delete\s+from|drop\s+table|alter\s+table|exec\s+xp_|information_schema)\b/i',
            'severity' => 'critical'
        ],
        'path' => [
            'pattern' => '/(\.\.\/|\.\.\\\\|\bpasswd\b|\bshadow\b|\/etc\/|\/bin\/|\/usr\/|%2e%2e%2f|%252e%252e%252f)/i',
            'severity' => 'high'
        ],
        'cmd' => [
            'pattern' => '/(\||;|\$\(|\`|&\s*\w+|system\(|exec\(|shell_exec\(|passthru\(|proc_open\(|popen\(|curl\s|wget\s)/i',
            'severity' => 'critical'
        ],
        'file' => [
            'pattern' => '/\.(php|phtml|php3|php4|php5|php7|pht|phar|exe|sh|bat|cmd)$/i',
            'severity' => 'high'
        ]
    ];
    
    // Localization support
    const DAYS = [
        'Sunday'=>'Minggu', 'Monday'=>'Senin', 'Tuesday'=>'Selasa', 
        'Wednesday'=>'Rabu', 'Thursday'=>'Kamis', 'Friday'=>'Jumat', 'Saturday'=>'Sabtu'
    ];
    
    const MONTHS = [
        'January'=>'Januari', 'February'=>'Februari', 'March'=>'Maret',
        'April'=>'April', 'May'=>'Mei', 'June'=>'Juni',
        'July'=>'Juli', 'August'=>'Agustus', 'September'=>'September',
        'October'=>'Oktober', 'November'=>'November', 'December'=>'Desember'
    ];
    
    /**
     * Translates a day name to Indonesian
     */
    public static function translateDay($day) {
        return self::DAYS[$day] ?? $day;
    }
    
    /**
     * Translates a month name to Indonesian
     */
    public static function translateMonth($month) {
        return self::MONTHS[$month] ?? $month;
    }
}

// ======================= DATA STORAGE MANAGEMENT =======================
/**
 * StorageManager - Handles all file operations and directory management
 */
class StorageManager {
    /**
     * In-memory cache untuk mengurangi operasi file
     */
    private $cache = [];
    
    /**
     * Cache expiration timestamps
     */
    private $cacheExpiration = [];
    
    /**
     * Creates all required directories for the logging system
     */
    public function initializeDirectories() {
        $this->createDirectoryStructure([
            ZenithConfig::ASSETS_DIR,
            ZenithConfig::DATA_DIR,
            ZenithConfig::LOGS_DIR,
            ZenithConfig::VISITORS_DIR,
            ZenithConfig::SECURITY_DIR,
            ZenithConfig::ERRORS_DIR,
            ZenithConfig::ANALYTICS_DIR,
            ZenithConfig::BACKUPS_DIR
        ]);
        
        // Create date-specific directories
        $today = date('Y-m-d');
        $this->createDirectoryStructure([
            ZenithConfig::VISITORS_DIR . '/' . $today, 
            ZenithConfig::SECURITY_DIR . '/' . $today
        ]);
        
        // Buat file .htaccess untuk melindungi direktori sensitif
        $this->createProtectionFiles();
    }
    
    /**
     * Creates multiple directories at once
     */
    private function createDirectoryStructure(array $directories) {
        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                if (!@mkdir($dir, 0755, true)) {
                    throw new Exception("Failed to create directory: {$dir}");
                }
            }
        }
    }
    
    /**
     * Membuat file proteksi (.htaccess) di direktori sensitif
     */
    private function createProtectionFiles() {
        $protectDirs = [
            ZenithConfig::DATA_DIR,
            ZenithConfig::LOGS_DIR,
            ZenithConfig::ANALYTICS_DIR,
            ZenithConfig::BACKUPS_DIR
        ];
        
        $htaccessContent = "# ZenithLog Elite Protection\nOrder deny,allow\nDeny from all\n";
        
        foreach ($protectDirs as $dir) {
            $htaccess = $dir . '/.htaccess';
            if (!file_exists($htaccess)) {
                file_put_contents($htaccess, $htaccessContent, LOCK_EX);
            }
        }
    }
    
    /**
     * Saves log data in both JSON and text formats
     */
    public function saveLogData($logData, $textFormat, $category = 'visitors') {
        $today = date('Y-m-d');
        $time = date('His');
        $id = substr($logData['id'], 0, 8);
        
        // Determine target directory
        $baseDir = ($category === 'security') ? 
                  ZenithConfig::SECURITY_DIR : 
                  ZenithConfig::VISITORS_DIR;
        
        $todayDir = $baseDir . '/' . $today;
        
        // Ensure directory exists
        if (!is_dir($todayDir)) {
            $this->createDirectoryStructure([$todayDir]);
        }
        
        // Save as JSON
        $jsonFile = "{$todayDir}/{$time}_{$id}.json";
        $jsonResult = file_put_contents(
            $jsonFile, 
            json_encode($logData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            LOCK_EX
        );
        
        if ($jsonResult === false) {
            throw new Exception("Failed to write JSON log file");
        }
        
        // Save as text
        $textFile = "{$todayDir}/{$time}_{$id}.log";
        $textResult = file_put_contents($textFile, $textFormat, LOCK_EX);
        
        if ($textResult === false) {
            throw new Exception("Failed to write text log file");
        }
        
        // Check if we need to create backup
        $this->checkAndCreateBackup($todayDir);
        
        return [
            'success' => true,
            'json_file' => $jsonFile,
            'text_file' => $textFile
        ];
    }
    
    /**
     * Logs error messages with improved context support
     */
    public function logError($message, $code = null, $file = null, $line = null, $context = []) {
        $today = date('Y-m-d');
        $errorLog = sprintf(
            "[%s] [%s] %s%s%s%s\n",
            date('Y-m-d H:i:s'),
            $code ?? 'ERROR',
            $message,
            $file ? " in {$file}" : '',
            $line ? " on line {$line}" : '',
            !empty($context) ? " Context: " . json_encode($context) : ''
        );
        
        $errorFile = ZenithConfig::ERRORS_DIR . "/{$today}.log";
        
        // Pastikan direktori error ada
        if (!is_dir(dirname($errorFile))) {
            $this->createDirectoryStructure([dirname($errorFile)]);
        }
        
        return @file_put_contents($errorFile, $errorLog, FILE_APPEND | LOCK_EX) !== false;
    }
    
    /**
     * Reads JSON data from file with enhanced caching
     */
    public function readJsonData($file, $defaultData = []) {
        // Periksa apakah data ada di cache dan belum kadaluarsa
        if (isset($this->cache[$file]) && 
            isset($this->cacheExpiration[$file]) && 
            $this->cacheExpiration[$file] > time()) {
            return $this->cache[$file];
        }
        
        if (file_exists($file)) {
            $content = file_get_contents($file);
            if ($content !== false) {
                $data = json_decode($content, true);
                if (is_array($data)) {
                    // Simpan di cache dengan expiration
                    $this->cache[$file] = $data;
                    $this->cacheExpiration[$file] = time() + ZenithConfig::CACHE_DURATION;
                    return $data;
                }
            }
        }
        
        // Juga cache data default
        $this->cache[$file] = $defaultData;
        $this->cacheExpiration[$file] = time() + ZenithConfig::CACHE_DURATION;
        
        return $defaultData;
    }
    
    /**
     * Writes JSON data to file with file lock and better error handling
     */
    public function writeJsonData($file, $data) {
        // Ensure directory exists
        $dir = dirname($file);
        if (!is_dir($dir)) {
            $this->createDirectoryStructure([$dir]);
        }
        
        // Buat file backup terlebih dahulu jika file sudah ada
        if (file_exists($file)) {
            $backupFile = $file . '.bak';
            copy($file, $backupFile);
        }
        
        // Write data with proper JSON formatting
        $result = file_put_contents(
            $file,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            LOCK_EX
        );
        
        if ($result === false) {
            // Restore from backup if write failed
            if (isset($backupFile) && file_exists($backupFile)) {
                copy($backupFile, $file);
            }
            throw new Exception("Failed to write data to {$file}");
        }
        
        // Remove backup after successful write
        if (isset($backupFile) && file_exists($backupFile)) {
            unlink($backupFile);
        }
        
        // Update cache
        $this->cache[$file] = $data;
        $this->cacheExpiration[$file] = time() + ZenithConfig::CACHE_DURATION;
        
        return true;
    }
    
    /**
     * Checks directory size and creates backup if needed
     */
    public function checkAndCreateBackup($directory) {
        $totalSize = $this->getDirectorySize($directory);
        
        // If directory size exceeds limit, create backup
        if ($totalSize > ZenithConfig::BACKUP_SIZE_LIMIT) {
            $this->createBackup($directory);
        }
    }
    
    /**
     * Gets total size of a directory in bytes
     */
    private function getDirectorySize($directory) {
        $totalSize = 0;
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        foreach ($files as $file) {
            $totalSize += $file->getSize();
        }
        
        return $totalSize;
    }
    
    /**
     * Creates a backup of the specified directory with improved compression
     */
    private function createBackup($directory) {
        // Create backup directory with timestamp
        $backupTime = date('d-m-Y_His');
        $dirName = basename($directory);
        $backupDir = ZenithConfig::BACKUPS_DIR . "/backup-{$dirName}-{$backupTime}";
        
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        // Create a zip archive with better compression
        $zipFile = "{$backupDir}.zip";
        $zip = new ZipArchive();
        
        if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            // Set compression level
            $zip->setCompressionIndex(0, ZipArchive::CM_DEFLATE, 9);
            
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::LEAVES_ONLY
            );
            
            foreach ($files as $file) {
                if ($file->isFile()) {
                    $filePath = $file->getRealPath();
                    $relativePath = substr($filePath, strlen($directory) + 1);
                    
                    $zip->addFile($filePath, $relativePath);
                }
            }
            
            $zip->close();
            
            // If ZIP was created successfully, clean the original directory
            if (file_exists($zipFile)) {
                $this->cleanDirectory($directory);
                
                // Batasi jumlah file backup
                $this->limitBackupFiles();
            }
        }
    }
    
    /**
     * Membatasi jumlah file backup untuk menghemat ruang disk
     */
    private function limitBackupFiles() {
        $backupFiles = glob(ZenithConfig::BACKUPS_DIR . "/*.zip");
        
        // Urutkan berdasarkan waktu modifikasi (terlama dulu)
        usort($backupFiles, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        
        // Hapus file backup terlama jika jumlahnya melebihi batas
        $countToDelete = count($backupFiles) - ZenithConfig::MAX_BACKUPS;
        if ($countToDelete > 0) {
            for ($i = 0; $i < $countToDelete; $i++) {
                unlink($backupFiles[$i]);
            }
        }
    }
    
    /**
     * Cleans a directory by removing all files (not directories)
     */
    private function cleanDirectory($directory) {
        $files = glob("{$directory}/*");
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
    }
    
    /**
     * Cleans up old log directories (based on retention policy)
     */
    public function cleanupOldLogs() {
        // Run cleanup occasionally to avoid performance impact
        if (mt_rand(1, 100) > 5) {
            return;
        }
        
        $cutoffDate = date('Y-m-d', strtotime('-' . ZenithConfig::LOG_RETENTION . ' days'));
        
        $this->cleanupDirectory(ZenithConfig::VISITORS_DIR, $cutoffDate);
        $this->cleanupDirectory(ZenithConfig::SECURITY_DIR, $cutoffDate);
    }
    
    /**
     * Cleans up old logs in a specific directory
     */
    private function cleanupDirectory($baseDir, $cutoffDate) {
        $dirs = glob("{$baseDir}/*", GLOB_ONLYDIR);
        
        foreach ($dirs as $dir) {
            $dirName = basename($dir);
            
            // If directory is older than cutoff date
            if ($dirName < $cutoffDate && is_dir($dir)) {
                // Create backup before removing
                $this->createBackup($dir);
                
                // Remove the directory after backup
                $this->removeDirectory($dir);
            }
        }
    }
    
    /**
     * Recursively removes a directory
     */
    private function removeDirectory($dir) {
        if (!is_dir($dir)) {
            return;
        }
        
        $objects = scandir($dir);
        foreach ($objects as $object) {
            if ($object === '.' || $object === '..') {
                continue;
            }
            
            $path = $dir . '/' . $object;
            if (is_dir($path)) {
                $this->removeDirectory($path);
            } else {
                unlink($path);
            }
        }
        
        rmdir($dir);
    }
}

// ======================= IP TRACKING SYSTEM =======================
/**
 * IPTracker - Monitors and analyzes IP address behavior
 */
class IPTracker {
    private $database;
    private $storage;
    
    /**
     * Constructor
     */
    public function __construct(StorageManager $storage) {
        $this->storage = $storage;
        $this->loadDatabase();
    }
    
    /**
     * Loads the IP tracking database
     */
    private function loadDatabase() {
        $defaultStructure = [
            'metadata' => [
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
                'version' => '1.4.0'
            ],
            'ips' => []
        ];
        
        $this->database = $this->storage->readJsonData(
            ZenithConfig::IP_DATABASE, 
            $defaultStructure
        );
    }
    
    /**
     * Saves the IP tracking database
     */
    private function saveDatabase() {
        // Update metadata
        $this->database['metadata']['updated'] = date('Y-m-d H:i:s');
        
        // Save to file
        $this->storage->writeJsonData(
            ZenithConfig::IP_DATABASE, 
            $this->database
        );
    }
    
    /**
     * Tracks an IP address and its activity with memory optimization
     */
    public function trackIP($ip, $url = null, $isSuspicious = false) {
        $currentTime = date('Y-m-d H:i:s');
        
        // Validate IP
        if (!filter_var($ip, FILTER_VALIDATE_IP) && $ip !== 'Unknown') {
            $ip = 'Invalid';
        }
        
        // Initialize IP data if it doesn't exist
        if (!isset($this->database['ips'][$ip])) {
            $this->database['ips'][$ip] = [
                'first_seen' => $currentTime,
                'last_seen' => $currentTime,
                'visit_count' => 0,
                'suspicious_count' => 0,
                'url_history' => [],
                'log_count' => 0
            ];
        }
        
        // Update IP data
        $this->database['ips'][$ip]['last_seen'] = $currentTime;
        $this->database['ips'][$ip]['visit_count']++;
        $this->database['ips'][$ip]['log_count']++;
        
        // Add URL to history if provided
        if (!empty($url)) {
            $this->addUrlToHistory($ip, $url, $isSuspicious);
        }
        
        // Update suspicious activity counter if needed
        if ($isSuspicious) {
            $this->database['ips'][$ip]['suspicious_count']++;
            
            // Add first suspicious timestamp if this is the first suspicious activity
            if (!isset($this->database['ips'][$ip]['first_suspicious'])) {
                $this->database['ips'][$ip]['first_suspicious'] = $currentTime;
            }
            
            // Always update last suspicious timestamp
            $this->database['ips'][$ip]['last_suspicious'] = $currentTime;
        }
        
        // Clean up database if it gets too large
        $this->cleanupDatabase();
        
        // Save database
        $this->saveDatabase();
        
        // Return data for the log
        return [
            'ip' => $ip,
            'first_seen' => $this->database['ips'][$ip]['first_seen'],
            'last_seen' => $this->database['ips'][$ip]['last_seen'],
            'visit_count' => $this->database['ips'][$ip]['visit_count'],
            'suspicious_count' => $this->database['ips'][$ip]['suspicious_count'],
            'log_count' => $this->database['ips'][$ip]['log_count'],
            'recent_urls' => array_slice($this->database['ips'][$ip]['url_history'], 0, 5),
            'is_rate_limited' => $this->isRateLimited($ip)
        ];
    }
    
    /**
     * Membersihkan database jika terlalu besar
     */
    private function cleanupDatabase() {
        // Jika database IP terlalu besar (>1000 IP), hapus entri terlama yang tidak mencurigakan
        if (count($this->database['ips']) > 1000) {
            $oldestIp = null;
            $oldestTime = null;
            
            foreach ($this->database['ips'] as $ip => $data) {
                // Lewati IP yang mencurigakan
                if ($data['suspicious_count'] > 0) {
                    continue;
                }
                
                $lastSeenTime = strtotime($data['last_seen']);
                if ($oldestTime === null || $lastSeenTime < $oldestTime) {
                    $oldestTime = $lastSeenTime;
                    $oldestIp = $ip;
                }
            }
            
            // Hapus entri IP terlama yang tidak mencurigakan
            if ($oldestIp !== null) {
                unset($this->database['ips'][$oldestIp]);
            }
        }
    }
    
    /**
     * Adds a URL to the IP's history with better memory management
     */
    private function addUrlToHistory($ip, $url, $isSuspicious) {
        // Validasi URL
        if (strlen($url) > 2000) {
            $url = substr($url, 0, 2000) . '... (truncated)';
        }
        
        // Add URL to history
        $this->database['ips'][$ip]['url_history'][] = [
            'url' => $url,
            'timestamp' => date('Y-m-d H:i:s'),
            'suspicious' => $isSuspicious
        ];
        
        // Limit history size to prevent database bloat (20 -> 15 for better performance)
        if (count($this->database['ips'][$ip]['url_history']) > 15) {
            $this->database['ips'][$ip]['url_history'] = array_slice(
                $this->database['ips'][$ip]['url_history'], 
                -15
            );
        }
    }
    
    /**
     * Checks if an IP is currently rate-limited
     */
    public function isRateLimited($ip) {
        if (!isset($this->database['ips'][$ip])) {
            return false;
        }
        
        // Get number of logs in the rate limit window
        $logs = 0;
        $windowStart = time() - ZenithConfig::RATE_LIMIT_WINDOW;
        
        foreach ($this->database['ips'][$ip]['url_history'] as $history) {
            $historyTime = strtotime($history['timestamp']);
            if ($historyTime >= $windowStart) {
                $logs++;
            }
        }
        
        return $logs > ZenithConfig::MAX_LOGS_PER_IP;
    }
    
    /**
     * Checks if a request is similar to recent ones from the same IP
     */
    public function isSimilarRequest($ip, $url) {
        if (empty($url) || !isset($this->database['ips'][$ip])) {
            return false;
        }
        
        // Check last 10 minutes for similar requests
        $timeWindow = time() - 600;
        
        foreach ($this->database['ips'][$ip]['url_history'] as $history) {
            if ($history['url'] === $url) {
                $historyTime = strtotime($history['timestamp']);
                if ($historyTime >= $timeWindow) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Gets reputation score for an IP (0-100, higher is worse)
     */
    public function getReputationScore($ip) {
        if (!isset($this->database['ips'][$ip])) {
            return 0; // No history = no bad reputation
        }
        
        $ipData = $this->database['ips'][$ip];
        
        // Base score on suspicious activity
        $score = min(100, $ipData['suspicious_count'] * 20);
        
        // Increase score based on recent suspicious activity
        if (isset($ipData['last_suspicious'])) {
            $lastSuspicious = strtotime($ipData['last_suspicious']);
            $hoursSince = (time() - $lastSuspicious) / 3600;
            
            // More recent = higher score
            if ($hoursSince < 24) {
                $score += max(0, 30 - ($hoursSince * 1.25));
            }
        }
        
        // Normalize to 0-100
        return min(100, max(0, $score));
    }
}

// ======================= URL TRACKING SYSTEM =======================
/**
 * URLTracker - Monitors and analyzes URL access patterns
 */
class URLTracker {
    private $database;
    private $storage;
    
    /**
     * Constructor
     */
    public function __construct(StorageManager $storage) {
        $this->storage = $storage;
        $this->loadDatabase();
    }
    
    /**
     * Loads the URL tracking database
     */
    private function loadDatabase() {
        $defaultStructure = [
            'metadata' => [
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
                'version' => '1.4.0'
            ],
            'urls' => []
        ];
        
        $this->database = $this->storage->readJsonData(
            ZenithConfig::URL_DATABASE, 
            $defaultStructure
        );
    }
    
    /**
     * Saves the URL tracking database
     */
    private function saveDatabase() {
        // Update metadata
        $this->database['metadata']['updated'] = date('Y-m-d H:i:s');
        
        // Save to file
        $this->storage->writeJsonData(
            ZenithConfig::URL_DATABASE, 
            $this->database
        );
    }
    
    /**
     * Analyzes a URL for tracking and threat detection with enhanced security checks
     */
    public function analyzeUrl($url) {
        // Validasi URL
        if (empty($url) || !is_string($url)) {
            return [
                'url' => 'invalid',
                'normalized' => 'invalid',
                'hostname' => '',
                'path' => '',
                'suspicious' => true,
                'reason' => 'Invalid URL format',
                'pattern' => 'validation',
                'severity' => 'medium',
                'visit_count' => 1,
                'first_seen' => date('Y-m-d H:i:s')
            ];
        }
        
        // Normalize URL for consistent tracking
        $normalizedUrl = $this->normalizeUrl($url);
        
        // Parse URL components
        $parsedUrl = parse_url($normalizedUrl);
        $hostname = $parsedUrl['host'] ?? '';
        $path = $parsedUrl['path'] ?? '';
        
        // Check for suspicious patterns
        $suspicious = false;
        $reason = '';
        $pattern = '';
        $severity = 'low';
        
        // Check for suspicious paths (admin panels, system files, etc.)
        $suspiciousPaths = [
            'admin', 'login', 'wp-admin', '.git', 'config', 'setup',
            'install', 'backup', '.env', 'wp-login', 'phpmyadmin',
            'wp-config', '.htaccess', 'passwd', '/etc/', '/var/', '/bin/'
        ];
        
        foreach ($suspiciousPaths as $suspiciousPath) {
            if (stripos($path, $suspiciousPath) !== false) {
                $suspicious = true;
                $reason = 'Suspicious path detected';
                $pattern = $suspiciousPath;
                $severity = 'medium';
                break;
            }
        }
        
        // Check for attack patterns in URL
        if (!$suspicious) {
            foreach (ZenithConfig::ATTACK_PATTERNS as $attackType => $data) {
                if (preg_match($data['pattern'], $url)) {
                    $suspicious = true;
                    $reason = 'URL contains ' . strtoupper($attackType) . ' attack pattern';
                    $pattern = $attackType;
                    $severity = $data['severity'];
                    break;
                }
            }
        }
        
        // Update URL tracking data
        $currentTime = date('Y-m-d H:i:s');
        
        if (isset($this->database['urls'][$normalizedUrl])) {
            // Update existing URL data
            $this->database['urls'][$normalizedUrl]['visit_count']++;
            $this->database['urls'][$normalizedUrl]['last_visit'] = $currentTime;
            
            // Update suspicious flag if needed
            if ($suspicious && !$this->database['urls'][$normalizedUrl]['suspicious']) {
                $this->database['urls'][$normalizedUrl]['suspicious'] = true;
                $this->database['urls'][$normalizedUrl]['reason'] = $reason;
                $this->database['urls'][$normalizedUrl]['pattern'] = $pattern;
                $this->database['urls'][$normalizedUrl]['severity'] = $severity;
            }
            
            $visitCount = $this->database['urls'][$normalizedUrl]['visit_count'];
            $firstSeen = $this->database['urls'][$normalizedUrl]['first_seen'];
        } else {
            // Add new URL
            $this->database['urls'][$normalizedUrl] = [
                'url' => $normalizedUrl,
                'hostname' => $hostname,
                'path' => $path,
                'first_seen' => $currentTime,
                'last_visit' => $currentTime,
                'visit_count' => 1,
                'suspicious' => $suspicious,
                'reason' => $reason,
                'pattern' => $pattern,
                'severity' => $severity
            ];
            
            $visitCount = 1;
            $firstSeen = $currentTime;
        }
        
        // Bersihkan database jika terlalu besar
        $this->cleanupUrlDatabase();
        
        // Save database
        $this->saveDatabase();
        
        // Return analysis results
        return [
            'url' => $url,
            'normalized' => $normalizedUrl,
            'hostname' => $hostname,
            'path' => $path,
            'suspicious' => $suspicious,
            'reason' => $reason,
            'pattern' => $pattern,
            'severity' => $severity,
            'visit_count' => $visitCount,
            'first_seen' => $firstSeen
        ];
    }
    
    /**
     * Bersihkan database URL jika terlalu besar
     */
    private function cleanupUrlDatabase() {
        // Jika database URL terlalu besar (>1000 URL), hapus entri terlama yang tidak mencurigakan
        if (count($this->database['urls']) > 1000) {
            $urlsToKeep = [];
            $suspiciousUrls = [];
            $normalUrls = [];
            
            // Pisahkan URL mencurigakan dan normal
            foreach ($this->database['urls'] as $url => $data) {
                if ($data['suspicious']) {
                    $suspiciousUrls[$url] = $data;
                } else {
                    $normalUrls[$url] = $data;
                }
            }
            
            // Urutkan URL normal berdasarkan last_visit (terlama dulu)
            uasort($normalUrls, function($a, $b) {
                return strtotime($a['last_visit']) - strtotime($b['last_visit']);
            });
            
            // Pertahankan semua URL mencurigakan
            $urlsToKeep = $suspiciousUrls;
            
            // Tambahkan URL normal terbaru hingga total 1000
            $remainingSlots = 1000 - count($urlsToKeep);
            $normalUrlsToKeep = array_slice($normalUrls, -$remainingSlots, $remainingSlots, true);
            $urlsToKeep = array_merge($urlsToKeep, $normalUrlsToKeep);
            
            // Update database
            $this->database['urls'] = $urlsToKeep;
        }
    }
    
    /**
     * Normalizes a URL for consistent tracking with improved validation
     */
    private function normalizeUrl($url) {
        // Trim whitespace and limit length
        $url = trim($url);
        if (strlen($url) > 2000) {
            $url = substr($url, 0, 2000);
        }
        
        // Add protocol if missing
        if (!preg_match('~^(?:f|ht)tps?://~i', $url)) {
            $url = 'http://' . $url;
        }
        
        // Parse URL to get components
        $parts = parse_url($url);
        if ($parts === false) {
            return 'invalid_url';
        }
        
        // Build normalized URL (without query parameters or fragments)
        $normalized = isset($parts['scheme']) ? $parts['scheme'] . '://' : 'http://';
        $normalized .= $parts['host'] ?? 'unknown';
        
        if (isset($parts['port'])) {
            $normalized .= ':' . $parts['port'];
        }
        
        if (isset($parts['path'])) {
            $normalized .= $parts['path'];
        } else {
            $normalized .= '/';
        }
        
        return $normalized;
    }
}

// ======================= SECURITY MONITOR =======================
/**
 * SecurityMonitor - Analyzes requests for potential security threats
 */
class SecurityMonitor {
    /**
     * Analyzes a request for security threats with improved pattern detection
     */
    public function analyzeRequest($logContent, $url = null, $ipInfo = null, $urlAnalysis = null) {
        $result = [
            'threat_detected' => false,
            'severity' => 'info',
            'reason' => '',
            'pattern' => '',
            'confidence' => 0
        ];
        
        // Check input validity
        if (empty($logContent) || !is_string($logContent)) {
            return array_merge($result, [
                'threat_detected' => true,
                'severity' => 'low',
                'reason' => 'Invalid log content format',
                'pattern' => 'validation',
                'confidence' => 60
            ]);
        }
        
        // Check for attacks in log content
        $contentThreat = $this->analyzeContent($logContent);
        if ($contentThreat['detected']) {
            return array_merge($result, [
                'threat_detected' => true,
                'severity' => $contentThreat['severity'],
                'reason' => $contentThreat['reason'],
                'pattern' => $contentThreat['pattern'],
                'confidence' => $contentThreat['confidence']
            ]);
        }
        
        // Check URL if suspicious
        if ($urlAnalysis && $urlAnalysis['suspicious']) {
            return array_merge($result, [
                'threat_detected' => true,
                'severity' => $urlAnalysis['severity'],
                'reason' => $urlAnalysis['reason'],
                'pattern' => $urlAnalysis['pattern'],
                'confidence' => 75
            ]);
        }
        
        // Check IP reputation
        if ($ipInfo && $ipInfo['suspicious_count'] > 2) {
            $reason = "IP has suspicious history ({$ipInfo['suspicious_count']} incidents)";
            return array_merge($result, [
                'threat_detected' => true,
                'severity' => 'medium',
                'reason' => $reason,
                'pattern' => 'reputation',
                'confidence' => min(90, 50 + ($ipInfo['suspicious_count'] * 10))
            ]);
        }
        
        return $result;
    }
    
    /**
     * Analyzes content for security threats with improved pattern detection
     */
    private function analyzeContent($content) {
        $result = [
            'detected' => false,
            'severity' => 'info',
            'reason' => '',
            'pattern' => '',
            'confidence' => 0
        ];
        
        // Check for attack patterns
        foreach (ZenithConfig::ATTACK_PATTERNS as $type => $attack) {
            if (preg_match($attack['pattern'], $content)) {
                $result['detected'] = true;
                $result['severity'] = $attack['severity'];
                $result['reason'] = "Detected potential {$type} attack in content";
                $result['pattern'] = $type;
                $result['confidence'] = 85;
                return $result;
            }
        }
        
        // Check for other suspicious patterns
        $suspiciousPatterns = [
            'password' => '/password|passwd|pass|pwd/i',
            'credential' => '/credential|auth|login|token|key/i',
            'personal' => '/ssn|social security|passport|license|id.number/i',
            'payment' => '/credit.card|cvv|cvc|expir(y|ation)|payment/i'
        ];
        
        foreach ($suspiciousPatterns as $type => $pattern) {
            if (preg_match($pattern, $content)) {
                $result['detected'] = true;
                $result['severity'] = 'medium';
                $result['reason'] = "Content may contain sensitive {$type} information";
                $result['pattern'] = $type;
                $result['confidence'] = 65;
                return $result;
            }
        }
        
        return $result;
    }
    
    /**
     * Sanitizes log content to prevent log injection with improved security
     */
    public function sanitizeContent($content) {
        if (is_array($content)) {
            // Recursively sanitize arrays
            foreach ($content as $key => $value) {
                $content[$key] = $this->sanitizeContent($value);
            }
            return $content;
        }
        
        // Sanitize strings
        if (is_string($content)) {
            // Limit string length
            if (strlen($content) > 10000) {
                $content = substr($content, 0, 10000) . '... (truncated)';
            }
            
            // Remove control characters
            $content = preg_replace('/[\x00-\x1F\x7F]/u', '', $content);
            
            // Encode HTML entities
            return htmlspecialchars($content, ENT_QUOTES, 'UTF-8');
        }
        
        return $content;
    }
}

// ======================= MAIN LOGGER CLASS =======================
/**
 * ZenithLogger - Main class for processing and storing logs
 */
class ZenithLogger {
    private $requestData;
    private $startTime;
    private $logId;
    private $clientInfo;
    private $storage;
    private $ipTracker;
    private $urlTracker;
    private $securityMonitor;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->startTime = microtime(true);
        date_default_timezone_set(ZenithConfig::TIMEZONE);
        $this->logId = $this->generateUUID();
        
        // Initialize components
        $this->storage = new StorageManager();
        $this->ipTracker = new IPTracker($this->storage);
        $this->urlTracker = new URLTracker($this->storage);
        $this->securityMonitor = new SecurityMonitor();
        
        // Get client information
        $this->clientInfo = $this->getClientInfo();
        
        // Initialize storage
        $this->storage->initializeDirectories();
        $this->storage->cleanupOldLogs();
    }
    
    /**
     * Processes incoming log requests with improved validation
     */
    public function processRequest() {
        try {
            // Get JSON request data
            $input = file_get_contents('php://input');
            
            if (empty($input)) {
                throw new Exception('Empty input data', 400);
            }
            
            // Limit request size
            if (strlen($input) > 1024 * 1024) { // 1MB limit
                throw new Exception('Request too large', 413);
            }
            
            // Parse JSON
            $this->requestData = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON format: ' . json_last_error_msg(), 400);
            }
            
            // Validate required fields
            if (!isset($this->requestData['log']) || empty($this->requestData['log'])) {
                throw new Exception('Log content is required', 400);
            }
            
            // Sanitize data
            $this->requestData['log'] = $this->securityMonitor->sanitizeContent($this->requestData['log']);
            
            // Check rate limiting
            if ($this->ipTracker->isRateLimited($this->clientInfo['ip'])) {
                throw new Exception('Rate limit exceeded for this IP', 429);
            }
            
            // Process and save log
            $this->saveLog();
            
            // Send success response
            $this->sendResponse('success', 'Log recorded successfully', [
                'log_id' => $this->logId,
                'execution_time' => $this->getExecutionTime()
            ]);
            
        } catch (Exception $e) {
            $this->handleError($e);
        }
    }
    
    /**
     * Saves log data with improved duplicate detection
     */
    private function saveLog() {
        // Extract log content
        $logContent = $this->requestData['log'];
        $visitorData = $this->requestData['visitorData'] ?? [];
        
        // Get URL if available
        $url = $this->getVisitedUrl($visitorData);
        
        // Track and analyze URL and IP
        $urlAnalysis = !empty($url) ? $this->urlTracker->analyzeUrl($url) : null;
        $ipInfo = $this->ipTracker->trackIP($this->clientInfo['ip'], $url);
        
        // Security check
        $securityCheck = $this->securityMonitor->analyzeRequest(
            $logContent, 
            $url, 
            $ipInfo, 
            $urlAnalysis
        );
        
        // Prepare log data structure
        $logData = [
            'id' => $this->logId,
            'timestamp' => time(),
            'datetime' => [
                'date' => date('Y-m-d'),
                'time' => date('H:i:s'),
                'day' => ZenithConfig::translateDay(date('l')),
                'month' => ZenithConfig::translateMonth(date('F')),
                'year' => date('Y')
            ],
            'client' => $this->clientInfo,
            'content' => $logContent,
            'url' => $url,
            'security' => [
                'threat_detected' => $securityCheck['threat_detected'],
                'severity' => $securityCheck['severity'],
                'reason' => $securityCheck['reason'],
                'pattern' => $securityCheck['pattern'],
                'confidence' => $securityCheck['confidence']
            ],
            'visitor_data' => $visitorData,
            'url_analysis' => $urlAnalysis,
            'ip_info' => $ipInfo
        ];
        
        // Format log as text
        $textLog = $this->formatTextLog($logData);
        
        // Determine log category
        $category = $securityCheck['threat_detected'] ? 'security' : 'visitors';
        
        // Skip duplicate logs unless they are security incidents
        $isDuplicate = !$securityCheck['threat_detected'] && 
                      $this->ipTracker->isSimilarRequest($this->clientInfo['ip'], $url);
        
        // Save log if not a duplicate or if it's a security incident
        if (!$isDuplicate || $securityCheck['threat_detected']) {
            $this->storage->saveLogData($logData, $textLog, $category);
        }
    }
    
    /**
     * Formats log data as text with improved readability
     */
    private function formatTextLog($logData) {
        $separator = str_repeat("=", 80) . "\n";
        $subSeparator = str_repeat("-", 80) . "\n";
        
        // Start with header
        $log = $separator;
        $log .= "ZENITH LOG #{$logData['id']}\n";
        $log .= $separator;
        
        // Basic information
        $log .= "INFORMASI DASAR:\n";
        $log .= $subSeparator;
        $log .= sprintf("%-15s: %s\n", "Tanggal", "{$logData['datetime']['day']}, {$logData['datetime']['date']}");
        $log .= sprintf("%-15s: %s\n", "Waktu", "{$logData['datetime']['time']}");
        $log .= sprintf("%-15s: %s\n", "IP", "{$logData['client']['ip']}");
        
        // Truncate user agent if too long
        $userAgent = $logData['client']['agent'];
        if (strlen($userAgent) > 60) {
            $userAgent = substr($userAgent, 0, 57) . '...';
        }
        $log .= sprintf("%-15s: %s\n", "User Agent", $userAgent);
        
        // URL if available
        if (!empty($logData['url'])) {
            $displayUrl = $logData['url'];
            if (strlen($displayUrl) > 60) {
                $displayUrl = substr($displayUrl, 0, 57) . '...';
            }
            $log .= sprintf("%-15s: %s\n", "URL", $displayUrl);
        }
        
        // Security status
        $securityStatus = $logData['security']['threat_detected'] 
            ? "⚠️ ALERT - {$logData['security']['severity']}" 
            : "✅ SAFE";
        $log .= sprintf("%-15s: %s\n", "Status", $securityStatus);
        
        // Add visitor information if available
        if (!empty($logData['visitor_data'])) {
            $visitor = $logData['visitor_data'];
            $log .= "\nINFORMASI PENGUNJUNG:\n";
            $log .= $subSeparator;
            
            if (isset($visitor['browser'])) {
                $log .= sprintf("%-15s: %s\n", "Browser", $visitor['browser']);
            }
            
            if (isset($visitor['deviceName'])) {
                $log .= sprintf("%-15s: %s\n", "Perangkat", $visitor['deviceName']);
            }
            
            if (isset($visitor['os'])) {
                $log .= sprintf("%-15s: %s\n", "OS", $visitor['os']);
            }
            
            // Location information
            if (isset($visitor['location'])) {
                $location = $visitor['location'];
                $locationStr = ($location['city'] ?? 'Unknown') . ", " . 
                             ($location['region'] ?? 'Unknown') . ", " . 
                             ($location['country'] ?? 'Unknown');
                $log .= sprintf("%-15s: %s\n", "Lokasi", $locationStr);
            }
            
            // Provider/ISP
            if (isset($visitor['isp'])) {
                $log .= sprintf("%-15s: %s\n", "Provider", $visitor['isp']);
            }
        }
        
        // Add IP history information
        $log .= "\nRIWAYAT IP:\n";
        $log .= $subSeparator;
        $log .= sprintf("%-20s: %d\n", "Total Kunjungan", $logData['ip_info']['visit_count']);
        $log .= sprintf("%-20s: %s\n", "Pertama Terlihat", $logData['ip_info']['first_seen']);
        
        // Recent URLs from this IP
        if (!empty($logData['ip_info']['recent_urls'])) {
            $log .= "\nURL TERBARU DARI IP INI:\n";
            foreach (array_slice($logData['ip_info']['recent_urls'], 0, 3) as $idx => $urlData) {
                $urlDisplay = $urlData['url'];
                if (strlen($urlDisplay) > 60) {
                    $urlDisplay = substr($urlDisplay, 0, 57) . '...';
                }
                $log .= sprintf("%d. %s (%s)\n", $idx + 1, $urlDisplay, $urlData['timestamp']);
            }
        }
        
        // Add security alert details if detected
        if ($logData['security']['threat_detected']) {
            $log .= "\nPERINGATAN KEAMANAN:\n";
            $log .= $subSeparator;
            $log .= sprintf("%-15s: %s\n", "Tingkat", strtoupper($logData['security']['severity']));
            $log .= sprintf("%-15s: %s\n", "Alasan", $logData['security']['reason']);
            
            if (!empty($logData['security']['pattern'])) {
                $log .= sprintf("%-15s: %s\n", "Pola", $logData['security']['pattern']);
            }
            
            $log .= sprintf("%-15s: %d%%\n", "Keyakinan", $logData['security']['confidence']);
        }
        
        // Log content
        $log .= "\nISI LOG:\n";
        $log .= $subSeparator;
        $log .= wordwrap($logData['content'], 80, "\n") . "\n";
        $log .= $separator;
        
        return $log;
    }
    
    /**
     * Gets the URL that was visited
     */
    private function getVisitedUrl($visitorData) {
        // First try to get from visitor data
        if (isset($visitorData['url']) && !empty($visitorData['url'])) {
            return $visitorData['url'];
        }
        
        // Fall back to HTTP referer
        return $this->clientInfo['referer'] !== 'Unknown' ? $this->clientInfo['referer'] : '';
    }
    
    /**
     * Gets client information (IP, User-Agent, etc.) with improved IP detection
     */
    private function getClientInfo() {
        return [
            'ip' => $this->getClientIp(),
            'agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'referer' => $_SERVER['HTTP_REFERER'] ?? 'Unknown',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
            'host' => $_SERVER['HTTP_HOST'] ?? 'Unknown'
        ];
    }
    
    /**
     * Gets the client's real IP address with strict validation
     */
    private function getClientIp() {
        $ipHeaders = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_REAL_IP',        // Nginx proxy
            'HTTP_X_FORWARDED_FOR',  // Common proxy/load balancer header
            'HTTP_CLIENT_IP',        // Some proxies
            'HTTP_X_FORWARDED',      // General forwarded headers
            'HTTP_FORWARDED_FOR',    // Similar to X_FORWARDED_FOR
            'HTTP_FORWARDED',        // RFC7239 standard
            'REMOTE_ADDR'            // Fallback to direct connection
        ];
        
        foreach ($ipHeaders as $header) {
            if (isset($_SERVER[$header])) {
                // Handle comma-separated lists (common in X-Forwarded-For)
                $ips = explode(',', $_SERVER[$header]);
                $ip = trim($ips[0]);
                
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return 'Unknown';
    }
    
    /**
     * Generates a UUID v4 with improved random bytes handling
     */
    private function generateUUID() {
        try {
            $data = random_bytes(16);
        } catch (Exception $e) {
            // Fallback to mt_rand if random_bytes is not available
            $data = '';
            for ($i = 0; $i < 16; $i++) {
                $data .= chr(mt_rand(0, 255));
            }
        }
        
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
    
    /**
     * Gets execution time in milliseconds
     */
    private function getExecutionTime() {
        return round((microtime(true) - $this->startTime) * 1000, 2) . 'ms';
    }
    
    /**
     * Sends JSON response with proper header handling
     */
    private function sendResponse($status, $message, $data = []) {
        $response = array_merge([
            'status' => $status,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ], $data);
        
        // Pastikan header masih bisa dikirim
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    /**
     * Handles errors with improved logging
     */
    private function handleError(Exception $e) {
        $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
        
        // Log error
        $this->storage->logError(
            $e->getMessage(),
            $code,
            $e->getFile(),
            $e->getLine(),
            ['trace' => $e->getTraceAsString()]
        );
        
        // Send response
        if (!headers_sent()) {
            http_response_code($code);
        }
        
        $this->sendResponse('error', $e->getMessage(), [
            'code' => $code,
            'execution_time' => $this->getExecutionTime()
        ]);
    }
}

// Initialize and run the logger
try {
    // Set konstanta untuk akses aman melalui include
    if (!defined('ZENITH_SECURE_ACCESS')) {
        define('ZENITH_SECURE_ACCESS', true);
    }
    
    $logger = new ZenithLogger();
    $logger->processRequest();
} catch (Throwable $e) {
    // Failsafe error handling (catch semua tipe error termasuk Fatal Error)
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=UTF-8');
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => 'Critical error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}