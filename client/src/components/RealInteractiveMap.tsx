import { useState, useEffect, useRef } from 'react';
import '../styles/windows11.css';

interface DetectedDevice {
  id: string;
  ipAddress: string;
  macAddress?: string;
  latitude: number;
  longitude: number;
  city?: string;
  deviceType: string;
  suspicionScore: number;
  threatLevel: 'critical' | 'high' | 'medium' | 'low';
  detectionTime: string;
  geolocation?: any;
}

interface IranProvince {
  name: string;
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
}

export default function RealInteractiveMap() {
  const [detectedDevices, setDetectedDevices] = useState<DetectedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DetectedDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string>('ilam');
  const mapRef = useRef<HTMLDivElement>(null);

  // Iran provinces data with real coordinates
  const iranProvinces: { [key: string]: IranProvince } = {
    'ilam': {
      name: 'استان ایلام',
      center: { lat: 33.6374, lng: 46.4227 },
      bounds: { north: 34.5, south: 32.0, east: 48.5, west: 45.5 }
    },
    'tehran': {
      name: 'استان تهران',
      center: { lat: 35.6892, lng: 51.3890 },
      bounds: { north: 36.0, south: 35.0, east: 52.0, west: 50.5 }
    },
    'isfahan': {
      name: 'استان اصفهان',
      center: { lat: 32.6546, lng: 51.6680 },
      bounds: { north: 34.0, south: 31.0, east: 53.0, west: 49.5 }
    }
  };

  useEffect(() => {
    loadRealDevices();
    const interval = setInterval(loadRealDevices, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRealDevices = async () => {
    try {
      setIsLoading(true);
      
      // Get detected miners from real API
      const response = await fetch('/api/miners');
      if (response.ok) {
        const miners = await response.json();
        
        const devices: DetectedDevice[] = miners.map((miner: any) => ({
          id: miner.id.toString(),
          ipAddress: miner.ip || miner.ipAddress,
          macAddress: miner.mac || miner.macAddress,
          latitude: miner.latitude || 33.6374,
          longitude: miner.longitude || 46.4227,
          city: miner.city || 'ایلام',
          deviceType: miner.device_type || miner.deviceType || 'unknown',
          suspicionScore: miner.suspicion_score || miner.suspicionScore || 0,
          threatLevel: getThreatLevel(miner.suspicion_score || miner.suspicionScore || 0),
          detectionTime: miner.detection_time || miner.detectionTime || new Date().toISOString(),
          geolocation: miner.geolocation
        }));

        setDetectedDevices(devices);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getThreatLevel = (score: number): 'critical' | 'high' | 'medium' | 'low' => {
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getRouteToDevice = async (device: DetectedDevice) => {
    try {
      // Get user's current location for routing
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Open Google Maps with route
            const googleMapsUrl = `https://maps.google.com/maps?q=${device.latitude},${device.longitude}&ll=${userLat},${userLng}&z=15&t=m&dir=1`;
            window.open(googleMapsUrl, '_blank');
          },
          (error) => {
            // Fallback: open location without routing
            const fallbackUrl = `https://maps.google.com/maps?q=${device.latitude},${device.longitude}&z=15&t=m`;
            window.open(fallbackUrl, '_blank');
          }
        );
      }
    } catch (error) {
      console.error('Error getting route:', error);
    }
  };

  const enhanceLocationWithRealGeoIP = async (device: DetectedDevice) => {
    try {
      const response = await fetch('/api/geolocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress: device.ipAddress })
      });

      if (response.ok) {
        const geoData = await response.json();
        
        // Update device with enhanced location data
        setDetectedDevices(prev => prev.map(d => 
          d.id === device.id 
            ? { ...d, geolocation: geoData, 
                latitude: geoData.location?.lat || d.latitude,
                longitude: geoData.location?.lon || d.longitude,
                city: geoData.location?.city || d.city
              }
            : d
        ));
      }
    } catch (error) {
      console.error('Error enhancing location:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const currentProvince = iranProvinces[selectedProvince];

  return (
    <div className="win11-animate-in" style={{ height: '100%' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <select 
          className="win11-input" 
          value={selectedProvince}
          onChange={(e) => setSelectedProvince(e.target.value)}
          style={{ width: '200px' }}
        >
          {Object.entries(iranProvinces).map(([key, province]) => (
            <option key={key} value={key}>{province.name}</option>
          ))}
        </select>
        
        <button 
          onClick={loadRealDevices}
          className="win11-button win11-button-primary"
          disabled={isLoading}
        >
          {isLoading ? '🔄 در حال بارگذاری...' : '🔍 اسکن مجدد'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', height: 'calc(100vh - 200px)' }}>
        {/* Interactive Map */}
        <div className="win11-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="win11-card-header">
            <h3 className="win11-card-title">نقشه {currentProvince.name}</h3>
            <p className="win11-card-subtitle">
              {detectedDevices.length} دستگاه شناسایی شده
            </p>
          </div>
          
          <div 
            ref={mapRef}
            style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              position: 'relative',
              borderRadius: '0 0 var(--win11-radius-large) var(--win11-radius-large)',
              overflow: 'hidden'
            }}
          >
            {/* Map Background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              opacity: 0.3
            }} />

            {/* Province Center Marker */}
            <div 
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '24px',
                animation: 'pulse 2s infinite'
              }}
            >
              🏛️
            </div>

            {/* Device Markers */}
            {detectedDevices.map((device, index) => {
              // Calculate relative position based on province bounds
              const relativeX = ((device.longitude - currentProvince.bounds.west) / 
                               (currentProvince.bounds.east - currentProvince.bounds.west)) * 100;
              const relativeY = ((currentProvince.bounds.north - device.latitude) / 
                               (currentProvince.bounds.north - currentProvince.bounds.south)) * 100;

              return (
                <div
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  style={{
                    position: 'absolute',
                    left: `${Math.max(5, Math.min(95, relativeX))}%`,
                    top: `${Math.max(5, Math.min(95, relativeY))}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    fontSize: '20px',
                    filter: `drop-shadow(0 0 4px ${getThreatColor(device.threatLevel)})`,
                    animation: device.threatLevel === 'critical' ? 'pulse 1s infinite' : 'none',
                    zIndex: device.threatLevel === 'critical' ? 10 : 5
                  }}
                  title={`${device.ipAddress} - ${device.deviceType}`}
                >
                  {device.threatLevel === 'critical' ? '🚨' : 
                   device.threatLevel === 'high' ? '⚠️' : 
                   device.threatLevel === 'medium' ? '🔍' : '📱'}
                </div>
              );
            })}

            {/* Map Legend */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '12px',
              borderRadius: 'var(--win11-radius-medium)',
              backdropFilter: 'blur(10px)',
              fontSize: '12px'
            }}>
              <div style={{ marginBottom: '8px', fontWeight: '600' }}>راهنما:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>🚨 بحرانی</div>
                <div>⚠️ خطرناک</div>
                <div>🔍 متوسط</div>
                <div>📱 کم خطر</div>
              </div>
            </div>
          </div>
        </div>

        {/* Device Details Panel */}
        <div className="win11-card">
          <div className="win11-card-header">
            <h3 className="win11-card-title">جزئیات دستگاه</h3>
          </div>
          <div className="win11-card-content">
            {selectedDevice ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '12px',
                  background: `${getThreatColor(selectedDevice.threatLevel)}15`,
                  borderRadius: 'var(--win11-radius-medium)',
                  border: `1px solid ${getThreatColor(selectedDevice.threatLevel)}`
                }}>
                  <div style={{ 
                    color: getThreatColor(selectedDevice.threatLevel),
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    سطح تهدید: {selectedDevice.threatLevel === 'critical' ? 'بحرانی' :
                                  selectedDevice.threatLevel === 'high' ? 'بالا' :
                                  selectedDevice.threatLevel === 'medium' ? 'متوسط' : 'پایین'}
                  </div>
                  <div>امتیاز شک: {selectedDevice.suspicionScore}%</div>
                </div>

                <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>آدرس IP:</span>
                    <span style={{ fontFamily: 'monospace' }}>{selectedDevice.ipAddress}</span>
                  </div>
                  
                  {selectedDevice.macAddress && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>آدرس MAC:</span>
                      <span style={{ fontFamily: 'monospace' }}>{selectedDevice.macAddress}</span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>نوع دستگاه:</span>
                    <span>{selectedDevice.deviceType}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>شهر:</span>
                    <span>{selectedDevice.city}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>مختصات:</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {selectedDevice.latitude.toFixed(4)}, {selectedDevice.longitude.toFixed(4)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>زمان تشخیص:</span>
                    <span>{new Date(selectedDevice.detectionTime).toLocaleString('fa-IR')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => getRouteToDevice(selectedDevice)}
                    className="win11-button win11-button-primary"
                    style={{ width: '100%' }}
                  >
                    🗺️ مسیریابی به مکان
                  </button>
                  
                  <button 
                    onClick={() => enhanceLocationWithRealGeoIP(selectedDevice)}
                    className="win11-button win11-button-secondary"
                    style={{ width: '100%' }}
                  >
                    📍 تشخیص دقیق موقعیت
                  </button>
                </div>

                {selectedDevice.geolocation && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--win11-surface-alt)', 
                    borderRadius: 'var(--win11-radius-medium)',
                    fontSize: '12px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>اطلاعات جغرافیایی:</div>
                    <div>ISP: {selectedDevice.geolocation.location?.isp || 'نامشخص'}</div>
                    <div>منطقه زمانی: {selectedDevice.geolocation.location?.timezone || 'Asia/Tehran'}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: 'var(--win11-text-secondary)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                <div>روی یک دستگاه کلیک کنید</div>
                <div style={{ fontSize: '12px' }}>برای مشاهده جزئیات</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="win11-card" style={{ marginTop: '16px' }}>
        <div className="win11-card-header">
          <h3 className="win11-card-title">لیست دستگاه‌های تشخیص داده شده</h3>
        </div>
        <div className="win11-card-content">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>در حال بارگذاری...</div>
          ) : detectedDevices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--win11-text-secondary)' }}>
              هیچ دستگاهی تشخیص داده نشده
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {detectedDevices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: selectedDevice?.id === device.id ? 'var(--win11-accent)15' : 'var(--win11-surface-alt)',
                    borderRadius: 'var(--win11-radius-medium)',
                    cursor: 'pointer',
                    border: selectedDevice?.id === device.id ? '1px solid var(--win11-accent)' : '1px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>
                      {device.threatLevel === 'critical' ? '🚨' : 
                       device.threatLevel === 'high' ? '⚠️' : 
                       device.threatLevel === 'medium' ? '🔍' : '📱'}
                    </span>
                    <div>
                      <div style={{ fontWeight: '500' }}>{device.ipAddress}</div>
                      <div style={{ fontSize: '12px', color: 'var(--win11-text-secondary)' }}>
                        {device.deviceType} - {device.city}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    background: getThreatColor(device.threatLevel), 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {device.suspicionScore}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
