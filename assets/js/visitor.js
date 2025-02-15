// Fetch visitor data from IP info service
async function fetchVisitorData() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout after 5 seconds

        const response = await fetch("https://ipinfo.io/json?token=6fc5638cf891d2", {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data); // Log the received data

        const deviceName = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Device';
        const ipAddress = data.ip;
        const location = {
            city: data.city,
            region: data.region,
            country: data.country,
            coordinates: data.loc,
        };
        const isp = data.org;
        const timezone = data.timezone;
        const vpnDetected = data.bogon || false;

        return {
            timestamp: new Date().toLocaleString("en-US", { timeZone: timezone }),
            deviceName,
            ipAddress,
            location,
            isp,
            timezone,
            vpnDetected,
        };
    } catch (error) {
        console.error('Failed to fetch visitor data:', error.message);
        return null;
    }
}

// Log visitor data to the page and save to file
async function logVisitorData() {
    const visitorData = await fetchVisitorData();
    if (!visitorData) return;

    const logEntry = `
==================================================
Tanggal & Waktu: ${visitorData.timestamp}
Nama Perangkat: ${visitorData.deviceName}
IP Address: ${visitorData.ipAddress}
Lokasi: 
  - Kota: ${visitorData.location.city}
  - Provinsi: ${visitorData.location.region}
  - Negara: ${visitorData.location.country}
  - Koordinat: ${visitorData.location.coordinates}
Provider: ${visitorData.isp}
Zona Waktu: ${visitorData.timezone}
VPN Detected: ${visitorData.vpnDetected ? "Yes" : "No"}
==================================================
`;

    const visitorDataElement = document.getElementById('visitor-data');
    if (visitorDataElement) {
        visitorDataElement.textContent = logEntry;
    } else {
        console.warn("Element with id 'visitor-data' not found.");
    }

    saveLogToFile(logEntry);
}

// Save log entry to a file (server-side implementation required)
function saveLogToFile(logEntry) {
    const fileName = "IP.txt";

    if (typeof require !== "undefined") {
        try {
            const fs = require("fs");
            fs.appendFile(fileName, logEntry, (err) => {
                if (err) {
                    console.error("Error saving log entry:", err);
                } else {
                    console.log("Log entry saved successfully.");
                }
            });
        } catch (error) {
            console.error("Error requiring fs module:", error.message);
        }
    } else {
        console.warn("File saving requires server-side implementation.");
        // Implement server-side logging here
    }
}

// Initialize logging of visitor data
document.addEventListener('DOMContentLoaded', logVisitorData);