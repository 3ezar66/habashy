import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Bell, 
  X, 
  Volume2, 
  VolumeX,
  Shield,
  Activity,
  Zap,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  type: 'detection' | 'threat' | 'system' | 'network';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  details?: any;
}

export default function RealTimeAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Load real alerts from API
    loadRealAlerts();

    // Set up WebSocket connection for real-time alerts
    setupWebSocketConnection();

    // Periodically refresh alerts
    const interval = setInterval(loadRealAlerts, 30000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  const loadRealAlerts = async () => {
    try {
      const response = await fetch('/api/advanced-detection/alerts?hours=24');
      if (response.ok) {
        const data = await response.json();
        if (data.alerts && Array.isArray(data.alerts)) {
          const formattedAlerts: Alert[] = data.alerts.map((alert: any) => ({
            id: alert.id || `alert_${Date.now()}`,
            type: alert.type || 'system',
            severity: alert.severity || 'medium',
            title: alert.title || 'اعلان سیستم',
            message: alert.message || alert.description,
            timestamp: alert.timestamp || new Date().toISOString(),
            acknowledged: false,
            details: alert.details || {}
          }));
          setAlerts(formattedAlerts);
        }
      }
    } catch (error) {
      console.error('Error loading real alerts:', error);
    }
  };

  const setupWebSocketConnection = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'miner_detected' || data.type === 'scan_completed' || data.type === 'alert_generated') {
            const newAlert: Alert = {
              id: `alert_${Date.now()}`,
              type: 'detection',
              severity: data.type === 'miner_detected' ? 'high' : 'medium',
              title: data.type === 'miner_detected' ? 'ماینر جدید تشخیص داده شد' : 'اعلان سیستم',
              message: data.message || JSON.stringify(data.data),
              timestamp: new Date().toISOString(),
              acknowledged: false,
              details: data.data || {}
            };

            setAlerts(prev => [newAlert, ...prev].slice(0, 50));

            // Play sound and show notification for real alerts
            if (soundEnabled) {
              playAlertSound(newAlert.severity);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        // Reconnect after 5 seconds
        setTimeout(setupWebSocketConnection, 5000);
      };
    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
    }
  };

  const playAlertSound = (severity: string) => {
    // Create audio context for playing alert sounds
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different severities
      const frequency = severity === 'critical' ? 800 : 600;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'بحرانی';
      case 'high': return 'بالا';
      case 'medium': return 'متوسط';
      case 'low': return 'پایین';
      default: return 'نامشخص';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'detection': return <Activity className="h-4 w-4" />;
      case 'threat': return <AlertTriangle className="h-4 w-4" />;
      case 'system': return <Zap className="h-4 w-4" />;
      case 'network': return <Radio className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    toast({
      title: "تمام اعلان‌ها پاک شدند",
      description: "تاریخچه اعلان‌ها حذف شد",
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unacknowledged') return !alert.acknowledged;
    return alert.severity === filter;
  });

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-4 left-4 z-50"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className={`relative ${unacknowledgedCount > 0 ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
        >
          <Bell className="h-5 w-5" />
          {unacknowledgedCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unacknowledgedCount}
            </Badge>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-4 left-4 w-96 z-50"
    >
      <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Bell className="ml-2 h-5 w-5 text-blue-600" />
              اعلان‌های بلادرنگ
              {unacknowledgedCount > 0 && (
                <Badge variant="destructive" className="mr-2 animate-pulse">
                  {unacknowledgedCount}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center space-x-reverse space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-1 mt-2">
            {['all', 'unacknowledged', 'critical', 'high', 'medium', 'low'].map(filterType => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="text-xs px-2 py-1"
              >
                {filterType === 'all' ? 'همه' :
                 filterType === 'unacknowledged' ? 'تأیید نشده' :
                 getSeverityText(filterType)}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredAlerts.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>هیچ اعلانی وجود ندارد</p>
                  <p className="text-sm">وضعیت امن</p>
                </div>
              ) : (
                filteredAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 border-b border-gray-200 ${
                      alert.acknowledged ? 'opacity-60' : ''
                    } ${getSeverityColor(alert.severity)} ${
                      alert.severity === 'critical' ? 'animate-pulse' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-reverse space-x-3">
                        <div className={`mt-1 ${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'high' ? 'text-orange-600' :
                          alert.severity === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {getTypeIcon(alert.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-reverse space-x-2 mb-1">
                            <h4 className="font-medium text-sm">{alert.title}</h4>
                            <Badge 
                              variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {getSeverityText(alert.severity)}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(alert.timestamp).toLocaleString('fa-IR')}</span>
                            <div className="flex items-center space-x-reverse space-x-2">
                              {alert.details?.confidence && (
                                <span className="persian-numbers">
                                  اطمینان: {alert.details.confidence.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-xs px-2 py-1"
                        >
                          تأیید
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          
          {alerts.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllAlerts}
                className="w-full text-xs"
              >
                پاک کردن همه
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
