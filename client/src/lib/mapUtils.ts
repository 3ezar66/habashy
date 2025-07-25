// Ilam province geographical boundaries
export const ILAM_BOUNDS = {
  north: 34.0,
  south: 32.0,
  east: 48.5,
  west: 46.0,
  center: [33.0, 47.25] as [number, number]
};

// Major cities in Ilam province with coordinates
export const ILAM_CITIES = {
  'ایلام': [33.6374, 46.4227],
  'دهلران': [32.6942, 47.2678],
  'مهران': [33.1225, 46.1614],
  'آبدانان': [32.9919, 47.4161],
  'دره‌شهر': [33.1447, 47.3667],
  'ایوان': [33.8078, 46.2892],
  'ملکشاهی': [33.1581, 46.7228],
  'چرداول': [33.1331, 47.0328],
  'شیروان چرداول': [33.3831, 47.0047],
  'بدره': [33.7175, 47.1175]
} as const;

// Get color based on threat level
export function getThreatLevelColor(threatLevel: 'low' | 'medium' | 'high'): string {
  switch (threatLevel) {
    case 'high':
      return '#ef4444'; // Red
    case 'medium':
      return '#f59e0b'; // Orange/Yellow
    case 'low':
      return '#10b981'; // Green
    default:
      return '#6b7280'; // Gray
  }
}

// Get icon based on device type
export function getDeviceTypeIcon(deviceType: string): string {
  const type = deviceType.toLowerCase();
  if (type.includes('miner') || type.includes('mining')) {
    return '⚡';
  } else if (type.includes('router') || type.includes('gateway')) {
    return '📡';
  } else if (type.includes('camera') || type.includes('surveillance')) {
    return '📹';
  } else if (type.includes('server')) {
    return '🖥️';
  } else if (type.includes('iot') || type.includes('sensor')) {
    return '📊';
  } else {
    return '🔍';
  }
}

// Format hash rate for display
export function formatHashRate(hashRate: string | number): string {
  if (typeof hashRate === 'string') {
    return hashRate;
  }
  
  if (hashRate < 1000) {
    return `${hashRate} H/s`;
  } else if (hashRate < 1000000) {
    return `${(hashRate / 1000).toFixed(1)} KH/s`;
  } else if (hashRate < 1000000000) {
    return `${(hashRate / 1000000).toFixed(1)} MH/s`;
  } else if (hashRate < 1000000000000) {
    return `${(hashRate / 1000000000).toFixed(1)} GH/s`;
  } else {
    return `${(hashRate / 1000000000000).toFixed(1)} TH/s`;
  }
}

// Format power consumption for display
export function formatPowerConsumption(power: number): string {
  if (power < 1000) {
    return `${power} W`;
  } else {
    return `${(power / 1000).toFixed(1)} kW`;
  }
}

// Format confidence score for display
export function formatConfidenceScore(score: number): string {
  return `${Math.round(score)}%`;
}

// Check if coordinates are within Ilam province
export function isWithinIlamBounds(lat: number, lon: number): boolean {
  return lat >= ILAM_BOUNDS.south && 
         lat <= ILAM_BOUNDS.north && 
         lon >= ILAM_BOUNDS.west && 
         lon <= ILAM_BOUNDS.east;
}

// Get distance between two points in kilometers
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get nearest city to given coordinates
export function getNearestCity(lat: number, lon: number): string {
  let nearestCity = 'نامشخص';
  let minDistance = Infinity;
  
  Object.entries(ILAM_CITIES).forEach(([cityName, [cityLat, cityLon]]) => {
    const distance = getDistance(lat, lon, cityLat, cityLon);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = cityName;
    }
  });
  
  return nearestCity;
}

// Generate random coordinates within Ilam province (for testing)
export function generateRandomIlamCoordinates(): [number, number] {
  const lat = ILAM_BOUNDS.south + Math.random() * (ILAM_BOUNDS.north - ILAM_BOUNDS.south);
  const lon = ILAM_BOUNDS.west + Math.random() * (ILAM_BOUNDS.east - ILAM_BOUNDS.west);
  return [lat, lon];
}

// Create bounds object for map fitting
export function getIlamMapBounds() {
  return [
    [ILAM_BOUNDS.south, ILAM_BOUNDS.west],
    [ILAM_BOUNDS.north, ILAM_BOUNDS.east]
  ] as [[number, number], [number, number]];
}
