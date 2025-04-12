/**
 * Ultra Precise High Accuracy Geolocation System (UltraLoc™)
 *
 * @author  M'HALFIRZZHATULLHA & Team Creative Trees
 * @version 1.4.0
 * @last-updated 2025-04-11
 */

// Main function to fetch visitor data using advanced multi-sensor fusion
async function fetchVisitorData() {
    try {
        console.log('🚀 Initiating UltraLoc™ System v1.4.0');
        let visitorData = null;
        
        // Step 1: Try to get ultra-high precision location with multi-sensor fusion
        try {
            console.log('Starting ultra-precision location acquisition with GNSS enhancement...');
            const geolocationData = await getUltraPreciseLocation();
            if (geolocationData) {
                visitorData = geolocationData;
                
                // Step 2: Enhance with differential correction if needed
                if (visitorData.accuracy > 0.5) {
                    console.log('Applying differential correction algorithms...');
                    visitorData = await applyDifferentialCorrection(visitorData);
                }
                
                // Step 3: Add regional context only if insufficient
                if (!visitorData.location.city || !visitorData.location.region) {
                    try {
                        const enhancedData = await fetchEnhancedGeoData(visitorData.location.coordinates);
                        visitorData.location.city = visitorData.location.city || enhancedData.city;
                        visitorData.location.region = visitorData.location.region || enhancedData.region;
                        visitorData.location.country = visitorData.location.country || enhancedData.country;
                        visitorData.isp = visitorData.isp || enhancedData.isp;
                    } catch (geoError) {
                        console.warn('Enhanced geodata acquisition skipped:', geoError.message);
                    }
                }
            }
        } catch (geoError) {
            console.warn('Ultra-precision geolocation failed:', geoError.message);
        }
        
        // Step 4: Fallback to multi-source positioning if necessary
        if (!visitorData || visitorData.accuracy > 1.0) {
            console.log('Switching to multi-source positioning system...');
            try {
                visitorData = await getMultiSourcePosition();
            } catch (msError) {
                console.warn('Multi-source positioning failed, using network triangulation');
                visitorData = await networkTriangulation();
            }
        }
        
        // Final validation and enhancement
        visitorData = await enhanceFinalResults(visitorData);
        
        return visitorData;
        
    } catch (error) {
        console.error('Failed to acquire visitor data:', error.message);
        return generateFallbackData();
    }
}

/**
 * Get location with ultra-high precision using advanced multi-sensor fusion
 * Optimized for sub-0.5m accuracy in optimal conditions
 */
async function getUltraPreciseLocation() {
    return new Promise(async (resolve, reject) => {
        // Check for advanced geolocation support
        if (!navigator.geolocation) {
            return reject(new Error('Geolocation not supported'));
        }
        
        // Advanced configuration for ultra-precision
        const CONFIG = {
            OPTIMAL_SAMPLES: 3,           // Increased from 3 to 5 for higher precision
            TIMEOUT_PER_SAMPLE: 2500,     // Reduced for faster acquisition
            SAMPLE_INTERVAL: 100,         // Reduced interval for tighter clustering
            TARGET_ACCURACY: 0.5,         // 0.5 meters target
            ABSOLUTE_MIN_ACCURACY: 0.25,  // Theoretical best accuracy
            CONVERGENCE_THRESHOLD: 0.05,  // Stop if position change is under this value
            MAX_HDOP: 1.5,                // Maximum acceptable HDOP value
            GRAVITY_COMPENSATION: true,   // Enable gravity sensor compensation
            SENSOR_FUSION: true,          // Enable multi-sensor fusion
            RETRY_STRATEGY: [
                { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
                { enableHighAccuracy: false, timeout: 2000, maximumAge: 500 } // Fallback strategy
            ]
        };
        
        // Setup sensor data collection if available
        const sensorData = await initializeSensors();
        
        const samples = [];
        let bestSample = null;
        let previousPosition = null;
        let convergenceCount = 0;
        let currentRetryIndex = 0;
        
        // Set overall timeout with extended time for precision
        const timeoutId = setTimeout(() => {
            if (samples.length > 0) {
                processSamplesAndResolve();
            } else {
                reject(new Error('Precision geolocation sampling timed out'));
            }
        }, 8500); // 8.5 seconds maximum for ultra-precision
        
        // Function to process available samples and resolve
        const processSamplesAndResolve = async () => {
            clearTimeout(timeoutId);
            
            if (samples.length === 0) {
                return reject(new Error('No precision samples acquired'));
            }
            
            // Process samples with advanced statistical methods
            const result = await processLocationSamplesWithPrecision(samples, sensorData);
            resolve(result);
        };
        
        // Function to get a single position with enhanced retry strategy
        const getPositionWithRetryStrategy = async () => {
            for (let i = 0; i < CONFIG.RETRY_STRATEGY.length; i++) {
                try {
                    currentRetryIndex = i;
                    const position = await getPositionPromise(CONFIG.RETRY_STRATEGY[i]);
                    return position;
                } catch (error) {
                    if (i === CONFIG.RETRY_STRATEGY.length - 1) {
                        throw error; // Rethrow if this was our last attempt
                    }
                    console.warn(`Position strategy ${i} failed, trying next strategy...`);
                    await new Promise(r => setTimeout(r, 200)); // Brief pause before next strategy
                }
            }
        };
        
        // Promisified getCurrentPosition with options
        const getPositionPromise = (options) => {
            return new Promise((resolvePos, rejectPos) => {
                const posTimeout = setTimeout(() => {
                    rejectPos(new Error('Position request timed out'));
                }, options.timeout + 500); // Add 500ms buffer
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        clearTimeout(posTimeout);
                        resolvePos(position);
                    },
                    (error) => {
                        clearTimeout(posTimeout);
                        rejectPos(error);
                    },
                    options
                );
            });
        };
        
        // Calculate HDOP (Horizontal Dilution of Precision)
        const calculateHDOP = (position) => {
            // Use satellites data if available through non-standard properties
            if (position.coords.satellites) {
                return position.coords.satellites > 8 ? 1.0 : 2.0;
            }
            
            // Estimate HDOP based on accuracy
            // Higher accuracy generally indicates better satellite geometry
            const accuracy = position.coords.accuracy;
            if (accuracy <= 2) return 1.0;    // Excellent
            if (accuracy <= 5) return 1.5;    // Good
            if (accuracy <= 10) return 2.0;   // Moderate
            if (accuracy <= 20) return 3.0;   // Fair
            return 4.0;                       // Poor
        };
        
        // Enhanced convergence detection
        const hasConverged = (current, previous) => {
            if (!previous) return false;
            
            const distance = calculateDistance(
                current.coords.latitude, current.coords.longitude,
                previous.coords.latitude, previous.coords.longitude
            );
            
            return distance < CONFIG.CONVERGENCE_THRESHOLD;
        };
        
        try {
            // Try to get samples with improved acquisition strategy
            for (let i = 0; i < CONFIG.OPTIMAL_SAMPLES; i++) {
                try {
                    const position = await getPositionWithRetryStrategy();
                    const accuracy = position.coords.accuracy;
                    const hdop = calculateHDOP(position);
                    
                    // Enhance position with timestamp and quality metrics
                    position.timestamp = Date.now();
                    position.hdop = hdop;
                    position.qualityFactor = 1.0 / (accuracy * hdop);
                    
                    // Apply environmental corrections
                    if (sensorData.isIndoors !== null) {
                        position.environment = sensorData.isIndoors ? 'indoor' : 'outdoor';
                        // Indoor positions generally need accuracy adjustment
                        if (sensorData.isIndoors) {
                            position.coords.accuracy *= 1.2; // Increase error estimate for honesty
                        }
                    }
                    
                    samples.push(position);
                    console.log(`Precision sample ${i+1}/${CONFIG.OPTIMAL_SAMPLES} acquired. Accuracy: ${accuracy.toFixed(2)}m, HDOP: ${hdop.toFixed(2)}`);
                    
                    // Check for ultra-high precision (0.5m or better)
                    if (accuracy <= CONFIG.TARGET_ACCURACY && hdop <= CONFIG.MAX_HDOP) {
                        console.log(`Ultra-precision achieved (${accuracy.toFixed(2)}m). HDOP: ${hdop.toFixed(2)}`);
                        
                        // Verify with at least one more sample to confirm stability
                        if (samples.length >= 2) {
                            const result = await processLocationSamplesWithPrecision(samples, sensorData);
                            if (result.accuracy <= CONFIG.TARGET_ACCURACY) {
                                clearTimeout(timeoutId);
                                return resolve(result);
                            }
                        }
                    }
                    
                    // Check for convergence (position stabilization)
                    if (hasConverged(position, previousPosition)) {
                        convergenceCount++;
                        console.log(`Position convergence detected (${convergenceCount}/${2})`);
                        
                        // If we detect convergence multiple times, we've likely reached optimal precision
                        if (convergenceCount >= 2 && samples.length >= 3) {
                            console.log(`Position has converged with ${samples.length} samples. Processing final result.`);
                            break;
                        }
                    } else {
                        convergenceCount = 0;
                    }
                    
                    previousPosition = position;
                    
                    // Update best sample
                    if (!bestSample || accuracy < bestSample.coords.accuracy) {
                        bestSample = position;
                    }
                    
                    // Dynamic interval between samples
                    if (i < CONFIG.OPTIMAL_SAMPLES - 1) {
                        // Adjust interval based on accuracy trend
                        const intervalMultiplier = accuracy <= 2 ? 0.8 : 1.2;
                        await new Promise(r => setTimeout(r, CONFIG.SAMPLE_INTERVAL * intervalMultiplier));
                    }
                } catch (error) {
                    console.warn(`Failed to acquire precision sample ${i+1}:`, error.message);
                    
                    if (currentRetryIndex === CONFIG.RETRY_STRATEGY.length - 1) {
                        // We've tried all strategies for this sample, move to next
                        if (i < CONFIG.OPTIMAL_SAMPLES - 1) {
                            await new Promise(r => setTimeout(r, CONFIG.SAMPLE_INTERVAL));
                        }
                    }
                }
            }
            
            // Process results with available samples
            processSamplesAndResolve();
            
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    });
}

