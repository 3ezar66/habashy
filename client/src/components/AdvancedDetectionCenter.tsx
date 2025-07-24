import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Radio, 
  Zap, 
  Thermometer, 
  Volume2, 
  Brain, 
  Radar,
  AlertTriangle,
  Activity,
  Shield,
  Eye,
  Waves,
  Target,
  Play,
  Square,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface DetectionModule {
  id: string;
  name: string;
  nameEn: string;
  icon: any;
  status: 'active' | 'inactive' | 'scanning';
  confidence: number;
  lastDetection?: string;
  detectionCount: number;
  color: string;
}

interface DetectionResult {
  device_id: string;
  method: string;
  confidence: number;
  threat_level: string;
  time: string;
  details?: any;
}

interface DetectionSession {
  session_id: string;
  status: string;
  total_detections: number;
  start_time: string;
}

export default function AdvancedDetectionCenter() {
  const [isScanning, setIsScanning] = useState(false);
  const [currentSession, setCurrentSession] = useState<DetectionSession | null>(null);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [realTimeAlerts, setRealTimeAlerts] = useState<any[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [detectionStats, setDetectionStats] = useState<any>({});

  const [detectionModules, setDetectionModules] = useState<DetectionModule[]>([
    {
      id: 'rf_detection',
      name: 'تشخیص امواج رادیویی',
      nameEn: 'RF Detection',
      icon: Radio,
      status: 'inactive',
      confidence: 0,
      detectionCount: 0,
      color: '#3B82F6'
    },
    {
      id: 'vibration_analysis',
      name: 'تحلیل ارتعاشات',
      nameEn: 'Vibration Analysis',
      icon: Activity,
      status: 'inactive',
      confidence: 0,
      detectionCount: 0,
      color: '#EF4444'
    },
    {
      id: 'electromagnetic_scan',
      name: 'اسکن الکترومغناطیسی',
      nameEn: 'EM Field Scan',
      icon: Zap,
      status: 'inactive',
      confidence: 0,
      detectionCount: 0,
      color: '#F59E0B'
    },
    {
      id: 'thermal_imaging',
      name: 'تصویربرداری حرارتی',
      nameEn: 'Thermal Imaging',
      icon: Thermometer,
      status: 'inactive',
      confidence: 0,
      detectionCount: 0,
      color: '#DC2626'
    },
    {
      id: 'acoustic_fingerprinting',
      name: 'اثرانگشت آکوستیک',
      nameEn: 'Acoustic Fingerprinting',
      icon: Volume2,
      status: 'inactive',
      confidence: 0,
      detectionCount: 0,
      color: '#7C3AED'
    },
    {
      id: 'ai_classification',
      name: 'طبقه‌بندی هوش مصنوعی',
      nameEn: 'AI Classification',
      icon: Brain,
      status: 'inactive',
      confidence: 0,
      detectionCount: 0,
      color: '#059669'
    }
  ]);

  useEffect(() => {
    // Poll for detection updates when scanning
    let interval: NodeJS.Timeout;
    
    if (isScanning && currentSession) {
      interval = setInterval(async () => {
        await fetchDetectionStatus();
        await fetchRealtimeAlerts();
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning, currentSession]);

  const startAdvancedDetection = async () => {
    setIsScanning(true);
    setOverallProgress(0);
    setDetectionResults([]);
    
    try {
      const response = await apiRequest('POST', '/api/advanced-detection/start', {
        detection_types: detectionModules.map(m => m.id),
        location: [33.6374, 46.4227], // Ilam coordinates
        duration: 300 // 5 minutes
      });

      const data = await response.json();
      setCurrentSession(data);
      
      // Update module statuses to scanning
      setDetectionModules(prev => 
        prev.map(module => ({ ...module, status: 'scanning' as const }))
      );

      toast({
        title: "تشخیص پیشرفته شروع شد",
        description: "تمام ماژول‌های تشخیص فعال شدند",
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setOverallProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 1;
        });
      }, 3000); // 5 minutes total

    } catch (error) {
      setIsScanning(false);
      toast({
        title: "خطا در شروع تشخیص پیشرفته",
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive',
      });
    }
  };

  const stopAdvancedDetection = async () => {
    if (!currentSession) return;

    try {
      await apiRequest('POST', `/api/advanced-detection/stop/${currentSession.session_id}`, {});
      
      setIsScanning(false);
      setDetectionModules(prev => 
        prev.map(module => ({ ...module, status: 'inactive' as const }))
      );

      toast({
        title: "تشخیص پیشرفته متوقف شد",
        description: "تمام ماژول‌های تشخیص غیرفعال شدند",
      });

    } catch (error) {
      toast({
        title: "خطا در توقف تشخیص",
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive',
      });
    }
  };

  const fetchDetectionStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/advanced-detection/status', {});
      const data = await response.json();
      
      setDetectionStats(data);

      // Update modules with latest detection counts
      if (data.detections_by_method) {
        setDetectionModules(prev => 
          prev.map(module => ({
            ...module,
            detectionCount: data.detections_by_method[module.id] || 0,
            confidence: data.confidence_by_method?.[module.id] || 0,
            status: isScanning ? 'scanning' as const : 'inactive' as const
          }))
        );
      }

    } catch (error) {
      console.error('Error fetching detection status:', error);
    }
  };

  const fetchRealtimeAlerts = async () => {
    try {
      const response = await apiRequest('GET', '/api/advanced-detection/alerts?hours=1', {});
      const data = await response.json();
      
      setRealTimeAlerts(data.alerts || []);

    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getThreatLevelText = (level: string) => {
    switch (level) {
      case 'critical': return 'بحرانی';
      case 'high': return 'بالا';
      case 'medium': return 'متوسط';
      case 'low': return 'پایین';
      default: return 'نامشخص';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-l from-blue-600 via-purple-600 to-blue-800 text-white">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl" style={{ fontFamily: "'Aref Ruqaa Ink', serif" }}>
            <Radar className="ml-3 h-8 w-8" />
            مرکز تشخیص پیشرفته و چندوجهی
          </CardTitle>
          <p className="text-blue-100" style={{ fontFamily: "'Noto Naskh Arabic', serif" }}>
            تشخیص دستگاه‌های ماینر با استفاده از ۶ روش پیشرفته تکنولوژی
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Button
              onClick={isScanning ? stopAdvancedDetection : startAdvancedDetection}
              variant={isScanning ? "destructive" : "secondary"}
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {isScanning ? (
                <>
                  <Square className="ml-2 h-5 w-5" />
                  توقف تشخیص
                </>
              ) : (
                <>
                  <Play className="ml-2 h-5 w-5" />
                  شروع تشخیص پیشرفته
                </>
              )}
            </Button>

            {isScanning && (
              <div className="flex-1 min-w-[200px]">
                <div className="flex justify-between text-sm mb-2">
                  <span>پیشرفت کلی</span>
                  <span className="persian-numbers">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            )}

            <div className="flex items-center space-x-reverse space-x-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold persian-numbers">
                  {detectionStats.total_detections || 0}
                </div>
                <div className="text-blue-200">کل تشخیص‌ها</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold persian-numbers">
                  {detectionStats.recent_24h || 0}
                </div>
                <div className="text-blue-200">۲۴ ساعت اخیر</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detection Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {detectionModules.map((module) => (
          <motion.div
            key={module.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              {module.status === 'scanning' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: module.color }}
                    >
                      <module.icon className="h-5 w-5" />
                    </div>
                    <div className="mr-3">
                      <CardTitle className="text-base">{module.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{module.nameEn}</p>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={module.status === 'scanning' ? 'default' : 'secondary'}
                    className={module.status === 'scanning' ? 'animate-pulse' : ''}
                  >
                    {module.status === 'scanning' ? 'فعال' : 
                     module.status === 'active' ? 'آماده' : 'غیرفعال'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">تعداد تشخیص‌ها</span>
                    <span className="font-semibold persian-numbers">{module.detectionCount}</span>
                  </div>
                  
                  {module.status === 'scanning' && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>اطمینان</span>
                        <span className="persian-numbers">{Math.round(module.confidence)}%</span>
                      </div>
                      <Progress value={module.confidence} className="h-1" />
                    </div>
                  )}
                  
                  {module.lastDetection && (
                    <div className="text-xs text-muted-foreground">
                      آخرین تشخیص: {module.lastDetection}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="detections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detections" className="flex items-center">
            <Target className="ml-2 h-4 w-4" />
            نتایج تشخیص
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center">
            <AlertTriangle className="ml-2 h-4 w-4" />
            اعلان‌های فوری
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center">
            <Eye className="ml-2 h-4 w-4" />
            تحلیل و آمار
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>آخرین تشخیص‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {detectionResults.length > 0 ? (
                    detectionResults.slice(0, 10).map((result, index) => (
                      <motion.div
                        key={`${result.device_id}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-reverse space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getThreatLevelColor(result.threat_level)}`} />
                          <div>
                            <div className="font-medium">{result.device_id}</div>
                            <div className="text-sm text-muted-foreground">{result.method}</div>
                          </div>
                        </div>
                        
                        <div className="text-left">
                          <Badge variant="outline" className="mb-1">
                            {getThreatLevelText(result.threat_level)}
                          </Badge>
                          <div className="text-xs text-muted-foreground persian-numbers">
                            اطمینان: {(result.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Radar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>هنوز تشخیصی انجام نشده است</p>
                      <p className="text-sm">برای شروع، دکمه "شروع تشخیص پیشرفته" را فشار دهید</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اعلان‌های بلادرنگ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {realTimeAlerts.length > 0 ? (
                  realTimeAlerts.map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 border-r-4 ${
                        alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                        alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                        alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      } rounded-lg`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {new Date(alert.time).toLocaleString('fa-IR')}
                          </div>
                        </div>
                        
                        <Badge 
                          variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                        >
                          {getThreatLevelText(alert.severity)}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>هیچ اعلان فوری‌ای وجود ندارد</p>
                    <p className="text-sm">وضعیت امن</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزیع روش‌های تشخیص</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detectionModules.map((module) => (
                    <div key={module.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full ml-3"
                          style={{ backgroundColor: module.color }}
                        />
                        <span className="text-sm">{module.name}</span>
                      </div>
                      <span className="font-semibold persian-numbers">
                        {module.detectionCount}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>آمار سطح تهدی��</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(detectionStats.detections_by_threat_level || {}).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ml-3 ${getThreatLevelColor(level)}`} />
                        <span className="text-sm">{getThreatLevelText(level)}</span>
                      </div>
                      <span className="font-semibold persian-numbers">{count as number}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
