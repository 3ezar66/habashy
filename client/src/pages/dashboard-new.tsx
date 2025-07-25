import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import RealInteractiveMap from "@/components/RealInteractiveMap";
import IPRangeConfiguration from "@/components/IPRangeConfiguration";
import "../styles/windows11.css";

// Import icons (using simple SVG icons for Windows 11 style)
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/>
  </svg>
);

const ActivityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2Z"/>
  </svg>
);

const MapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M0 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2H2a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2zM5 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.292-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.292c.415.764-.42 1.6-1.185 1.184l-.292-.159a1.873 1.873 0 0 0-2.692 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.693-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.292A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </svg>
);

interface DashboardStats {
  totalDevices: number;
  confirmedMiners: number;
  suspiciousDevices: number;
  totalPowerConsumption: number;
  networkHealth: number;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

// Advanced Detection Component
function AdvancedDetectionTab() {
  const [isScanning, setIsScanning] = useState(false);
  const [detectionModules, setDetectionModules] = useState([
    { id: 'rf_detection', name: 'تشخیص امواج رادیویی', status: 'inactive', progress: 0, confidence: 0, detections: 0 },
    { id: 'vibration_analysis', name: 'تحلیل ارتعاشات', status: 'inactive', progress: 0, confidence: 0, detections: 0 },
    { id: 'thermal_imaging', name: 'تصویربرداری حرارتی', status: 'inactive', progress: 0, confidence: 0, detections: 0 },
    { id: 'electromagnetic_scan', name: 'اسکن الکترومغناطیسی', status: 'inactive', progress: 0, confidence: 0, detections: 0 },
    { id: 'acoustic_fingerprinting', name: 'شناسایی ص���تی', status: 'inactive', progress: 0, confidence: 0, detections: 0 },
    { id: 'ai_classification', name: 'طبقه‌بندی هوش مصنوعی', status: 'inactive', progress: 0, confidence: 0, detections: 0 }
  ]);

  const startAdvancedDetection = async () => {
    setIsScanning(true);

    try {
      const response = await fetch('/api/advanced-detection/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          detection_types: ['rf_detection', 'vibration_analysis', 'electromagnetic_scan', 'thermal_imaging', 'acoustic_fingerprinting', 'ai_classification'],
          location: [33.6374, 46.4227],
          duration: 300
        })
      });

