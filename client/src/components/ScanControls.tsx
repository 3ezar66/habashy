import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  SearchCheck,
  Play,
  Wifi,
  DoorOpen,
  MapPin,
  Square,
  AlertCircle,
  Radar,
  Brain,
  Radio,
  Zap
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface ScanConfig {
  ipRange: string;
  ports: string;
  timeout: number;
}

export default function ScanControls() {
  const [scanConfig, setScanConfig] = useState<ScanConfig>({
    ipRange: '192.168.1.0/24',
    ports: '22,80,443,4028,8080,9999',
    timeout: 3
  });
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('آماده برای اسکن');
  const [scanType, setScanType] = useState<string>('');

  const startComprehensiveScan = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('شروع اسکن جامع...');
    setScanType('comprehensive');

    try {
      const response = await apiRequest('POST', '/api/scan/comprehensive', {
        ipRange: scanConfig.ipRange,
        ports: scanConfig.ports.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)),
        timeout: scanConfig.timeout
      });

      const data = await response.json();
      
      toast({
        title: "اسکن جامع تکمیل شد",
        description: `${data.results?.miners_found || 0} ماینر و ${data.results?.total_devices || 0} دستگاه شناسایی شد`,
      });

    } catch (error) {
      setScanStatus('خطا در اسکن جامع');
      toast({
        title: "خطا د�� اسکن جامع",
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
      setScanType('');
      setTimeout(() => {
        setScanProgress(0);
        setScanStatus('آماده برای اسکن');
      }, 3000);
    }
  };

  const startNetworkScan = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('شروع اسکن شبکه...');
    setScanType('network');

    try {
      const response = await apiRequest('POST', '/api/scan/network', {
        network: scanConfig.ipRange
      });

      const data = await response.json();
      
      toast({
        title: "اسکن شبکه تکمیل شد",
        description: `${data.results?.results?.length || 0} دستگاه فعال شناسایی شد`,
      });

    } catch (error) {
      setScanStatus('خطا در اسکن شبکه');
      toast({
        title: "خطا در اسکن شبکه",
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
      setScanType('');
      setTimeout(() => {
        setScanProgress(0);
        setScanStatus('آماده برای اسکن');
      }, 3000);
    }
  };

  const startPortScan = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('شروع اسکن پورت...');
    setScanType('port');

    toast({
      title: "اسکن پورت شروع شد",
      description: `اسکن پورت‌های ${scanConfig.ports} در محدوده ${scanConfig.ipRange}`,
    });
  };

  const startGeolocation = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('شروع مکان‌یابی...');
    setScanType('geolocation');

    toast({
      title: "مکان‌یابی شروع شد",
      description: "در حال مکان‌یابی دستگاه‌های شناسایی شده",
    });
  };

  const startAdvancedDetection = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('شروع تشخیص پیشرفته...');
    setScanType('advanced');

    try {
      const response = await apiRequest('POST', '/api/advanced-detection/start', {
        detection_types: ['rf_detection', 'vibration_analysis', 'electromagnetic_scan', 'thermal_imaging', 'acoustic_fingerprinting', 'ai_classification'],
        location: [33.6374, 46.4227], // Ilam coordinates
        duration: 300
      });

      const data = await response.json();

      toast({
        title: "تشخیص پیشرفته شروع شد",
        description: "تمام ماژول‌های تشخیص چندوجهی فعال شدند",
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 2;
        });
      }, 3000);

    } catch (error) {
      setScanStatus('خطا در تشخیص پیشرفته');
      toast({
        title: "خطا در تشخیص پیشرفته",
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanType('');
        setScanProgress(0);
        setScanStatus('آماده برای اسکن');
      }, 300000); // 5 minutes
    }
  };

  const startRFDetection = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('شروع اسکن امواج رادیویی...');
    setScanType('rf');

    try {
      const response = await apiRequest('POST', '/api/rf-scan', {
        location: 'Ilam_Province'
      });

      const data = await response.json();

      toast({
        title: "اسکن RF شروع شد",
        description: "در حال جستجوی امضاهای الکترومغناطیسی ماینرها",
      });

    } catch (error) {
      setScanStatus('خطا در اسکن RF');
      toast({
        title: "خطا در اسکن RF",
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanType('');
        setScanProgress(0);
        setScanStatus('آماده برای اسکن');
      }, 60000); // 1 minute
    }
  };

  const stopScan = () => {
    if (!isScanning) return;
    
    setIsScanning(false);
    setScanProgress(0);
    setScanStatus('اسکن متوقف شد');
    setScanType('');
    
    toast({
      title: "اسکن متوقف شد",
      description: "تمام فرآیندهای اسکن متوقف شدند",
      variant: 'destructive',
    });

    setTimeout(() => {
      setScanStatus('آماده برای اسکن');
    }, 2000);
  };

  const getScanTypeIcon = () => {
    switch (scanType) {
      case 'comprehensive':
        return <SearchCheck className="h-4 w-4" />;
      case 'network':
        return <Wifi className="h-4 w-4" />;
      case 'port':
        return <DoorOpen className="h-4 w-4" />;
      case 'geolocation':
        return <MapPin className="h-4 w-4" />;
      case 'advanced':
        return <Radar className="h-4 w-4" />;
      case 'rf':
        return <Radio className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="persian-card mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <SearchCheck className="ml-2 h-5 w-5 text-primary" />
          کنترل‌های اسکن و شناسایی
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="ipRange" className="text-sm text-muted-foreground">
              محدوده IP
            </Label>
            <Input
              id="ipRange"
              value={scanConfig.ipRange}
              onChange={(e) => setScanConfig(prev => ({ ...prev, ipRange: e.target.value }))}
              placeholder="192.168.1.0/24"
              className="focus-ring persian-numbers"
              disabled={isScanning}
            />
          </div>
          
          <div>
            <Label htmlFor="ports" className="text-sm text-muted-foreground">
              پورت‌های اسکن
            </Label>
            <Input
              id="ports"
              value={scanConfig.ports}
              onChange={(e) => setScanConfig(prev => ({ ...prev, ports: e.target.value }))}
              placeholder="22,80,443,4028,8080,9999"
              className="focus-ring persian-numbers"
              disabled={isScanning}
            />
          </div>
          
          <div>
            <Label htmlFor="timeout" className="text-sm text-muted-foreground">
              تایم‌اوت (ثانیه)
            </Label>
            <Input
              id="timeout"
              type="number"
              value={scanConfig.timeout}
              onChange={(e) => setScanConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 3 }))}
              min="1"
              max="30"
              className="focus-ring persian-numbers"
              disabled={isScanning}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={startComprehensiveScan}
            disabled={isScanning}
            className="bg-primary hover:bg-blue-600 focus-ring"
          >
            <Play className="ml-2 h-4 w-4" />
            شروع اسکن جامع
          </Button>
          
          <Button
            onClick={startNetworkScan}
            disabled={isScanning}
            variant="secondary"
            className="bg-persian-secondary hover:bg-cyan-600 text-white focus-ring"
          >
            <Wifi className="ml-2 h-4 w-4" />
            اسکن شبکه
          </Button>
          
          <Button
            onClick={startPortScan}
            disabled={isScanning}
            variant="secondary"
            className="bg-persian-warning hover:bg-amber-600 text-white focus-ring"
          >
            <DoorOpen className="ml-2 h-4 w-4" />
            اسکن پورت
          </Button>
          
          <Button
            onClick={startGeolocation}
            disabled={isScanning}
            variant="secondary"
            className="bg-purple-600 hover:bg-purple-700 text-white focus-ring"
          >
            <MapPin className="ml-2 h-4 w-4" />
            مکان‌یابی
          </Button>

          <Button
            onClick={startAdvancedDetection}
            disabled={isScanning}
            variant="secondary"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white focus-ring"
          >
            <Radar className="ml-2 h-4 w-4" />
            تشخیص پیشرفته
          </Button>

          <Button
            onClick={startRFDetection}
            disabled={isScanning}
            variant="secondary"
            className="bg-red-600 hover:bg-red-700 text-white focus-ring"
          >
            <Radio className="ml-2 h-4 w-4" />
            اسکن RF
          </Button>

          <Button
            onClick={stopScan}
            disabled={!isScanning}
            variant="outline"
            className="border-persian-error text-persian-error hover:bg-persian-error hover:text-white focus-ring"
          >
            <Square className="ml-2 h-4 w-4" />
            توقف اسکن
          </Button>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-reverse space-x-2">
              {isScanning && getScanTypeIcon()}
              <span className="text-muted-foreground">وضعیت:</span>
              <span className={isScanning ? 'text-primary' : 'text-foreground'}>
                {scanStatus}
              </span>
            </div>
            
            {isScanning && (
              <div className="flex items-center space-x-reverse space-x-2">
                <span className="text-muted-foreground persian-numbers">
                  {Math.round(scanProgress)}% تکمیل
                </span>
                {scanType && (
                  <Badge variant="outline" className="text-xs">
                    {scanType === 'comprehensive' ? 'جامع' :
                     scanType === 'network' ? 'شبکه' :
                     scanType === 'port' ? 'پورت' :
                     scanType === 'geolocation' ? 'مکان‌یابی' :
                     scanType === 'advanced' ? 'پیشرفته' :
                     scanType === 'rf' ? 'امواج رادیویی' : scanType}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="relative w-full bg-persian-surface-variant rounded-full h-2 overflow-hidden">
            {isScanning && (
              <div className="scanner-animation absolute inset-0"></div>
            )}
            <Progress 
              value={scanProgress} 
              className="h-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Status Indicators */}
        {isScanning && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="text-primary border-primary">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse ml-2"></div>
              اسکن در حال انجام
            </Badge>
            
            <Badge variant="outline" className="text-muted-foreground">
              محدوده: {scanConfig.ipRange}
            </Badge>
            
            {scanConfig.ports && (
              <Badge variant="outline" className="text-muted-foreground persian-numbers">
                پورت‌ها: {scanConfig.ports.split(',').length} پورت
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