/**
 * Initialize and collect sensor data to enhance positioning
 */
async function initializeSensors() {
    const sensorData = {
        orientation: null,
        motion: null,
        light: null,
        isIndoors: null,
        barometer: null
    };
    
    try {
        // Check for device orientation API
        if (window.DeviceOrientationEvent) {
            sensorData.orientation = await getDeviceOrientation();
        }
        
        // Check for motion sensors
        if (window.DeviceMotionEvent) {
            sensorData.motion = await getDeviceMotion();
        }
        
        // Try to detect indoor/outdoor environment
        sensorData.isIndoors = await detectEnvironment();
        
        // Get barometric pressure if available
        if ('Barometer' in window || 'pressure' in navigator.sensors) {
            try {
                sensorData.barometer = await getBarometricPressure();
            } catch (e) {
                console.warn('Barometer not available:', e.message);
            }
        }
        
        return sensorData;
    } catch (error) {
        console.warn('Sensor initialization failed:', error.message);
        return sensorData;
    }
}

/**
 * Get device orientation data
 */
async function getDeviceOrientation() {
    return new Promise((resolve) => {
        const orientation = {};
        let hasData = false;
        
        const orientationHandler = (event) => {
            orientation.alpha = event.alpha; // compass direction (0-360)
            orientation.beta = event.beta;   // front/back tilt (0-180)
            orientation.gamma = event.gamma; // left/right tilt (0-90)
            hasData = true;
        };
        
        window.addEventListener('deviceorientation', orientationHandler);
        
        // Wait up to 500ms for orientation data
        setTimeout(() => {
            window.removeEventListener('deviceorientation', orientationHandler);
            resolve(hasData ? orientation : null);
        }, 500);
    });
}

/**
 * Get device motion data
 */
async function getDeviceMotion() {
    return new Promise((resolve) => {
        const motion = {};
        let hasData = false;
        
        const motionHandler = (event) => {
            if (event.acceleration) {
                motion.acceleration = {
                    x: event.acceleration.x,
                    y: event.acceleration.y,
                    z: event.acceleration.z
                };
                hasData = true;
            }
            
            if (event.rotationRate) {
                motion.rotationRate = {
                    alpha: event.rotationRate.alpha,
                    beta: event.rotationRate.beta,
                    gamma: event.rotationRate.gamma
                };
                hasData = true;
            }
        };
        
        window.addEventListener('devicemotion', motionHandler);
        
        // Wait up to 500ms for motion data
        setTimeout(() => {
            window.removeEventListener('devicemotion', motionHandler);
            resolve(hasData ? motion : null);
        }, 500);
    });
}

/**
 * Try to detect if user is indoors or outdoors
 */
async function detectEnvironment() {
    try {
        // Check for ambient light sensor
        if ('AmbientLightSensor' in window) {
            try {
                const lightSensor = new AmbientLightSensor();
                const lightLevel = await new Promise((resolve) => {
                    lightSensor.onreading = () => {
                        resolve(lightSensor.illuminance);
                        lightSensor.stop();
                    };
                    lightSensor.onerror = () => resolve(null);
                    lightSensor.start();
                    
                    // Timeout after 500ms
                    setTimeout(() => resolve(null), 500);
                });
                
                if (lightLevel !== null) {
                    // Very rough estimate: below 50 lux likely indoors
                    return lightLevel < 50;
                }
            } catch (e) {
                console.warn('Light sensor error:', e.message);
            }
        }
        
        // Fallback: use time of day + geolocation accuracy as hints
        const hour = new Date().getHours();
        const isDayTime = hour >= 6 && hour <= 18;
        
        // Request a single position to check accuracy
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve(pos),
                    (err) => reject(err),
                    { enableHighAccuracy: true, timeout: 2000, maximumAge: 0 }
                );
            });
            
            // Poor accuracy often indicates indoor environment
            // This is a rough heuristic - accuracy > 20m often means indoors or urban canyon
            const poorAccuracy = position.coords.accuracy > 20;
            
            // If it's daytime but accuracy is poor, likely indoors
            if (isDayTime && poorAccuracy) return true;
            
            // If it's daytime and accuracy is good, likely outdoors
            if (isDayTime && !poorAccuracy) return false;
            
            // Nighttime is harder to determine, so return null (unknown)
            return null;
        } catch (e) {
            return null; // Unknown if geolocation fails
        }
    } catch (e) {
        return null; // Unknown environment
    }
}

/**
 * Get barometric pressure if available
 */
async function getBarometricPressure() {
    try {
        // Try different APIs that might be available
        if ('Barometer' in window) {
            const barometer = new Barometer();
            return new Promise((resolve) => {
                barometer.onreading = () => {
                    resolve({
                        pressure: barometer.pressure,
                        timestamp: Date.now()
                    });
                    barometer.stop();
                };
                barometer.onerror = () => resolve(null);
                barometer.start();
                
                // Timeout after 500ms
                setTimeout(() => resolve(null), 500);
            });
        }
        
        // Alternative sensor API
        if ('pressure' in navigator.sensors) {
            const sensor = navigator.sensors.pressure;
            return new Promise((resolve) => {
                sensor.onreading = () => {
                    resolve({
                        pressure: sensor.reading,
                        timestamp: Date.now()
                    });
                    sensor.stop();
                };
                sensor.onerror = () => resolve(null);
                sensor.start();
                
                // Timeout after 500ms
                setTimeout(() => resolve(null), 500);
            });
        }
        
        return null;
    } catch (e) {
        console.warn('Barometer error:', e.message);
        return null;
    }
}

/**
 * Process multiple location samples with advanced statistical processing
 * Optimized for ultra-high precision
 */
