export interface DetectedMiner {
  id: number;
  ipAddress: string;
  macAddress?: string;
  deviceType?: string;
  openPorts?: string[];
  threatLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  hostname?: string;
  status: 'active' | 'inactive' | 'unknown';
  detectionTime: string;
  lastUpdate: string;
  powerConsumption?: number;
  hashRate?: string;
  responseTime?: number;
  isActive: boolean;
  notes?: string;
}

export interface NetworkConnection {
  id: number;
  minerId: number;
  targetHost: string;
  targetPort: number;
  protocol: string;
  connectionType: string;
  dataTransferred: number;
  connectionTime: string;
  isActive: boolean;
}

export interface ScanSession {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'failed';
  devicesScanned: number;
  minersFound: number;
  scanType: string;
  notes?: string;
}

export interface SystemActivity {
  id: number;
  type: 'scan' | 'detection' | 'alert' | 'system';
  description: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
  relatedMiner?: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface RfSignal {
  id: number;
  frequency: number;
  signalStrength: number;
  location: string;
  detectionTime: string;
  signalType?: string;
  notes?: string;
}

export interface PlcAnalysis {
  id: number;
  deviceId: string;
  powerlineFrequency: number;
  noiseLevel: number;
  analysisTime: string;
  anomalyDetected: boolean;
  confidence: number;
}

export interface AcousticSignature {
  id: number;
  deviceLocation: string;
  frequency: number;
  amplitude: number;
  duration: number;
  detectionTime: string;
  signatureType?: string;
  confidence: number;
}

export interface ThermalSignature {
  id: number;
  deviceLocation: string;
  temperature: number;
  heatPattern: string;
  detectionTime: string;
  anomalyLevel: number;
}

export interface NetworkTraffic {
  id: number;
  sourceIp: string;
  destinationIp: string;
  port: number;
  protocol: string;
  dataSize: number;
  timestamp: string;
  isStratum: boolean;
  suspicionLevel: number;
}

export interface Statistics {
  totalDevices: number;
  confirmedMiners: number;
  suspiciousDevices: number;
  totalPowerConsumption: number;
  networkHealth: number;
  rfSignalsDetected: number;
  acousticSignatures: number;
  thermalAnomalies: number;
}
