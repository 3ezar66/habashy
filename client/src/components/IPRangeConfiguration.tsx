import React, { useState, useRef, useEffect } from 'react';
import { iranProvinces, getProvinceIpRanges, getCityIpRanges, getProvinceCities, type IranProvince, type IranCity } from '../../../shared/iranData';

interface IPRangeConfigurationProps {
  onRangeChange: (ranges: string) => void;
  onScanStart: (config: ScanConfig) => void;
}

interface ScanConfig {
  ipRanges: string;
  ports: string;
  isAutomatic: boolean;
  selectedProvince?: string;
  selectedCities?: string[];
}

interface ScanLogEntry {
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  ip: string;
  port?: number;
  status: string;
  details?: string;
}

export default function IPRangeConfiguration({ onRangeChange, onScanStart }: IPRangeConfigurationProps) {
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [manualRanges, setManualRanges] = useState('192.168.1.0-192.168.1.254;127.0.0.1');
  const [targetPorts, setTargetPorts] = useState('22,80,443,4028,8080,9999,3333,8332,8333');
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);
  const [autoSaveLogs, setAutoSaveLogs] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [scanLogs]);

  // Auto-save logs when enabled
  useEffect(() => {
    if (autoSaveLogs && scanLogs.length > 0) {
      const timeout = setTimeout(() => {
        saveLogsToFile();
      }, 30000); // Auto-save every 30 seconds
      return () => clearTimeout(timeout);
    }
  }, [scanLogs, autoSaveLogs]);

  const handleProvinceChange = (provinceName: string) => {
    setSelectedProvince(provinceName);
    setSelectedCities([]);
    
    if (provinceName) {
      const ipRanges = getProvinceIpRanges(provinceName);
      const rangeString = convertCIDRToRanges(ipRanges);
      onRangeChange(rangeString);
    }
  };

  const handleCityToggle = (cityName: string) => {
    const newSelection = selectedCities.includes(cityName)
      ? selectedCities.filter(c => c !== cityName)
      : [...selectedCities, cityName];
    
    setSelectedCities(newSelection);
    
    if (newSelection.length > 0) {
      const allRanges: string[] = [];
      newSelection.forEach(city => {
        allRanges.push(...getCityIpRanges(city));
      });
      const rangeString = convertCIDRToRanges(allRanges);
      onRangeChange(rangeString);
    } else if (selectedProvince) {
      // If no cities selected, use province ranges
      const ipRanges = getProvinceIpRanges(selectedProvince);
      const rangeString = convertCIDRToRanges(ipRanges);
      onRangeChange(rangeString);
    }
  };

  const convertCIDRToRanges = (cidrRanges: string[]): string => {
    return cidrRanges.map(cidr => {
      const [baseIp, cidrNotation] = cidr.split('/');
      const cidrNum = parseInt(cidrNotation);
      
      // Convert CIDR to IP range format for scanning
      if (cidrNum >= 24) {
        // For /24 and smaller, use the exact range
        const ipParts = baseIp.split('.');
        const startIp = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.1`;
        const endIp = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.254`;
        return `${startIp}-${endIp}`;
      } else if (cidrNum >= 16) {
        // For /16 to /23, create multiple /24 ranges
        const ipParts = baseIp.split('.');
        const startIp = `${ipParts[0]}.${ipParts[1]}.0.1`;
        const endIp = `${ipParts[0]}.${ipParts[1]}.255.254`;
        return `${startIp}-${endIp}`;
      } else {
        // For larger ranges, use a subset for practical scanning
        const ipParts = baseIp.split('.');
        const startIp = `${ipParts[0]}.0.0.1`;
        const endIp = `${ipParts[0]}.255.255.254`;
        return `${startIp}-${endIp}`;
      }
    }).join(';');
  };

  const handleManualRangeChange = (value: string) => {
    setManualRanges(value);
    onRangeChange(value);
  };

  const addLogEntry = (entry: Omit<ScanLogEntry, 'timestamp'>) => {
    const newEntry: ScanLogEntry = {
      ...entry,
      timestamp: new Date().toLocaleString('fa-IR')
    };
    setScanLogs(prev => [...prev, newEntry]);
  };

  const startScan = async () => {
    setIsScanning(true);
    setScanLogs([]);
    
    const config: ScanConfig = {
      ipRanges: isAutomatic ? (selectedCities.length > 0 
        ? convertCIDRToRanges(selectedCities.flatMap(city => getCityIpRanges(city)))
        : convertCIDRToRanges(getProvinceIpRanges(selectedProvince))
      ) : manualRanges,
      ports: targetPorts,
      isAutomatic,
      selectedProvince: isAutomatic ? selectedProvince : undefined,
      selectedCities: isAutomatic ? selectedCities : undefined
    };

    addLogEntry({
      type: 'info',
      ip: 'System',
      status: 'شروع اسکن شبکه',
      details: `محدوده: ${config.ipRanges}`
    });

    addLogEntry({
      type: 'info',
      ip: 'System',
      status: 'تنظیمات اسکن',
      details: `پورت‌های هدف: ${config.ports}`
    });

    try {
      // Call the API to start scanning
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ipRanges: config.ipRanges.split(';'),
          ports: config.ports.split(',').map(p => parseInt(p.trim())),
          isAutomatic: config.isAutomatic,
          province: config.selectedProvince,
          cities: config.selectedCities
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                addLogEntry({
                  type: data.type || 'info',
                  ip: data.ip || 'Unknown',
                  port: data.port,
                  status: data.status || 'در حال بررسی',
                  details: data.details
                });
              } catch (e) {
                // Handle non-JSON log lines
                addLogEntry({
                  type: 'info',
                  ip: 'System',
                  status: line
                });
              }
            }
          }
        }
      } else {
        addLogEntry({
          type: 'error',
          ip: 'System',
          status: 'خطا در شروع اسکن',
          details: await response.text()
        });
      }
    } catch (error) {
      addLogEntry({
        type: 'error',
        ip: 'System',
        status: 'خطا در اتصال',
        details: error instanceof Error ? error.message : 'خطای ناشناخته'
      });
    } finally {
      setIsScanning(false);
      addLogEntry({
        type: 'success',
        ip: 'System',
        status: 'اسکن کامل شد',
        details: `تعداد ورودی‌های لاگ: ${scanLogs.length}`
      });
    }

    onScanStart(config);
  };

  const saveLogsToFile = () => {
    const logContent = scanLogs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()} - ${log.ip}${log.port ? `:${log.port}` : ''} - ${log.status}${log.details ? ` | ${log.details}` : ''}`
    ).join('\n');

    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-log-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    setScanLogs([]);
  };

  const getSelectedProvince = (): IranProvince | undefined => {
    return iranProvinces.find(p => p.name === selectedProvince);
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div style={{ direction: 'rtl' }}>
      {/* IP Range Configuration */}
      <div className="win11-card" style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--win11-text-primary)', marginBottom: '20px' }}>
          تنظیمات محدوده IP
        </h3>

        {/* Automatic/Manual Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isAutomatic}
              onChange={(e) => setIsAutomatic(e.target.checked)}
              style={{ marginLeft: '8px' }}
            />
            دریافت اتوماتیک محدوده IP بر اساس تقسیمات کشوری
          </label>
        </div>

        {/* Automatic Configuration */}
        {isAutomatic && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--win11-surface-secondary)', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '15px', color: 'var(--win11-text-primary)' }}>
              انتخاب محدوده جغرافیایی
            </h4>

            {/* Province Selection */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--win11-text-primary)' }}>
                انتخاب استان:
              </label>
              <select
                className="win11-input"
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">انتخاب کنید...</option>
                {iranProvinces.map(province => (
                  <option key={province.id} value={province.name}>
                    {province.name} ({province.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* City Selection */}
            {selectedProvince && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--win11-text-primary)' }}>
                  انتخاب شهرها (اختیاری):
                </label>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--win11-border)', 
                  borderRadius: '4px', 
                  padding: '10px',
                  backgroundColor: 'var(--win11-surface-primary)'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedCities.length === getSelectedProvince()?.cities.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCities(getSelectedProvince()?.cities.map(c => c.name) || []);
                        } else {
                          setSelectedCities([]);
                        }
                      }}
                      style={{ marginLeft: '8px' }}
                    />
                    <strong>انتخاب همه شهرهای استان</strong>
                  </label>
                  {getSelectedProvince()?.cities.map(city => (
                    <label key={city.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedCities.includes(city.name)}
                        onChange={() => handleCityToggle(city.name)}
                        style={{ marginLeft: '8px' }}
                      />
                      {city.name} ({city.nameEn}) - جمعیت: {city.population.toLocaleString()}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Range Preview */}
            {(selectedProvince || selectedCities.length > 0) && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--win11-surface-tertiary)', borderRadius: '4px' }}>
                <strong>محدوده‌های IP انتخاب شده:</strong>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', marginTop: '5px', wordBreak: 'break-all' }}>
                  {selectedCities.length > 0 
                    ? convertCIDRToRanges(selectedCities.flatMap(city => getCityIpRanges(city)))
                    : convertCIDRToRanges(getProvinceIpRanges(selectedProvince))
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Configuration */}
        {!isAutomatic && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--win11-text-primary)' }}>
              محدوده IP (دستی):
            </label>
            <textarea
              className="win11-input"
              value={manualRanges}
              onChange={(e) => handleManualRangeChange(e.target.value)}
              placeholder="مثال: 192.168.1.0-192.168.1.254;127.0.0.1;10.0.0.1-10.0.0.100"
              rows={3}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '14px' }}
            />
            <div style={{ fontSize: '12px', color: 'var(--win11-text-secondary)', marginTop: '5px' }}>
              فرمت: از_IP-تا_IP;IP_منفرد;از_IP2-تا_IP2
            </div>
          </div>
        )}

        {/* Target Ports */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--win11-text-primary)' }}>
            پورت‌های هدف:
          </label>
          <input
            type="text"
            className="win11-input"
            value={targetPorts}
            onChange={(e) => setTargetPorts(e.target.value)}
            placeholder="پورت‌ها را با کاما جدا کنید"
            style={{ width: '100%' }}
          />
        </div>

        {/* Start Scan Button */}
        <button
          onClick={startScan}
          disabled={isScanning}
          className={`win11-button ${isScanning ? '' : 'win11-button-primary'}`}
          style={{ width: '100%', fontSize: '16px', padding: '12px' }}
        >
          {isScanning ? 'در حال اسکن...' : 'شروع اسکن شبکه'}
        </button>
      </div>

      {/* Scan Logs */}
      <div className="win11-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: 'var(--win11-text-primary)', margin: 0 }}>
            گزارش فرایند اسکن ({scanLogs.length} ورودی)
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={autoSaveLogs}
                onChange={(e) => setAutoSaveLogs(e.target.checked)}
                style={{ marginLeft: '5px' }}
              />
              ذخیره خودکار
            </label>
            <button onClick={saveLogsToFile} className="win11-button" style={{ fontSize: '12px', padding: '5px 10px' }}>
              دانلود لاگ
            </button>
            <button onClick={clearLogs} className="win11-button" style={{ fontSize: '12px', padding: '5px 10px' }}>
              پاک کردن
            </button>
          </div>
        </div>

        <div
          ref={logContainerRef}
          style={{
            height: '400px',
            overflowY: 'auto',
            border: '1px solid var(--win11-border)',
            borderRadius: '4px',
            padding: '10px',
            backgroundColor: 'var(--win11-surface-primary)',
            fontFamily: 'monospace',
            fontSize: '12px',
            direction: 'ltr'
          }}
        >
          {scanLogs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--win11-text-secondary)', padding: '20px' }}>
              هیچ لاگی موجود نیست
            </div>
          ) : (
            scanLogs.map((log, index) => (
              <div
                key={index}
                style={{
                  padding: '5px',
                  marginBottom: '2px',
                  borderRadius: '3px',
                  backgroundColor: log.type === 'error' ? '#ffe6e6' : 
                                  log.type === 'warning' ? '#fff3cd' :
                                  log.type === 'success' ? '#d4edda' : 'transparent',
                  borderLeft: `3px solid ${
                    log.type === 'error' ? '#dc3545' :
                    log.type === 'warning' ? '#ffc107' :
                    log.type === 'success' ? '#28a745' : '#007bff'
                  }`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                  <span>{getLogTypeIcon(log.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>
                      [{log.timestamp}] {log.ip}{log.port ? `:${log.port}` : ''}
                    </div>
                    <div>{log.status}</div>
                    {log.details && (
                      <div style={{ color: 'var(--win11-text-secondary)', fontSize: '11px' }}>
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