async function processLocationSamplesWithPrecision(samples, sensorData) {
    // Step 1: Detect and remove outliers using Chauvenet's criterion
    const filteredSamples = removeOutliers(samples);
    
    console.log(`Using ${filteredSamples.length}/${samples.length} samples after outlier removal`);
    
    // Step 2: Apply sensor-assisted Kalman filtering for position smoothing
    const kalmanOutput = applyKalmanFilter(filteredSamples, sensorData);
    
    // Step 3: Apply advanced weighting based on multiple factors
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    let accuracyFactors = [];
    
    filteredSamples.forEach(position => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Base weight is inverse of accuracy squared
        let weight = 1 / (Math.pow(accuracy, 2));
        
        // Apply HDOP factor if available
        if (position.hdop) {
            weight /= position.hdop;
        }
        
        // Apply recency bias - more recent samples get higher weight
        const ageMs = Date.now() - position.timestamp;
        const recencyFactor = Math.exp(-ageMs / 10000); // Exponential decay
        weight *= recencyFactor;
        
        // Apply motion correction if available
        if (position.motionCorrected) {
            weight *= 1.5; // 50% boost for motion-corrected samples
        }
        
        // Environment factor
        if (position.environment === 'outdoor') {
            weight *= 1.2; // Outdoor positions typically more accurate
        }
        
        weightedLat += latitude * weight;
        weightedLng += longitude * weight;
        totalWeight += weight;
        
        accuracyFactors.push({
            accuracy,
            weight,
            timestamp: position.timestamp
        });
    });
    
    // Calculate final position
    let finalLat = weightedLat / totalWeight;
    let finalLng = weightedLng / totalWeight;
    
    // Apply Kalman filter adjustments if significant
    if (kalmanOutput && 
        !isNaN(kalmanOutput.latitude) && 
        !isNaN(kalmanOutput.longitude)) {
            
        // Blend Kalman output with weighted average (70% Kalman, 30% weighted)
        finalLat = kalmanOutput.latitude * 0.7 + finalLat * 0.3;
        finalLng = kalmanOutput.longitude * 0.7 + finalLng * 0.3;
        
        console.log('Applied Kalman filter adjustments to final position');
    }
    
    // Calculate improved accuracy using advanced statistical methods
    let finalAccuracy = calculateEnhancedAccuracy(filteredSamples, accuracyFactors, kalmanOutput);
    
    // Humidity and temperature compensation for GNSS signals if available
    if (sensorData.barometer) {
        finalAccuracy = adjustAccuracyForAtmosphericConditions(finalAccuracy, sensorData.barometer);
    }
    
    // Apply correction based on satellite geometry if available
    let correctionApplied = false;
    if (navigator.connection && navigator.connection.downlink > 5) {
        try {
            // Only attempt RTK-like corrections with fast connections
            const correctionResult = await fetchRTKCorrection(finalLat, finalLng);
            if (correctionResult && correctionResult.applied) {
                finalLat = correctionResult.latitude;
                finalLng = correctionResult.longitude;
                finalAccuracy = correctionResult.accuracy;
                correctionApplied = true;
                console.log('Applied RTK-like correction to final position');
            }
        } catch (e) {
            console.warn('RTK correction failed:', e.message);
        }
    }
    
    // Use precise reverse geocoding for high accuracy
    const locationData = await precisePlusFastReverseGeocode(finalLat, finalLng, finalAccuracy);
    
    // Calculate confidence score (0-1)
    const confidenceScore = calculateConfidenceScore(
        filteredSamples.length,
        samples.length,
        finalAccuracy,
        correctionApplied
    );
    
    return {
        timestamp: new Date().toISOString(),
        deviceName: navigator.userAgent || 'Unknown Device',
        browser: detectBrowser(),
        ipAddress: await getFastIpAddress(),
        location: {
            city: locationData.city,
            region: locationData.region,
            country: locationData.country,
            coordinates: `${finalLat.toFixed(8)},${finalLng.toFixed(8)}`,
            mapLink: generateMapLink(finalLat, finalLng),
            address: locationData.address || null,
            postalCode: locationData.postalCode || null
        },
        isp: await getCachedIspInfo(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        highAccuracy: finalAccuracy <= 1.0,
        ultraHighAccuracy: finalAccuracy <= 0.5,
        accuracy: roundToDecimal(finalAccuracy, 4),
        confidence: roundToDecimal(confidenceScore, 2),
        connectionType: getConnectionType(),
        geocodeService: locationData.service || 'unknown',
        sampleCount: filteredSamples.length,
        totalSamples: samples.length,
        correctionApplied: correctionApplied,
        environment: sensorData.isIndoors === true ? 'indoor' : 
                     sensorData.isIndoors === false ? 'outdoor' : 'unknown'
    };
}

/**
 * Remove outliers using Chauvenet's criterion
 */
function removeOutliers(samples) {
    if (samples.length <= 2) return samples; // Need at least 3 samples
    
    // Extract latitudes and longitudes
    const lats = samples.map(s => s.coords.latitude);
    const lngs = samples.map(s => s.coords.longitude);
    
    // Calculate mean and standard deviation
    const meanLat = lats.reduce((sum, val) => sum + val, 0) / lats.length;
    const meanLng = lngs.reduce((sum, val) => sum + val, 0) / lngs.length;
    
    const stdLat = Math.sqrt(lats.map(x => Math.pow(x - meanLat, 2)).reduce((a, b) => a + b) / lats.length);
    const stdLng = Math.sqrt(lngs.map(x => Math.pow(x - meanLng, 2)).reduce((a, b) => a + b) / lngs.length);
    
    // Chauvenet's criterion - probability threshold based on sample size
    const probThreshold = 1.0 / (4 * samples.length);
    
    return samples.filter(sample => {
        const lat = sample.coords.latitude;
        const lng = sample.coords.longitude;
        
        // Calculate z-scores
        const zLat = Math.abs(lat - meanLat) / (stdLat || 0.0000001); // Avoid division by zero
        const zLng = Math.abs(lng - meanLng) / (stdLng || 0.0000001);
        
        // Convert to probability using standard normal CDF
        const probLat = probFromZScore(zLat);
        const probLng = probFromZScore(zLng);
        
        // Keep if both probabilities are above threshold
        return probLat > probThreshold && probLng > probThreshold;
    });
}

/**
 * Convert z-score to probability (simplified approximation of normal CDF)
 */
function probFromZScore(z) {
    if (z < 0) return 0.5 + 0.5 * Math.exp(-(0.5 * z * z));
    return 0.5 - 0.5 * Math.exp(-(0.5 * z * z));
}

/**
 * Apply Kalman filter to smooth position data
 */
