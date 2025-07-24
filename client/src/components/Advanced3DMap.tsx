import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Map, 
  Layers, 
  Filter, 
  Maximize2, 
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Target,
  Satellite,
  Radio,
  Thermometer,
  Zap,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DetectedDevice {
  id: string;
  lat: number;
  lng: number;
  type: 'asic' | 'gpu' | 'fpga' | 'unknown';
  confidence: number;
  threat_level: 'critical' | 'high' | 'medium' | 'low';
  detection_methods: string[];
  power_consumption?: number;
  temperature?: number;
  rf_strength?: number;
  vibration_level?: number;
  last_seen: string;
}

interface MapSettings {
  show_heatmap: boolean;
  show_detection_radius: boolean;
  filter_by_threat: string[];
  filter_by_type: string[];
  zoom_level: number;
  tilt_angle: number;
}

export default function Advanced3DMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detectedDevices, setDetectedDevices] = useState<DetectedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DetectedDevice | null>(null);
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    show_heatmap: true,
    show_detection_radius: true,
    filter_by_threat: ['critical', 'high', 'medium', 'low'],
    filter_by_type: ['asic', 'gpu', 'fpga', 'unknown'],
    zoom_level: 12,
    tilt_angle: 45
  });

  // Ilam Province boundaries
  const ilamBounds = {
    north: 34.5,
    south: 32.0,
    east: 48.5,
    west: 45.5,
    center: { lat: 33.6374, lng: 46.4227 }
  };

  useEffect(() => {
    // Load real detected devices from API
    loadRealDevices();

    // Set up real-time updates
    const interval = setInterval(() => {
      loadRealDevices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadRealDevices = async () => {
    try {
      const response = await fetch('/api/miners');
      if (response.ok) {
        const miners = await response.json();
        const devices: DetectedDevice[] = miners.map((miner: any) => ({
          id: miner.id.toString(),
          lat: miner.latitude || 33.6374,
          lng: miner.longitude || 46.4227,
          type: miner.deviceType || 'unknown',
          confidence: miner.suspicionScore || 0,
          threat_level: miner.threatLevel || 'low',
          detection_methods: miner.detectionMethod ? miner.detectionMethod.split(',') : [],
          power_consumption: miner.powerConsumption || 0,
          temperature: null,
          rf_strength: null,
          vibration_level: null,
          last_seen: miner.detectionTime || new Date().toISOString()
        }));
        setDetectedDevices(devices);
      }
    } catch (error) {
      console.error('Error loading real devices:', error);
      setDetectedDevices([]);
    }
  };



  const getDeviceColor = (device: DetectedDevice) => {
    switch (device.threat_level) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getDeviceIcon = (type: DetectedDevice['type']) => {
    switch (type) {
      case 'asic': return '⚡';
      case 'gpu': return '🎮';
      case 'fpga': return '🔧';
      default: return '❓';
    }
  };

  const getTypeLabel = (type: DetectedDevice['type']) => {
    switch (type) {
      case 'asic': return 'ماینر ASIC';
      case 'gpu': return 'ماینر GPU';
      case 'fpga': return 'ماینر FPGA';
      default: return 'نامشخص';
    }
  };

  const getThreatLabel = (level: DetectedDevice['threat_level']) => {
    switch (level) {
      case 'critical': return 'بحرانی';
      case 'high': return 'بالا';
      case 'medium': return 'متوسط';
      case 'low': return 'پایین';
      default: return 'نامشخص';
    }
  };

  const filteredDevices = detectedDevices.filter(device => 
    mapSettings.filter_by_threat.includes(device.threat_level) &&
    mapSettings.filter_by_type.includes(device.type)
  );

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetMapView = () => {
    setMapSettings(prev => ({
      ...prev,
      zoom_level: 12,
      tilt_angle: 45
    }));
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-white`}>
      <Card className={`h-full ${isFullscreen ? 'rounded-none' : 'rounded-lg'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center text-xl">
            <Map className="ml-2 h-6 w-6 text-primary" />
            نقشه سه‌بعدی تشخیص‌های بلادرنگ
          </CardTitle>
          
          <div className="flex items-center space-x-reverse space-x-2">
            <Badge variant="outline" className="persian-numbers">
              {filteredDevices.length} دستگاه
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 relative">
          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-10 space-y-2">
            <Card className="p-3 bg-white/90 backdrop-blur">
              <div className="space-y-3">
                <div className="flex items-center space-x-reverse space-x-2">
                  <ZoomIn className="h-4 w-4" />
                  <Slider
                    value={[mapSettings.zoom_level]}
                    onValueChange={(value) => setMapSettings(prev => ({ ...prev, zoom_level: value[0] }))}
                    max={18}
                    min={8}
                    step={1}
                    className="w-20"
                  />
                  <ZoomOut className="h-4 w-4" />
                </div>
                
                <div className="flex items-center space-x-reverse space-x-2">
                  <span className="text-xs">زاویه</span>
                  <Slider
                    value={[mapSettings.tilt_angle]}
                    onValueChange={(value) => setMapSettings(prev => ({ ...prev, tilt_angle: value[0] }))}
                    max={60}
                    min={0}
                    step={5}
                    className="w-20"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetMapView}
                  className="w-full"
                >
                  <RotateCcw className="h-3 w-3 ml-1" />
                  بازنش��نی
                </Button>
              </div>
            </Card>
          </div>

          {/* Filter Panel */}
          <div className="absolute top-4 right-4 z-10">
            <Card className="p-3 bg-white/90 backdrop-blur">
              <div className="space-y-3 min-w-[200px]">
                <div>
                  <label className="text-xs font-medium mb-2 block">فیلتر سطح تهدید</label>
                  <div className="flex flex-wrap gap-1">
                    {(['critical', 'high', 'medium', 'low'] as const).map(level => (
                      <Button
                        key={level}
                        variant={mapSettings.filter_by_threat.includes(level) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setMapSettings(prev => ({
                            ...prev,
                            filter_by_threat: prev.filter_by_threat.includes(level)
                              ? prev.filter_by_threat.filter(l => l !== level)
                              : [...prev.filter_by_threat, level]
                          }));
                        }}
                        className="text-xs px-2 py-1"
                      >
                        {getThreatLabel(level)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-2 block">نوع دستگاه</label>
                  <div className="flex flex-wrap gap-1">
                    {(['asic', 'gpu', 'fpga', 'unknown'] as const).map(type => (
                      <Button
                        key={type}
                        variant={mapSettings.filter_by_type.includes(type) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setMapSettings(prev => ({
                            ...prev,
                            filter_by_type: prev.filter_by_type.includes(type)
                              ? prev.filter_by_type.filter(t => t !== type)
                              : [...prev.filter_by_type, type]
                          }));
                        }}
                        className="text-xs px-2 py-1"
                      >
                        {getTypeLabel(type)}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-reverse space-x-2">
                    <input
                      type="checkbox"
                      checked={mapSettings.show_heatmap}
                      onChange={(e) => setMapSettings(prev => ({ ...prev, show_heatmap: e.target.checked }))}
                    />
                    <span className="text-xs">نقشه حرارتی</span>
                  </label>
                  
                  <label className="flex items-center space-x-reverse space-x-2">
                    <input
                      type="checkbox"
                      checked={mapSettings.show_detection_radius}
                      onChange={(e) => setMapSettings(prev => ({ ...prev, show_detection_radius: e.target.checked }))}
                    />
                    <span className="text-xs">شعاع تشخیص</span>
                  </label>
                </div>
              </div>
            </Card>
          </div>

          {/* 3D Map Container */}
          <div 
            ref={mapRef}
            className={`relative bg-gradient-to-br from-blue-50 to-green-50 ${
              isFullscreen ? 'h-screen' : 'h-[600px]'
            } overflow-hidden`}
          >
            {/* Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-blue-200 to-purple-200">
              {/* Grid Lines */}
              <svg className="absolute inset-0 w-full h-full opacity-30">
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#4B5563" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Detected Devices */}
            <div className="absolute inset-0">
              <AnimatePresence>
                {filteredDevices.map((device, index) => {
                  const x = ((device.lng - ilamBounds.west) / (ilamBounds.east - ilamBounds.west)) * 100;
                  const y = ((ilamBounds.north - device.lat) / (ilamBounds.north - ilamBounds.south)) * 100;
                  
                  return (
                    <motion.div
                      key={device.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onClick={() => setSelectedDevice(device)}
                    >
                      {/* Detection Radius */}
                      {mapSettings.show_detection_radius && (
                        <motion.div
                          className="absolute rounded-full border-2 opacity-30"
                          style={{
                            borderColor: getDeviceColor(device),
                            width: `${device.confidence * 2}px`,
                            height: `${device.confidence * 2}px`,
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                          }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      
                      {/* Device Marker */}
                      <motion.div
                        className="relative z-10"
                        animate={{ 
                          y: [0, -5, 0],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: getDeviceColor(device) }}
                        >
                          {getDeviceIcon(device.type)}
                        </div>
                        
                        {/* Threat Level Indicator */}
                        <div className="absolute -top-1 -right-1">
                          <div 
                            className="w-3 h-3 rounded-full border border-white"
                            style={{ backgroundColor: getDeviceColor(device) }}
                          />
                        </div>
                      </motion.div>

                      {/* Signal Waves */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {[1, 2, 3].map(ring => (
                          <motion.div
                            key={ring}
                            className="absolute rounded-full border"
                            style={{
                              borderColor: getDeviceColor(device),
                              width: `${ring * 20}px`,
                              height: `${ring * 20}px`,
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }}
                            animate={{ 
                              scale: [1, 2],
                              opacity: [0.8, 0]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              delay: ring * 0.5
                            }}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Heatmap Overlay */}
            {mapSettings.show_heatmap && (
              <div className="absolute inset-0 pointer-events-none">
                {filteredDevices.map(device => {
                  const x = ((device.lng - ilamBounds.west) / (ilamBounds.east - ilamBounds.west)) * 100;
                  const y = ((ilamBounds.north - device.lat) / (ilamBounds.north - ilamBounds.south)) * 100;
                  
                  return (
                    <div
                      key={`heat-${device.id}`}
                      className="absolute rounded-full"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: `${device.confidence * 3}px`,
                        height: `${device.confidence * 3}px`,
                        background: `radial-gradient(circle, ${getDeviceColor(device)}20, transparent)`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Device Details Panel */}
          <AnimatePresence>
            {selectedDevice && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="absolute bottom-4 right-4 z-20"
              >
                <Card className="w-80 bg-white/95 backdrop-blur">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{selectedDevice.id}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDevice(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">نوع دستگاه</label>
                        <div className="font-medium">{getTypeLabel(selectedDevice.type)}</div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-muted-foreground">سطح تهدید</label>
                        <Badge 
                          variant={selectedDevice.threat_level === 'critical' ? 'destructive' : 'secondary'}
                          className="mt-1"
                        >
                          {getThreatLabel(selectedDevice.threat_level)}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">اطمینان تشخیص</label>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${selectedDevice.confidence}%`,
                              backgroundColor: getDeviceColor(selectedDevice)
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium persian-numbers">
                          {selectedDevice.confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 ml-2 text-yellow-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">مصرف برق</div>
                          <div className="font-medium persian-numbers">
                            {selectedDevice.power_consumption?.toFixed(0)} W
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Thermometer className="h-4 w-4 ml-2 text-red-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">دما</div>
                          <div className="font-medium persian-numbers">
                            {selectedDevice.temperature?.toFixed(1)}°C
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Radio className="h-4 w-4 ml-2 text-blue-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">قدرت RF</div>
                          <div className="font-medium persian-numbers">
                            {selectedDevice.rf_strength?.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 ml-2 text-green-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">ارتعاش</div>
                          <div className="font-medium persian-numbers">
                            {selectedDevice.vibration_level?.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">روش‌های تشخیص</label>
                      <div className="flex flex-wrap gap-1">
                        {selectedDevice.detection_methods.map(method => (
                          <Badge key={method} variant="outline" className="text-xs">
                            {method.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      آخرین مشاهده: {new Date(selectedDevice.last_seen).toLocaleString('fa-IR')}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