      if (response.ok) {
        // شروع شبیه‌سازی پیشرفت
        setDetectionModules(prev => prev.map(module => ({ ...module, status: 'scanning', progress: 0 })));

        // شبیه‌سازی پیشرفت هر ماژول
        const interval = setInterval(() => {
          setDetectionModules(prev => prev.map(module => {
            if (module.status === 'scanning' && module.progress < 100) {
              const newProgress = Math.min(module.progress + Math.random() * 15, 100);
              const newDetections = Math.floor(Math.random() * 3);
              const newConfidence = Math.random() * 100;

              return {
                ...module,
                progress: newProgress,
                detections: module.detections + newDetections,
                confidence: newConfidence,
                status: newProgress >= 100 ? 'completed' : 'scanning'
              };
            }
            return module;
          }));
        }, 2000);

        // متوقف کردن شبیه‌سازی بعد از 30 ثانیه
        setTimeout(() => {
          clearInterval(interval);
          setIsScanning(false);
          setDetectionModules(prev => prev.map(module => ({ ...module, status: 'completed' })));
        }, 30000);

      } else {
        alert('خطا در شروع تشخیص پیشرفته');
        setIsScanning(false);
      }
    } catch (error) {
      alert('خطا در ارتباط با سرور');
      setIsScanning(false);
    }
  };

  const stopAdvancedDetection = async () => {
    try {
      await fetch('/api/advanced-detection/stop/current', { method: 'POST' });
      setIsScanning(false);
      setDetectionModules(prev => prev.map(module => ({ ...module, status: 'inactive', progress: 0 })));
    } catch (error) {
      console.error('Error stopping detection:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scanning': return 'var(--win11-info)';
      case 'completed': return 'var(--win11-success)';
      case 'error': return 'var(--win11-error)';
      default: return 'var(--win11-text-secondary)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scanning': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⭕';
    }
  };

  return (
    <div className="win11-animate-in">
      <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px' }}>
        سیستم تشخیص پیشرفته
      </h1>

      {/* Control Panel */}
      <div className="win11-card" style={{ marginBottom: '24px' }}>
        <div className="win11-card-header">
          <h3 className="win11-card-title">کنترل سیستم تشخیص</h3>
          <p className="win11-card-subtitle">مدیریت و کنترل ماژول‌های تشخیص پیشرفته</p>
        </div>
        <div className="win11-card-content">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={startAdvancedDetection}
              disabled={isScanning}
              className="win11-button win11-button-primary"
            >
              <ShieldIcon />
              {isScanning ? 'در حال اجرا...' : 'شروع تشخیص پیشرفته'}
            </button>

            {isScanning && (
              <button
                onClick={stopAdvancedDetection}
                className="win11-button win11-button-secondary"
              >
                ⏹️ متوقف کردن
              </button>
            )}
          </div>

          {isScanning && (
            <div style={{
              background: 'var(--win11-surface-alt)',
              padding: '12px',
              borderRadius: 'var(--win11-radius-medium)',
              border: '1px solid var(--win11-info)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--win11-info)' }}>
                <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
                سیستم تشخیص پیشرفته در حال اجرا است...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detection Modules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        {detectionModules.map((module) => (
          <div key={module.id} className="win11-card">
            <div className="win11-card-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{getStatusIcon(module.status)}</span>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{module.name}</h4>
                </div>
                <div style={{
                  background: getStatusColor(module.status),
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {module.status === 'scanning' ? 'در حال اسکن' :
                   module.status === 'completed' ? 'تکمیل شده' :
                   module.status === 'error' ? 'خطا' : 'غیرفعال'}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                  <span>پیشرفت</span>
                  <span>{Math.round(module.progress)}%</span>
                </div>
                <div className="win11-progress">
                  <div
                    className="win11-progress-bar"
                    style={{
                      width: `${module.progress}%`,
                      background: getStatusColor(module.status)
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div style={{ textAlign: 'center', padding: '8px', background: 'var(--win11-surface-alt)', borderRadius: 'var(--win11-radius-small)' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--win11-accent)' }}>
                    {module.detections}
                  </div>
                  <div style={{ color: 'var(--win11-text-secondary)', fontSize: '12px' }}>تشخیص‌ها</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'var(--win11-surface-alt)', borderRadius: 'var(--win11-radius-small)' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--win11-success)' }}>
                    {Math.round(module.confidence)}%
                  </div>
                  <div style={{ color: 'var(--win11-text-secondary)', fontSize: '12px' }}>اطمینان</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Map Component
function MapTab() {
  return (
    <div className="win11-animate-in">
      <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px' }}>
        نقشه هوشمند تشخیص‌ها
      </h1>

      <div className="win11-card">
        <div className="win11-card-header">
          <h3 className="win11-card-title">موقعیت دستگاه‌های تشخیص داده شده</h3>
          <p className="win11-card-subtitle">نمایش جغرافیایی ماینرهای شناسا��ی شده در استان ایلام</p>
        </div>
        <div className="win11-card-content">
          <div style={{
            height: '400px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 'var(--win11-radius-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ textAlign: 'center', zIndex: 2 }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
              <h3>نقشه اس��ان ایلام</h3>
              <p>موقعیت مای��رهای تشخیص داده شده</p>

              {/* Simulated map points */}
              <div style={{ position: 'absolute', top: '30%', left: '40%', background: 'red', width: '10px', height: '10px', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              <div style={{ position: 'absolute', top: '50%', left: '60%', background: 'orange', width: '8px', height: '8px', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              <div style={{ position: 'absolute', top: '70%', left: '30%', background: 'red', width: '12px', height: '12px', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '20px', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '12px', height: '12px', background: 'red', borderRadius: '50%', margin: '0 auto 4px' }} />
              <span style={{ fontSize: '12px' }}>بحرانی</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '10px', height: '10px', background: 'orange', borderRadius: '50%', margin: '0 auto 4px' }} />
              <span style={{ fontSize: '12px' }}>هشدار</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '8px', height: '8px', background: 'yellow', borderRadius: '50%', margin: '0 auto 4px' }} />
              <span style={{ fontSize: '12px' }}>متوسط</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Alerts Component
function AlertsTab() {
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'critical', title: 'ماینر ASIC تشخیص داده شد', message: 'دستگاه مشکوک در IP 192.168.1.100', time: new Date().toLocaleString('fa-IR') },
    { id: 2, type: 'warning', title: 'سیگنال RF غیرعادی', message: 'فعالیت مشکوک در فرکانس 2.4 GHz', time: new Date(Date.now() - 300000).toLocaleString('fa-IR') },
    { id: 3, type: 'info', title: 'اسکن تکمیل شد', message: '5 دستگاه جدید بررسی شد', time: new Date(Date.now() - 600000).toLocaleString('fa-IR') }
  ]);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'var(--win11-error)';
      case 'warning': return 'var(--win11-warning)';
      case 'info': return 'var(--win11-info)';
      default: return 'var(--win11-text-secondary)';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  return (
    <div className="win11-animate-in">
      <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px' }}>
        مرکز هشدارها
      </h1>

      <div className="win11-card">
        <div className="win11-card-header">
          <h3 className="win11-card-title">هشدارهای اخیر سیستم</h3>
          <p className="win11-card-subtitle">آخرین اعلان‌ها و هشدارهای تشخیص</p>
        </div>
        <div className="win11-card-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((alert) => (
              <div key={alert.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: 'var(--win11-radius-medium)',
                border: `1px solid ${getAlertColor(alert.type)}`,
                background: `${getAlertColor(alert.type)}08`
              }}>
                <span style={{ fontSize: '24px' }}>{getAlertIcon(alert.type)}</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', color: getAlertColor(alert.type) }}>{alert.title}</h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{alert.message}</p>
                  <small style={{ color: 'var(--win11-text-secondary)' }}>{alert.time}</small>
                </div>
                <button className="win11-button win11-button-secondary" style={{ minWidth: 'auto', padding: '4px 8px' }}>
                  تأیید
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Component
function SettingsTab() {
  return (
    <div className="win11-animate-in">
      <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px' }}>
        تنظیمات سیستم
      </h1>

      <div style={{ display: 'grid', gap: '16px' }}>
        <div className="win11-card">
          <div className="win11-card-header">
            <h3 className="win11-card-title">تنظیمات تشخیص</h3>
          </div>
          <div className="win11-card-content">
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>تشخیص خودکار</span>
                <label className="win11-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="win11-toggle-slider"></span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>اعلان‌های صوتی</span>
                <label className="win11-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="win11-toggle-slider"></span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>به‌روزرسانی خودکار</span>
                <label className="win11-toggle">
                  <input type="checkbox" />
                  <span className="win11-toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="win11-card">
          <div className="win11-card-header">
            <h3 className="win11-card-title">اطلاعات سیستم</h3>
          </div>
          <div className="win11-card-content">
            <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>نسخه برنامه:</span>
                <span>4.0 - شبح حبشی</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>آخرین به‌روزرسانی:</span>
                <span>{new Date().toLocaleDateString('fa-IR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>وضعیت اتصال:</span>
                <span style={{ color: 'var(--win11-success)' }}>متصل</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        fetch('/api/statistics'),
        fetch('/api/activities')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startScan = async () => {
    const button = document.activeElement as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = 'در حال شروع اسکن...';
    }

    try {
      const response = await fetch('/api/scan/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ipRanges: ['192.168.1.1-192.168.1.254'],
          ports: [22, 80, 443, 4028, 8080, 9999],
          timeout: 3,
          province: 'ilam',
          isAutomatic: false
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`اسکن با موفقیت آغاز شد. شناسه جلسه: ${result.sessionId || 'نامشخص'}`);
        loadData();
      } else {
        const error = await response.json().catch(() => ({ error: 'خطای ناشناخته' }));
        alert(`خطا در شروع اسکن: ${error.error || 'مشکل در سرور'}`);
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert(`خطا در ارتباط با سرور: ${error instanceof Error ? error.message : 'نامشخص'}`);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'شروع اسکن جامع';
      }
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'miner_detected': return '🔍';
      case 'scan_completed': return '✅';
      case 'alert_generated': return '⚠️';
      default: return '📊';
    }
  };

  const navItems = [
    { id: 'overview', label: 'نمای کلی', icon: <ActivityIcon /> },
    { id: 'scan', label: 'اسکن شبکه', icon: <SearchIcon /> },
    { id: 'detection', label: 'تشخیص پیشرفت��', icon: <ShieldIcon /> },
    { id: 'map', label: 'نقشه', icon: <MapIcon /> },
    { id: 'alerts', label: 'هشدارها', icon: <AlertIcon /> },
    { id: 'settings', label: 'تنظیمات', icon: <SettingsIcon /> }
  ];

  return (
    <div className="win11-app" dir="rtl">
      {/* Title Bar */}
      <div className="win11-titlebar">
        <div className="win11-titlebar-title">
          سامانه کاشف - تشخیص ماینرهای غیرمجاز استان ایلام
        </div>
        <div className="win11-titlebar-controls">
          <button className="win11-titlebar-button">−</button>
          <button className="win11-titlebar-button">□</button>
          <button className="win11-titlebar-button close">×</button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 32px)' }}>
        {/* Navigation Sidebar */}
        <nav className="win11-nav">
          <div style={{ padding: '0 16px 16px 16px' }}>
            <div style={{ 
              background: 'var(--win11-accent)', 
              color: 'white', 
              padding: '12px', 
              borderRadius: 'var(--win11-radius-large)',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>سامانه کاشف</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>نسخه 4.0 - شبح حبشی</div>
            </div>
            
            <div style={{ fontSize: '12px', color: 'var(--win11-text-secondary)', marginBottom: '8px' }}>
              کاربر: {user?.username}
            </div>
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`win11-nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <span className="win11-nav-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ marginTop: 'auto', padding: '16px' }}>
            <button
              onClick={() => logout.mutate()}
              className="win11-button-secondary"
              style={{ width: '100%' }}
            >
              خروج از سیستم
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '24px', background: 'var(--win11-background)', overflow: 'auto' }}>
          {activeTab === 'overview' && (
            <div className="win11-animate-in">
              <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px', color: 'var(--win11-text-primary)' }}>
                نمای کلی سیستم
              </h1>

              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="win11-card">
                  <div className="win11-card-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--win11-accent)' }}>
                          {formatNumber(stats?.totalDevices || 0)}
                        </div>
                        <div style={{ color: 'var(--win11-text-secondary)' }}>کل دستگاه‌ها</div>
                      </div>
                      <div style={{ fontSize: '32px' }}>📱</div>
                    </div>
                  </div>
                </div>

                <div className="win11-card">
                  <div className="win11-card-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--win11-error)' }}>
                          {formatNumber(stats?.confirmedMiners || 0)}
                        </div>
                        <div style={{ color: 'var(--win11-text-secondary)' }}>ماینرهای تأیید شده</div>
                      </div>
                      <div style={{ fontSize: '32px' }}>⚠️</div>
                    </div>
                  </div>
                </div>

                <div className="win11-card">
                  <div className="win11-card-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--win11-warning)' }}>
                          {formatNumber(stats?.suspiciousDevices || 0)}
                        </div>
                        <div style={{ color: 'var(--win11-text-secondary)' }}>دستگاه‌های مشکوک</div>
                      </div>
                      <div style={{ fontSize: '32px' }}>🔍</div>
                    </div>
                  </div>
                </div>

                <div className="win11-card">
                  <div className="win11-card-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--win11-success)' }}>
                          {stats?.networkHealth || 0}%
                        </div>
                        <div style={{ color: 'var(--win11-text-secondary)' }}>سلامت شبکه</div>
                      </div>
                      <div style={{ fontSize: '32px' }}>💚</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="win11-card" style={{ marginBottom: '24px' }}>
                <div className="win11-card-header">
                  <h3 className="win11-card-title">عملیات سریع</h3>
                </div>
                <div className="win11-card-content">
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={startScan} className="win11-button win11-button-primary">
                      <SearchIcon />
                      شروع اسکن جامع
                    </button>
                    <button onClick={() => setActiveTab('detection')} className="win11-button win11-button-secondary">
                      <ShieldIcon />
                      تشخیص پیشرفته
                    </button>
                    <button onClick={() => setActiveTab('map')} className="win11-button win11-button-secondary">
                      <MapIcon />
                      نمایش نقشه
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="win11-card">
                <div className="win11-card-header">
                  <h3 className="win11-card-title">آخرین فعالیت‌ها</h3>
                </div>
                <div className="win11-card-content">
                  {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--win11-text-secondary)' }}>
                      در حال ب��رگذاری...
                    </div>
                  ) : activities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--win11-text-secondary)' }}>
                      فعالیت جدیدی وجود ندارد
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activities.map((activity, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          padding: '8px',
                          borderRadius: 'var(--win11-radius-medium)',
                          background: 'var(--win11-surface-alt)'
                        }}>
                          <span style={{ fontSize: '20px' }}>{getActivityIcon(activity.type)}</span>
                          <div style={{ flex: 1 }}>
                            <div>{activity.description}</div>
                            <div style={{ fontSize: '12px', color: 'var(--win11-text-secondary)' }}>
                              {new Date(activity.timestamp).toLocaleString('fa-IR')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="win11-animate-in">
              <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px' }}>
                اسکن شبکه
              </h1>
              
              <IPRangeConfiguration
                onRangeChange={(ranges) => {
                  // Handle range change
                  console.log('IP ranges updated:', ranges);
                }}
                onScanStart={(config) => {
                  // Start scan with configuration
                  console.log('Starting scan with config:', config);
                  startScan();
                }}
              />
            </div>
          )}

          {activeTab === 'detection' && (
            <AdvancedDetectionTab />
          )}

          {activeTab === 'map' && (
            <MapTab />
          )}

          {activeTab === 'alerts' && (
            <AlertsTab />
          )}

          {activeTab === 'settings' && (
            <SettingsTab />
          )}
        </main>
      </div>
    </div>
  );
}