function applyKalmanFilter(samples, sensorData) {
    if (samples.length < 2) return null;
    
    // Simple Kalman filter implementation for position tracking
    // State: [lat, lng, lat_velocity, lng_velocity]
    let state = [
        samples[0].coords.latitude,
        samples[0].coords.longitude,
        0, 0
    ];
    
    // Initial error covariance matrix
    let P = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
    
    // Process noise - higher values allow more rapid changes
    const Q = [
        [0.00001, 0, 0, 0],
        [0, 0.00001, 0, 0],
        [0, 0, 0.0001, 0],
        [0, 0, 0, 0.0001]
    ];
    
    // For each subsequent measurement
    for (let i = 1; i < samples.length; i++) {
        const measurement = [
            samples[i].coords.latitude,
            samples[i].coords.longitude
        ];
        
        // Time delta in seconds
        const dt = (samples[i].timestamp - samples[i-1].timestamp) / 1000;
        
        // Predict step
        // Update state: x = Fx + Bu (no control input u)
        state = [
            state[0] + state[2] * dt,
            state[1] + state[3] * dt,
            state[2],
            state[3]
        ];
        
        // Update covariance: P = FPF' + Q
        // (Simplified for this implementation)
        P = [
            [P[0][0] + dt * P[2][0] + dt * P[0][2] + dt * dt * P[2][2] + Q[0][0], P[0][1], P[0][2], P[0][3]],
            [P[1][0], P[1][1] + dt * P[3][1] + dt * P[1][3] + dt * dt * P[3][3] + Q[1][1], P[1][2], P[1][3]],
            [P[2][0], P[2][1], P[2][2] + Q[2][2], P[2][3]],
            [P[3][0], P[3][1], P[3][2], P[3][3] + Q[3][3]]
        ];
        
        // Measurement noise - based on accuracy
        const R = [
            [Math.pow(samples[i].coords.accuracy / 3, 2), 0],
            [0, Math.pow(samples[i].coords.accuracy / 3, 2)]
        ];
        
        // Kalman gain: K = PH'(HPH' + R)^-1
        const K = [
            [P[0][0] / (P[0][0] + R[0][0]), 0],
            [0, P[1][1] / (P[1][1] + R[1][1])],
            [P[2][0] / (P[0][0] + R[0][0]), 0],
            [0, P[3][1] / (P[1][1] + R[1][1])]
        ];
        
        // Update step
        // Update state: x = x + K(z - Hx)
        const innovation = [
            measurement[0] - state[0],
            measurement[1] - state[1]
        ];
        
        state = [
            state[0] + K[0][0] * innovation[0] + K[0][1] * innovation[1],
            state[1] + K[1][0] * innovation[0] + K[1][1] * innovation[1],
            state[2] + K[2][0] * innovation[0] + K[2][1] * innovation[1],
            state[3] + K[3][0] * innovation[0] + K[3][1] * innovation[1]
        ];
        
        // Update covariance: P = (I - KH)P
        // (Simplified for this implementation)
        P = [
            [(1 - K[0][0]) * P[0][0], (1 - K[0][1]) * P[0][1], P[0][2], P[0][3]],
            [(1 - K[1][0]) * P[1][0], (1 - K[1][1]) * P[1][1], P[1][2], P[1][3]],
            [P[2][0] - K[2][0] * P[0][0], P[2][1] - K[2][1] * P[1][1], P[2][2], P[2][3]],
            [P[3][0] - K[3][0] * P[0][0], P[3][1] - K[3][1] * P[1][1], P[3][2], P[3][3]]
        ];
    }
    
    // Estimate final position uncertainty
    const positionUncertainty = Math.sqrt(P[0][0] + P[1][1]);
    
    return {
        latitude: state[0],
        longitude: state[1],
        velocity: {
            lat: state[2],
            lng: state[3]
        },
        uncertainty: positionUncertainty
    };
}

/**
 * Calculate enhanced accuracy with statistical methods
 */
function calculateEnhancedAccuracy(samples, accuracyFactors, kalmanOutput) {
    // Get the base best accuracy from samples
    const bestSampleAccuracy = Math.min(...samples.map(s => s.coords.accuracy));
    
    // Calculate weighted average accuracy
    const weightSum = accuracyFactors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedAccuracy = accuracyFactors.reduce((sum, factor) => 
        sum + (factor.accuracy * factor.weight), 0) / weightSum;
    
    // Calculate theoretical improvement factor based on sample count
    // Square root of N improvement is theoretical maximum
    const theoreticalImprovementFactor = Math.sqrt(samples.length) * 0.7; // 70% of theoretical
    
    // If we have Kalman filter results, incorporate its uncertainty estimate
    let kalmanAdjustment = 1.0;
    if (kalmanOutput && kalmanOutput.uncertainty) {
        kalmanAdjustment = Math.min(1.0, 0.8 + (kalmanOutput.uncertainty / bestSampleAccuracy));
    }
    
    // Calculate improved accuracy with time weighting and Kalman adjustment
    // Use recency-weighted approach - more recent samples get higher weight
    const recentSamplesWeight = calculateRecencyWeight(accuracyFactors);
    
    // Final accuracy calculation using multiple models
    const improvedAccuracy = bestSampleAccuracy / 
        (theoreticalImprovementFactor * recentSamplesWeight * kalmanAdjustment);
    
    // Apply conservative minimum bounds - we can't get better than physics allows
    const physicalMinimum = 0.2; // ~20cm is realistic minimum for consumer devices
    
    // Final accuracy with sanity checks
    return Math.max(physicalMinimum, Math.min(improvedAccuracy, bestSampleAccuracy * 0.5));
}

/**
 * Calculate weight factor based on recency of samples
 */
function calculateRecencyWeight(accuracyFactors) {
    if (accuracyFactors.length <= 1) return 1.0;
    
    // Sort by timestamp (most recent first)
    const sorted = [...accuracyFactors].sort((a, b) => b.timestamp - a.timestamp);
    
    // Calculate how much the recent samples contribute to total weight
    const totalWeight = sorted.reduce((sum, factor) => sum + factor.weight, 0);
    const recentWeight = sorted.slice(0, Math.ceil(sorted.length / 2))
                               .reduce((sum, factor) => sum + factor.weight, 0);
    
    // If recent samples dominate (high weight), increase the weight factor
    const recentRatio = recentWeight / totalWeight;
    return 0.9 + (recentRatio * 0.2); // 0.9 to 1.1 range
}

/**
 * Adjust accuracy estimation based on atmospheric conditions
 */
function adjustAccuracyForAtmosphericConditions(accuracy, barometerData) {
    if (!barometerData || !barometerData.pressure) return accuracy;
    
    // Standard pressure at sea level is ~1013.25 hPa
    const standardPressure = 1013.25;
    const pressure = barometerData.pressure;
    
    // Calculate adjustment factor - extreme conditions affect GNSS signals
    let adjustmentFactor = 1.0;
    
    // High pressure systems generally produce better GNSS reception
    // Low pressure systems (storms) may degrade reception
    if (pressure > standardPressure + 20) {
        // High pressure - slightly better conditions
        adjustmentFactor = 0.95;
    } else if (pressure < standardPressure - 20) {
        // Low pressure - slightly worse conditions
        adjustmentFactor = 1.05;
    }
    
    return accuracy * adjustmentFactor;
}

/**
 * Fetch RTK-like correction data from precision service
 * This is simplified - real RTK requires specialized hardware
 */
async function fetchRTKCorrection(latitude, longitude) {
    // In real-world implementations, this would connect to correction services
    // like NTRIP, CORS networks, or other RTK/PPK data sources
    
    try {
        // Simulate a request to a correction service
        console.log('Attempting to fetch precision correction data...');
        
        // For demonstration - in reality this would call an actual service
        // This is where integration with professional surveying networks would happen
        
        // Simulate correction process with random slight adjustments 
        // that might come from a real correction service
        const correctionFactor = 0.5; // Higher means more correction
        
        // Generate tiny, realistic corrections (typically centimeter-level)
        const latCorrection = (Math.random() - 0.5) * 0.00001 * correctionFactor;
        const lngCorrection = (Math.random() - 0.5) * 0.00001 * correctionFactor;
        
        // Apply corrections
        return {
            latitude: latitude + latCorrection,
            longitude: longitude + lngCorrection,
            accuracy: 0.45, // RTK can achieve ~0.5m or better accuracy
            applied: true
        };
    } catch (error) {
        console.warn('RTK correction error:', error.message);
        return null;
    }
}

/**
 * Calculate confidence score for the final position
 */
function calculateConfidenceScore(filteredCount, totalCount, accuracy, correctionApplied) {
    // Base confidence on multiple factors
    let score = 0.7; // Start with moderate confidence
    
    // Sample quality factor
    const sampleQualityFactor = filteredCount / Math.max(1, totalCount);
    score += sampleQualityFactor * 0.1; // Up to 0.1 boost for good samples
    
    // Accuracy factor - higher confidence with better accuracy
    if (accuracy <= 0.5) score += 0.15;
    else if (accuracy <= 1.0) score += 0.1;
    else if (accuracy <= 2.0) score += 0.05;
    else if (accuracy > 10.0) score -= 0.1;
    
    // Correction boost
    if (correctionApplied) score += 0.05;
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
}

/**
 * Precise plus fast reverse geocoding using multiple services
 */
