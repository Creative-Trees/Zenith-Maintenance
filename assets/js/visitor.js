// Fetch visitor data using Geolocation API and fallback to IP info service
async function fetchVisitorData() {
    try {
        // Try to get location using Geolocation API
        const geolocationData = await getGeolocation();
        if (geolocationData) {
            return geolocationData;
        }

        // Fallback to IP-based location using ipinfo.io
        const ipInfoData = await fetchIpInfo();
        return ipInfoData;
    } catch (error) {
        console.error('Failed to fetch visitor data:', error.message);

        // Fallback data for local testing
        return {
            timestamp: new Date().toLocaleString(),
            deviceName: navigator.userAgent || 'Unknown Device',
            browser: detectBrowser(),
            ipAddress: '127.0.0.1',
            location: {
                city: 'Localhost',
                region: 'Local',
                country: 'Local',
                coordinates: '0,0',
                mapLink: '#' // No link for localhost
            },
            isp: 'Local ISP',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            vpnDetected: false,
        };
    }
}

// Get location using Geolocation API and reverse geocode it
async function getGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Geolocation is not supported by this browser.'));
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;

                // Ensure accuracy is within 1 meter
                if (accuracy > 1) {
                    console.warn(`Location accuracy is ${accuracy} meters, which is not within the desired range.`);
                }

                // Reverse geocode to get city, region, and country
                const locationData = await reverseGeocode(latitude, longitude);

                resolve({
                    timestamp: new Date().toLocaleString(),
                    deviceName: navigator.userAgent || 'Unknown Device',
                    browser: detectBrowser(),
                    ipAddress: 'Geolocation API', // No IP address from Geolocation API
                    location: {
                        city: locationData.city,
                        region: locationData.region,
                        country: locationData.country,
                        coordinates: `${latitude},${longitude}`,
                        mapLink: `https://www.google.com/maps?q=${latitude},${longitude}` // Link to Google Maps
                    },
                    isp: 'N/A',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    vpnDetected: false,
                });
            },
            (error) => {
                console.warn('Geolocation API failed:', error.message);
                reject(error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Request high accuracy for location
        );
    });
}

// Reverse geocode coordinates to get city, region, and country using Nominatim API
async function reverseGeocode(latitude, longitude) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch reverse geocoding data: ${response.status}`);
        }

        const data = await response.json();

        // Extract city, region, and country from the response
        const city = data.address.city || data.address.town || data.address.village || 'Unknown City';
        const region = data.address.state || 'Unknown Region';
        const country = data.address.country || 'Unknown Country';

        return { city, region, country };
    } catch (error) {
        console.error('Reverse geocoding failed:', error.message);
        return { city: 'Unknown City', region: 'Unknown Region', country: 'Unknown Country' };
    }
}

// Fetch location data from ipinfo.io
async function fetchIpInfo() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout after 5 seconds

    const response = await fetch("https://ipinfo.io/json?token=6fc5638cf891d2", {
        signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();

    // Validate received data
    if (!data.ip || !data.loc) {
        throw new Error('Incomplete data received from API');
    }

    const [latitude, longitude] = data.loc.split(',');

    return {
        timestamp: new Date().toLocaleString(),
        deviceName: navigator.userAgent || 'Unknown Device',
        browser: detectBrowser(),
        ipAddress: data.ip,
        location: {
            city: data.city || 'Unknown City',
            region: data.region || 'Unknown Region',
            country: data.country || 'Unknown Country',
            coordinates: `${latitude},${longitude}`,
            mapLink: `https://www.google.com/maps?q=${latitude},${longitude}` // Link to Google Maps
        },
        isp: data.org || 'Unknown ISP',
        timezone: data.timezone || 'Unknown Timezone',
        vpnDetected: data.bogon || false,
    };
}

// Detect browser name
function detectBrowser() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome")) return "Google Chrome";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("Firefox")) return "Mozilla Firefox";
    if (userAgent.includes("Edge")) return "Microsoft Edge";
    return "Unknown Browser";
}

// Log visitor data to the page and save to file
async function logVisitorData() {
    const visitorData = await fetchVisitorData();
    if (!visitorData) return;

    const logEntry = `
==============================================================
📅 Hari: ${new Date().toLocaleDateString('id-ID', { weekday: 'long' })}
📅 Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
⏰ Waktu: ${new Date().toLocaleTimeString('id-ID')}
==============================================================
💻 Perangkat: ${visitorData.deviceName}
🌐 Browser: ${visitorData.browser}
🌍 IP Address: ${visitorData.ipAddress}
📍 Lokasi: 
  - Kota: ${visitorData.location.city}
  - Provinsi: ${visitorData.location.region}
  - Negara: ${visitorData.location.country}
  - Koordinat: ${visitorData.location.coordinates}
  - 🔗 <a href="${visitorData.location.mapLink}" target="_blank" style="color:blue; text-decoration:underline;">Lihat Lokasi di Peta</a>
📡 Provider: ${visitorData.isp}
🕒 Zona Waktu: ${visitorData.timezone}
🛡️ VPN Terdeteksi: ${visitorData.vpnDetected ? "Ya" : "Tidak"}
==============================================================
`;

    displayVisitorData(logEntry);
    saveLogToFile(visitorData);
}

// Display visitor data on the page
function displayVisitorData(logEntry) {
    const visitorDataElement = document.getElementById('visitor-data');
    if (visitorDataElement) {
        visitorDataElement.innerHTML = logEntry.replace(/\n/g, "<br>");
    } else {
        console.warn("Element with id 'visitor-data' not found.");
    }
}

// Save visitor data to IP.txt
function saveLogToFile(visitorData) {
    const logEntry = `
[${visitorData.timestamp}]
- IP Address: ${visitorData.ipAddress}
- Device: ${visitorData.deviceName}
- Browser: ${visitorData.browser}
- Location: 
  - Kota: ${visitorData.location.city}
  - Provinsi: ${visitorData.location.region}
  - Negara: ${visitorData.location.country}
  - Koordinat: ${visitorData.location.coordinates}
  - 🌍 Google Maps: ${visitorData.location.mapLink}
- ISP: ${visitorData.isp}
- Timezone: ${visitorData.timezone}
- VPN Detected: ${visitorData.vpnDetected ? "Yes" : "No"}
`;

    // Send log to server-side PHP script
    fetch('/save-log.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: logEntry }),
    }).then((response) => {
        if (response.ok) {
            console.log('Log saved successfully');
        } else {
            console.error('Failed to save log:', response.statusText);
        }
    }).catch((error) => console.error('Failed to save log:', error.message));
}

// Initialize logging of visitor data
document.addEventListener('DOMContentLoaded', logVisitorData);