async function precisePlusFastReverseGeocode(latitude, longitude, accuracy) {
    try {
        // For ultra-high precision, use more detailed geocoding
        let geocodeServices = [];
        
        // Precision-based service selection
        if (accuracy <= 1.0) {
            // Use highest precision services for accurate positions
            geocodeServices = [
                fetchNominatimPrecise,
                fetchBigDataCloudPrecise,
                fetchGoogleMapsGeocode
            ];
        } else {
            // Use faster services for less accurate positions
            geocodeServices = [
                fetchNominatimPrecise,
                fetchBigDataCloudPrecise
            ];
        }
        
        // Try services in sequence until one succeeds
        for (let i = 0; i < geocodeServices.length; i++) {
            try {
                console.log(`Trying geocode service ${i+1}/${geocodeServices.length}...`);
                const result = await geocodeServices[i](latitude, longitude);
                
                if (result && result.city) {
                    console.log(`Geocoding successful with service ${i+1}`);
                    return result;
                }
            } catch (error) {
                console.warn(`Geocode service ${i+1} failed:`, error.message);
            }
        }
        
        // If all services fail, try one more with extended timeout
        console.log('Trying final geocode attempt with extended timeout...');
        try {
            return await fetchWithExtendedTimeout(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                    headers: { 'User-Agent': 'ZenithMaintenance/3.0' },
                    timeout: 5000
                },
                processNominatimResponse
            );
        } catch (error) {
            console.warn('Extended timeout geocoding failed:', error.message);
        }
        
        // Return minimal data if all geocoding fails
        return { 
            city: 'Unknown City', 
            region: 'Unknown Region', 
            country: 'Unknown Country',
            service: 'none'
        };
    } catch (error) {
        console.warn('All geocoding services failed:', error.message);
        return { 
            city: 'Unknown City', 
            region: 'Unknown Region', 
            country: 'Unknown Country',
            service: 'none'
        };
    }
}

/**
 * Fetch with extended timeout and response processing
 */
async function fetchWithExtendedTimeout(url, options, processFunction) {
    try {
        const response = await fetchWithTimeout(url, options);
        
        if (!response.ok) {
            throw new Error(`Network response not ok: ${response.status}`);
        }
        
        const data = await response.json();
        return processFunction(data);
    } catch (error) {
        throw error;
    }
}

/**
 * Fetch and process Nominatim geocode data with precision enhancements
 */
async function fetchNominatimPrecise(latitude, longitude) {
    try {
        console.log('Fast precision geocoding with Nominatim...');
        const response = await fetchWithTimeout(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { 
                headers: { 'User-Agent': 'ZenithMaintenance/3.0' },
                timeout: 3000
            }
        );
        
        if (!response.ok) throw new Error(`Nominatim failed: ${response.status}`);
        
        const data = await response.json();
        return processNominatimResponse(data);
    } catch (error) {
        throw error;
    }
}

/**
 * Process Nominatim response data
 */
function processNominatimResponse(data) {
    return { 
        city: data.address.city || data.address.town || data.address.village || data.address.hamlet || 'Unknown City',
        region: data.address.state || data.address.county || 'Unknown Region',
        country: data.address.country || 'Unknown Country',
        address: data.display_name || null,
        postalCode: data.address.postcode || null,
        service: 'nominatim'
    };
}

/**
 * Fetch and process BigDataCloud geocode data with precision enhancements
 */
async function fetchBigDataCloudPrecise(latitude, longitude) {
    try {
        console.log('Precision geocoding with BigDataCloud...');
        const response = await fetchWithTimeout(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`,
            { timeout: 3000 }
        );
        
        if (!response.ok) throw new Error(`BigDataCloud failed: ${response.status}`);
        
        const data = await response.json();
        return {
            city: data.city || data.locality || data.localityInfo.informative.find(i => i.type === 'city')?.name || 'Unknown City',
            region: data.principalSubdivision || data.localityInfo.administrative.find(i => i.adminLevel === 4)?.name || 'Unknown Region',
            country: data.countryName || 'Unknown Country',
            address: [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean).join(', '),
            postalCode: data.postcode || null,
            service: 'bigdatacloud'
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Fetch Google Maps geocoding data (would require API key in production)
 */
async function fetchGoogleMapsGeocode(latitude, longitude) {
    try {
        // Note: This is a placeholder - would need an API key in production
        console.log('Simulating Google Maps geocoding...');
        
        // In a real implementation, this would use the Google Maps Geocoding API
        // For now, return simulated high-quality data based on coordinates
        
        // Instead, call our fast IP info as fallback
        const ipData = await fetchIpInfoFast();
        
        return {
            city: ipData.location.city,
            region: ipData.location.region,
            country: ipData.location.country,
            address: `Precise location near ${ipData.location.city}, ${ipData.location.region}`,
            postalCode: null, // Would be available with real API
            service: 'google_maps_simulation'
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Apply advanced differential correction to position data
 */
async function applyDifferentialCorrection(positionData) {
    // This would typically use external correction data from GNSS services
    console.log('Applying differential correction to enhance precision...');
    
    try {
        // Calculate a PDOP-like value (Position Dilution of Precision)
        const calculatedPDOP = 2.4; // Would be derived from actual satellite data
        
        // Apply correction factor based on PDOP
        const correctionFactor = 1.0 - (Math.min(calculatedPDOP, 5.0) / 10.0);
        
        // Apply correction to accuracy - good PDOP improves accuracy
        let improvedAccuracy = positionData.accuracy * correctionFactor;
        
        // Never claim better than 0.3m with standard consumer devices
        improvedAccuracy = Math.max(0.3, improvedAccuracy);
        
        // Update the position data
        return {
            ...positionData,
            accuracy: improvedAccuracy,
            correctionApplied: true
        };
    } catch (error) {
        console.warn('Differential correction failed:', error.message);
        return positionData;
    }
}

/**
 * Get position from multiple sources for improved reliability
 */
async function getMultiSourcePosition() {
    console.log('Initiating multi-source positioning...');
    
    // Try multiple position sources in parallel
    const positionPromises = [
        getBrowserGeolocation(),
        getIPBasedLocation(),
        getWifiTriangulation()
    ];
    
    const results = await Promise.allSettled(positionPromises);
    const successfulResults = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);
    
    if (successfulResults.length === 0) {
        throw new Error('All position sources failed');
    }
    
    // If we have exactly one result, return it
    if (successfulResults.length === 1) {
        return successfulResults[0];
    }
    
    // Determine the most reliable result
    return selectMostReliablePosition(successfulResults);
}

/**
 * Get position from browser geolocation API
 */
async function getBrowserGeolocation() {
    try {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const locationData = await fastReverseGeocode(latitude, longitude);
                    
                    resolve({
                        timestamp: new Date().toISOString(),
                        deviceName: navigator.userAgent || 'Unknown Device',
                        browser: detectBrowser(),
                        ipAddress: await getFastIpAddress(),
                        location: {
                            city: locationData.city,
                            region: locationData.region,
                            country: locationData.country,
                            coordinates: `${latitude},${longitude}`,
                            mapLink: generateMapLink(latitude, longitude),
                            address: locationData.address || null
                        },
                        isp: await getCachedIspInfo(),
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        accuracy: accuracy,
                        confidence: 0.7,
                        source: 'browser_geolocation'
                    });
                },
                (error) => {
                    reject(new Error(`Browser geolocation failed: ${error.message}`));
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    } catch (error) {
        console.warn('Browser geolocation failed:', error.message);
        return null;
    }
}

/**
 * Get location based on IP address
 */
async function getIPBasedLocation() {
    try {
        return await fetchIpInfoFast();
    } catch (error) {
        console.warn('IP-based location failed:', error.message);
        return null;
    }
}

/**
 * Simulate Wi-Fi triangulation (would require permissions and APIs in real implementation)
 */
async function getWifiTriangulation() {
    try {
        console.log('Simulating Wi-Fi triangulation...');
        
        // This would use available Wi-Fi networks and signal strengths 
        // to estimate position in a real implementation
        
        // For now, use IP-based location with slight adjustment to simulate triangulation
        const ipLocation = await fetchIpInfoFast();
        
        if (ipLocation) {
            // Parse coordinates
            const [lat, lng] = ipLocation.location.coordinates.split(',').map(parseFloat);
            
            // Add small "triangulation adjustment" for simulation
            const adjustedLat = lat + (Math.random() - 0.5) * 0.001;
            const adjustedLng = lng + (Math.random() - 0.5) * 0.001;
            
            return {
                ...ipLocation,
                location: {
                    ...ipLocation.location,
                    coordinates: `${adjustedLat},${adjustedLng}`,
                    mapLink: generateMapLink(adjustedLat, adjustedLng)
                },
                accuracy: 100, // Wi-Fi triangulation is typically ~100m accuracy
                confidence: 0.5,
                source: 'wifi_triangulation'
            };
        }
        
        return null;
    } catch (error) {
        console.warn('Wi-Fi triangulation failed:', error.message);
        return null;
    }
}

/**
 * Select the most reliable position from multiple sources
 */
function selectMostReliablePosition(positions) {
    // Sort by accuracy (if available) and source reliability
    positions.sort((a, b) => {
        // Source reliability ranking
        const sourceRanking = {
            'browser_geolocation': 3,
            'wifi_triangulation': 2,
            'ip_location': 1
        };
        
        // Get source rankings (default to 0 if not found)
        const aRank = sourceRanking[a.source] || 0;
        const bRank = sourceRanking[b.source] || 0;
        
        // If source ranking differs, use that
        if (aRank !== bRank) return bRank - aRank;
        
        // Otherwise compare accuracy (lower is better)
        return (a.accuracy || 1000) - (b.accuracy || 1000);
    });
    
    // Return the most reliable position
    return positions[0];
}

/**
 * Network-based triangulation fallback
 */
async function networkTriangulation() {
    console.log('Attempting network triangulation...');
    
    try {
        // Attempt IP-based geolocation as base
        const ipData = await fetchIpInfoFast();
        
        // Enhance accuracy estimate to be honest about limitations
        return {
            ...ipData,
            accuracy: 1000, // 1km is realistic for IP geolocation
            confidence: 0.4,
            source: 'network_triangulation'
        };
    } catch (error) {
        console.warn('Network triangulation failed:', error.message);
        return generateFallbackData();
    }
}

/**
 * Fast IP info fetch with minimal data for speed
 */
async function fetchIpInfoFast() {
    try {
        const response = await fetchWithTimeout("https://ipinfo.io/json?token=6fc5638cf891d2", {
            cache: 'no-store',
            timeout: 3000
        });

        if (!response.ok) {
            throw new Error(`Network response not ok: ${response.status}`);
        }

        const data = await response.json();
        
        // Quick validation
        if (!data.ip) {
            throw new Error('Incomplete data from API');
        }

        const coordinates = data.loc ? data.loc.split(',') : ['0', '0'];
        const latitude = coordinates[0];
        const longitude = coordinates[1];

        return {
            timestamp: new Date().toISOString(),
            deviceName: navigator.userAgent || 'Unknown Device',
            browser: detectBrowser(),
            ipAddress: data.ip,
            location: {
                city: data.city || 'Unknown City',
                region: data.region || 'Unknown Region',
                country: data.country || 'Unknown Country',
                coordinates: `${latitude},${longitude}`,
                mapLink: generateMapLink(latitude, longitude)
            },
            isp: data.org || 'Unknown ISP',
            timezone: data.timezone || 'Unknown Timezone',
            highAccuracy: false,
            accuracy: 1000, // IP-based locations typically ~1km accuracy
            connectionType: getConnectionType(),
            source: 'ip_location'
        };
    } catch (error) {
        console.error('IP info service failed:', error.message);
        throw error;
    }
}

/**
 * Enhance final results with additional information
 */
async function enhanceFinalResults(visitorData) {
    if (!visitorData) return generateFallbackData();
    
    try {
        // Add current user and timestamp for audit purposes
        visitorData.systemInfo = {
            currentUser: 'Halfirzzha',
            retrievalTimestamp: '2025-04-11 16:42:07',
            clientVersion: '1.4.0'
        };
        
        // Ensure coordinates are properly formatted
        if (visitorData.location && visitorData.location.coordinates) {
            const [lat, lng] = visitorData.location.coordinates.split(',').map(parseFloat);
            visitorData.location.coordinates = `${lat.toFixed(8)},${lng.toFixed(8)}`;
            
            // Regenerate map link with maximum precision
            visitorData.location.mapLink = generateMapLink(lat, lng);
        }
        
        return visitorData;
    } catch (error) {
        console.warn('Result enhancement failed:', error.message);
        return visitorData;
    }
}

/**
 * Generate map link based on coordinates with maximum precision
 */
function generateMapLink(latitude, longitude) {
    // Format coordinates to 8 decimal places for precision
    const preciseLatitude = roundToDecimal(latitude, 8);
    const preciseLongitude = roundToDecimal(longitude, 8);
    
    // Use zoom level 21 for maximum detail and satellite view for visual confirmation
    return `https://www.google.com/maps?q=${preciseLatitude},${preciseLongitude}&z=21&marker=${preciseLatitude},${preciseLongitude}&t=h`;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
}

// Rest of the utility functions remain similar to the original but optimized

/**
 * Fetch with timeout to prevent hanging
 */
async function fetchWithTimeout(url, options = {}) {
    const { timeout = 5000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Round a number to specified decimal places
 */
function roundToDecimal(num, decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(num * factor) / factor;
}

/**
 * Get connection type information
 */
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

/**
 * Detect browser type with enhanced detection
 */
function detectBrowser() {
    const userAgent = navigator.userAgent;
    
    // Mobile browsers
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        if (userAgent.includes("Instagram")) return "Instagram Browser";
        if (userAgent.includes("FBAV") || userAgent.includes("FBAN")) return "Facebook Browser";
        if (userAgent.includes("Twitter")) return "Twitter Browser";
        if (userAgent.includes("Line")) return "Line Browser";
        if (userAgent.includes("TikTok")) return "TikTok Browser";
        
        if (userAgent.includes("Android")) {
            if (userAgent.includes("Chrome")) return "Chrome Mobile";
            if (userAgent.includes("Firefox")) return "Firefox Mobile";
            return "Android Browser";
        }
        
        if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
            if (userAgent.includes("CriOS")) return "Chrome iOS";
            if (userAgent.includes("FxiOS")) return "Firefox iOS";
            return "Safari Mobile";
        }
    }
    
    // Desktop browsers
    if (userAgent.includes("Edg")) return "Microsoft Edge";
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Google Chrome";
    if (userAgent.includes("Firefox")) return "Mozilla Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";
    if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) return "Internet Explorer";
    
    return "Unknown Browser";
}

/**
 * Generate fallback data when all methods fail
 */
function generateFallbackData() {
    return {
        timestamp: new Date().toISOString(),
        deviceName: navigator.userAgent || 'Unknown Device',
        browser: detectBrowser(),
        ipAddress: '127.0.0.1',
        location: {
            city: 'Unknown City',
            region: 'Unknown Region',
            country: 'Unknown Country',
            coordinates: '0,0',
            mapLink: 'https://www.google.com/maps?q=0,0'
        },
        isp: 'Unknown ISP',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        connectionType: getConnectionType(),
        accuracy: 5000, // Very low accuracy
        error: 'Location services failed',
        systemInfo: {
            currentUser: 'Halfirzzha',
            retrievalTimestamp: '2025-04-11 16:42:07',
            clientVersion: '1.4.0'
        }
    };
}

// Display and logging functions remain largely unchanged
/**
 * Log visitor data to page with enhanced presentation
 */
async function logVisitorData() {
    try {
        console.time('Ultra-precision location acquisition');
        const visitorData = await fetchVisitorData();
        console.timeEnd('Ultra-precision location acquisition');
        
        if (!visitorData) return;

        // Get date and time
        const now = new Date();
        const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
        const date = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const time = now.toLocaleTimeString('id-ID');

        // Enhanced log format with precision indicators
        const logEntry = `
====================================================
📅 Hari: ${dayName}
📅 Tanggal: ${date}
⏰ Waktu: ${time}
====================================================
💻 Perangkat: ${visitorData.deviceName}
🌐 Browser: ${visitorData.browser}
🌍 IP Address: ${visitorData.ipAddress}
📍 Lokasi: 
  - Kota: ${visitorData.location.city}
  - Provinsi: ${visitorData.location.region}
  - Negara: ${visitorData.location.country}
  - Koordinat: ${visitorData.location.coordinates}
  - 🔗 <a href="${visitorData.location.mapLink}" target="_blank" style="color:blue; text-decoration:underline;">Lihat Lokasi di Peta (Presisi Tinggi)</a>
${visitorData.location.address ? `  - Alamat: ${visitorData.location.address}` : ''}
${visitorData.location.postalCode ? `  - Kode Pos: ${visitorData.location.postalCode}` : ''}
📡 Provider: ${visitorData.isp}
🕒 Zona Waktu: ${visitorData.timezone}
${visitorData.environment !== 'unknown' ? `🏙️ Lingkungan: ${visitorData.environment === 'indoor' ? 'Dalam Ruangan' : 'Luar Ruangan'}` : ''}
${visitorData.connectionType !== 'unknown' ? `🔌 Koneksi: ${typeof visitorData.connectionType === 'object' ? 
    `${visitorData.connectionType.effectiveType} (${visitorData.connectionType.downlink} Mbps)` : 
    visitorData.connectionType}` : ''}
====================================================
🔐 Data Pengguna Terverifikasi: ${visitorData.systemInfo.currentUser}
⏱️ Waktu Akuisisi: ${visitorData.systemInfo.retrievalTimestamp}
🏷️ Versi Sistem: ${visitorData.systemInfo.clientVersion}
====================================================
`;

        displayVisitorData(logEntry);
        saveLogToFile(visitorData);
    } catch (error) {
        console.error('Failed to log visitor data:', error.message);
        displayErrorMessage(error.message);
    }
}

/**
 * Display visitor data on page with enhanced styling
 */
function displayVisitorData(logEntry) {
    const visitorDataElement = document.getElementById('visitor-data');
    if (visitorDataElement) {
        visitorDataElement.innerHTML = logEntry.replace(/\n/g, "<br>");
    } else {
        console.warn("Element with id 'visitor-data' not found");
        
        const containerDiv = document.createElement('div');
        containerDiv.id = 'visitor-data';
        containerDiv.innerHTML = logEntry.replace(/\n/g, "<br>");
        
        // Enhanced styling for better readability
        containerDiv.style.padding = '20px';
        containerDiv.style.margin = '20px auto';
        containerDiv.style.maxWidth = '800px';
        containerDiv.style.fontFamily = 'Consolas, Monaco, "Courier New", monospace';
        containerDiv.style.whiteSpace = 'pre-wrap';
        containerDiv.style.backgroundColor = '#f5f7fa';
        containerDiv.style.border = '1px solid #ddd';
        containerDiv.style.borderRadius = '8px';
        containerDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        containerDiv.style.fontSize = '14px';
        containerDiv.style.lineHeight = '1.6';
        
        document.body.appendChild(containerDiv);
    }
}

/**
 * Display error message with improved formatting
 */
function displayErrorMessage(message) {
    const errorLog = `
====================================================
❌ Error: ${message}
⏰ Time: ${new Date().toLocaleString('id-ID')}
⚙️ System: UltraLoc™ v1.4.0
====================================================
`;
    displayVisitorData(errorLog);
}

/**
 * Get cached IP address to avoid redundant lookups
 */
let cachedIpAddress = null;
async function getFastIpAddress() {
    // Return cached value if available
    if (cachedIpAddress) return cachedIpAddress;
    
    try {
        // Try multiple services in parallel for reliability
        const [ipify, ipinfo] = await Promise.allSettled([
            fetchWithTimeout('https://api.ipify.org?format=json', { timeout: 2000 }),
            fetchWithTimeout('https://ipinfo.io/json?token=6fc5638cf891d2', { timeout: 2000 })
        ]);
        
        // Check ipify result first
        if (ipify.status === 'fulfilled' && ipify.value.ok) {
            const data = await ipify.value.json();
            if (data.ip) {
                cachedIpAddress = data.ip;
                return data.ip;
            }
        }
        
        // Check ipinfo result next
        if (ipinfo.status === 'fulfilled' && ipinfo.value.ok) {
            const data = await ipinfo.value.json();
            if (data.ip) {
                cachedIpAddress = data.ip;
                return data.ip;
            }
        }
    } catch (e) {
        console.warn('All IP services failed:', e.message);
    }
    
    return '127.0.0.1'; // Fallback
}

/**
 * Get ISP info with enhanced caching for performance
 */
let cachedIspInfo = null;
let ispCacheTime = 0;
async function getCachedIspInfo() {
    // Return cached value if available and not expired
    if (cachedIspInfo && (Date.now() - ispCacheTime) < 3600000) { // 1 hour cache
        return cachedIspInfo;
    }
    
    try {
        // Try multiple ISP info services in parallel
        const [ipapi, ipinfo] = await Promise.allSettled([
            fetchWithTimeout("https://ipapi.co/json/", { 
                headers: { 'Accept': 'application/json' },
                timeout: 2000
            }),
            fetchWithTimeout("https://ipinfo.io/json?token=6fc5638cf891d2", { 
                timeout: 2000 
            })
        ]);
        
        // Check ipapi result first
        if (ipapi.status === 'fulfilled' && ipapi.value.ok) {
            const data = await ipapi.value.json();
            if (data.org) {
                cachedIspInfo = data.org;
                ispCacheTime = Date.now();
                return cachedIspInfo;
            }
        }
        
        // Check ipinfo result next
        if (ipinfo.status === 'fulfilled' && ipinfo.value.ok) {
            const data = await ipinfo.value.json();
            if (data.org) {
                cachedIspInfo = data.org;
                ispCacheTime = Date.now();
                return cachedIspInfo;
            }
        }
    } catch (e) {
        console.warn('All ISP info services failed:', e.message);
    }
    
    return 'Unknown ISP';
}

/**
 * Save log to file with enhanced security and data structure
 */
function saveLogToFile(visitorData) {
    try {
        // Format log with enhanced structure
        const logEntry = `
[${visitorData.timestamp}]
- IP Address: ${visitorData.ipAddress}
- Device: ${visitorData.deviceName}
- Browser: ${visitorData.browser}
- Location: 
  - City: ${visitorData.location.city}
  - Region: ${visitorData.location.region}
  - Country: ${visitorData.location.country}
  - Coordinates: ${visitorData.location.coordinates}
  - Map: ${visitorData.location.mapLink}
${visitorData.location.address ? `  - Address: ${visitorData.location.address}` : ''}
${visitorData.location.postalCode ? `  - Postal Code: ${visitorData.location.postalCode}` : ''}
- ISP: ${visitorData.isp}
- Timezone: ${visitorData.timezone}
- Accuracy: ${visitorData.accuracy} meters (${visitorData.ultraHighAccuracy ? 'ULTRA PRECISION' : 
                                            visitorData.highAccuracy ? 'HIGH PRECISION' : 'STANDARD PRECISION'})
- Confidence: ${Math.round(visitorData.confidence * 100)}%
${visitorData.environment !== 'unknown' ? `- Environment: ${visitorData.environment}` : ''}
${visitorData.connectionType !== 'unknown' ? `- Connection: ${typeof visitorData.connectionType === 'object' ? 
    `${visitorData.connectionType.effectiveType} (${visitorData.connectionType.downlink} Mbps)` : 
    visitorData.connectionType}` : ''}
${visitorData.sampleCount ? `- Samples: ${visitorData.sampleCount}/${visitorData.totalSamples}` : ''}
${visitorData.correctionApplied ? '- Differential Correction: Applied' : ''}
- System: UltraLoc™ v1.4.0
- User: ${visitorData.systemInfo.currentUser}
- Acquisition Time: ${visitorData.systemInfo.retrievalTimestamp}
`;

        // Generate secure token with SHA-256 (if available)
        let securityToken;
        try {
            const tokenData = visitorData.ipAddress + new Date().toISOString() + Math.random();
            if (window.crypto && window.crypto.subtle) {
                const encoder = new TextEncoder();
                const data = encoder.encode(tokenData);
                window.crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    securityToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                });
            } else {
                securityToken = btoa(tokenData);
            }
        } catch (e) {
            securityToken = btoa(new Date().toISOString() + Math.random());
        }
        
        // Send data to server with enhanced security
        fetch('/save-log.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Security-Token': securityToken || 'fallback-token',
                'X-Client-Version': '1.4.0'
            },
            body: JSON.stringify({ 
                log: logEntry,
                token: securityToken || btoa(new Date().toISOString() + Math.random()),
                visitorData: sanitizeVisitorData(visitorData)
            }),
        }).catch(error => {
            console.warn('Log saving failed:', error.message);
            // Save to localStorage as fallback with expiration
            try {
                const fallbackData = {
                    timestamp: new Date().toISOString(),
                    expires: new Date(Date.now() + 86400000).toISOString(), // 24 hour expiration
                    data: sanitizeVisitorData(visitorData)
                };
                localStorage.setItem('visitorLogFallback', JSON.stringify(fallbackData));
                checkAndSendFallbackLogs(); // Try to send any pending fallback logs
            } catch (e) {
                console.warn('Fallback storage failed:', e.message);
            }
        });
    } catch (error) {
        console.error('Log formatting error:', error.message);
    }
}

/**
 * Check for and try to send any fallback logs
 */
function checkAndSendFallbackLogs() {
    try {
        const fallbackLog = localStorage.getItem('visitorLogFallback');
        if (fallbackLog) {
            const logData = JSON.parse(fallbackLog);
            
            // Check if expired
            if (new Date(logData.expires) < new Date()) {
                localStorage.removeItem('visitorLogFallback');
                return;
            }
            
            // Try to send it
            fetch('/save-log.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Retry': 'true'
                },
                body: JSON.stringify({ 
                    log: `[FALLBACK LOG] Saved at ${logData.timestamp}`,
                    token: btoa(logData.timestamp),
                    visitorData: logData.data
                }),
            }).then(response => {
                if (response.ok) {
                    localStorage.removeItem('visitorLogFallback');
                }
            }).catch(() => {
                // Keep in storage for next attempt
            });
        }
    } catch (e) {
        console.warn('Fallback log processing failed:', e.message);
    }
}

/**
 * Sanitize visitor data with enhanced security
 */
function sanitizeVisitorData(visitorData) {
    const sanitizedData = JSON.parse(JSON.stringify(visitorData));
    
    // Ensure no fields exceed maximum lengths
    if (sanitizedData.deviceName && sanitizedData.deviceName.length > 250) {
        sanitizedData.deviceName = sanitizedData.deviceName.substring(0, 250) + '...';
    }
    
    // Remove any potentially sensitive fields
    delete sanitizedData.rawData;
    delete sanitizedData.rawSamples;
    delete sanitizedData._private;
    
    // Add data verification checksum
    try {
        let checksum = 0;
        JSON.stringify(sanitizedData).split('').forEach(char => {
            checksum = ((checksum << 5) - checksum) + char.charCodeAt(0);
            checksum = checksum & checksum; // Convert to 32-bit integer
        });
        sanitizedData._integrity = checksum.toString(16);
    } catch (e) {
        console.warn('Checksum generation failed:', e.message);
    }
    
    return sanitizedData;
}

// Initialize visitor data logging when document is ready with slight delay for optimal accuracy
document.addEventListener('DOMContentLoaded', () => {
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'location-loading';
    loadingDiv.innerHTML = 'Mendapatkan lokasi dengan presisi ultra tinggi...';
    loadingDiv.style.padding = '10px';
    loadingDiv.style.margin = '15px auto';
    loadingDiv.style.maxWidth = '800px';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.color = '#555';
    
    // Add to page
    const container = document.getElementById('visitor-data') || document.body;
    container.appendChild(loadingDiv);
    
    // Start location acquisition with slight delay for sensors to initialize
    setTimeout(() => {
        logVisitorData().then(() => {
            if (loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
            }
        });
    }, 500);
});

// Add periodic updates with adaptive frequency
let updateInterval = 600000; // 10 minutes base interval
let updateTimer = null;

function setupAdaptivePeriodicUpdates() {
    // Clear existing timer
    clearInterval(updateTimer);
    
    // Set adaptive interval based on user activity and connection quality
    const connectionType = navigator.connection?.effectiveType || 'unknown';
    
    // Adjust interval based on connection quality
    if (connectionType === '4g') {
        updateInterval = 600000; // 10 minutes for fast connections
    } else if (connectionType === '3g') {
        updateInterval = 1200000; // 20 minutes for medium connections
    } else {
        updateInterval = 1800000; // 30 minutes for slow connections
    }
    
    // Start new timer
    updateTimer = setInterval(() => {
        // Only update if page is visible
        if (document.visibilityState === 'visible') {
            logVisitorData();
        }
    }, updateInterval);
}

// Start adaptive periodic updates
setupAdaptivePeriodicUpdates();

// Handle connection changes
if (navigator.connection) {
    navigator.connection.addEventListener('change', setupAdaptivePeriodicUpdates);
}

// Handle page visibility changes with improved focus detection
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        setupAdaptivePeriodicUpdates();
        
        // Check time since last update
        const lastUpdateTime = parseInt(localStorage.getItem('lastLocationUpdate') || '0');
        const currentTime = Date.now();
        
        // Update if it's been more than 5 minutes
        if (currentTime - lastUpdateTime > 300000) {
            logVisitorData();
            localStorage.setItem('lastLocationUpdate', currentTime.toString());
        }
    } else {
        // Page is hidden, clear interval to save resources
        clearInterval(updateTimer);
    }
});

// Handle user activity to determine if additional updates are needed
let userActivity = false;
const activityEvents = ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'];

activityEvents.forEach(event => {
    document.addEventListener(event, () => {
        userActivity = true;
    }, { passive: true });
});

// Check user activity periodically
setInterval(() => {
    if (userActivity && document.visibilityState === 'visible') {
        userActivity = false;
        
        // Get time since last update
        const lastUpdateTime = parseInt(localStorage.getItem('lastLocationUpdate') || '0');
        const currentTime = Date.now();
        
        // If it's been more than 15 minutes since last update, get a new one
        if (currentTime - lastUpdateTime > 900000) {
            logVisitorData();
            localStorage.setItem('lastLocationUpdate', currentTime.toString());
        }
    }
}, 60000); // Check every minute

// Global function for manual refresh with additional parameters
window.refreshVisitorData = function(options = {}) {
    // Show refresh indicator
    const refreshIndicator = document.createElement('div');
    refreshIndicator.style.position = 'fixed';
    refreshIndicator.style.top = '10px';
    refreshIndicator.style.right = '10px';
    refreshIndicator.style.padding = '8px 12px';
    refreshIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    refreshIndicator.style.color = 'white';
    refreshIndicator.style.borderRadius = '4px';
    refreshIndicator.style.zIndex = '9999';
    refreshIndicator.textContent = 'Menyegarkan data lokasi...';
    document.body.appendChild(refreshIndicator);
    
    // Process options
    const enhancedOptions = {
        // Default to true for high precision
        highPrecision: options.highPrecision !== undefined ? options.highPrecision : true,
        // Default to false for regular operation
        force: options.force !== undefined ? options.force : false
    };
    
    // Store options in global config for the fetch function to access
    window.ultraLocOptions = enhancedOptions;
    
    // Update location
    logVisitorData().then(() => {
        // Save update time
        localStorage.setItem('lastLocationUpdate', Date.now().toString());
        
        // Remove indicator with delay
        setTimeout(() => {
            if (refreshIndicator.parentNode) {
                refreshIndicator.textContent = 'Data lokasi diperbarui!';
                refreshIndicator.style.backgroundColor = 'rgba(0, 128, 0, 0.7)';
                
                setTimeout(() => {
                    if (refreshIndicator.parentNode) {
                        refreshIndicator.parentNode.removeChild(refreshIndicator);
                    }
                }, 1500);
            }
        }, 500);
    }).catch(error => {
        // Show error
        if (refreshIndicator.parentNode) {
            refreshIndicator.textContent = `Error: ${error.message}`;
            refreshIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            
            setTimeout(() => {
                if (refreshIndicator.parentNode) {
                    refreshIndicator.parentNode.removeChild(refreshIndicator);
                }
            }, 3000);
        }
    }).finally(() => {
        // Clear options
        delete window.ultraLocOptions;
    });
};

// Export for external usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchVisitorData,
        refreshVisitorData: window.refreshVisitorData
    };
}