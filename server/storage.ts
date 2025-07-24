// @ts-ignore
// declare module 'better-sqlite3';
import { 
  detectedMiners, 
  networkConnections, 
  scanSessions, 
  systemActivities,
  users,
  rfSignals,
  plcAnalysis,
  acousticSignatures,
  thermalSignatures,
  networkTraffic,
  type DetectedMiner, 
  type InsertMiner,
  type NetworkConnection,
  type InsertConnection,
  type ScanSession,
  type InsertScanSession,
  type SystemActivity,
  type InsertActivity,
  type User, 
  type InsertUser,
  type RfSignal,
  type InsertRfSignal,
  type PlcAnalysis,
  type InsertPlcAnalysis,
  type AcousticSignature,
  type InsertAcousticSignature,
  type ThermalSignature,
  type InsertThermalSignature,
  type NetworkTraffic,
  type InsertNetworkTraffic
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";
import Database from 'better-sqlite3';
import 'dotenv/config';

export interface IStorage {
  // User methods  
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Miner detection methods
  getDetectedMiners(): Promise<DetectedMiner[]>;
  getMinerById(id: number): Promise<DetectedMiner | undefined>;
  createMiner(miner: InsertMiner): Promise<DetectedMiner>;
  updateMiner(id: number, updates: Partial<InsertMiner>): Promise<DetectedMiner | undefined>;
  getActiveMiners(): Promise<DetectedMiner[]>;
  getMinersInArea(bounds: { north: number; south: number; east: number; west: number }): Promise<DetectedMiner[]>;

  // Network connections
  getNetworkConnections(): Promise<NetworkConnection[]>;
  createConnection(connection: InsertConnection): Promise<NetworkConnection>;
  getConnectionsByMiner(minerId: number): Promise<NetworkConnection[]>;

  // Scan sessions
  getScanSessions(): Promise<ScanSession[]>;
  createScanSession(session: InsertScanSession): Promise<ScanSession>;
  updateScanSession(id: number, updates: Partial<InsertScanSession>): Promise<ScanSession | undefined>;
  getActiveScanSessions(): Promise<ScanSession[]>;

  // System activities
  getRecentActivities(limit?: number): Promise<SystemActivity[]>;
  createActivity(activity: InsertActivity): Promise<SystemActivity>;

  // RF Signal Analysis
  getRfSignals(): Promise<RfSignal[]>;
  createRfSignal(signal: InsertRfSignal): Promise<RfSignal>;
  getRfSignalsByLocation(location: string): Promise<RfSignal[]>;

  // PLC Analysis
  getPlcAnalyses(): Promise<PlcAnalysis[]>;
  createPlcAnalysis(analysis: InsertPlcAnalysis): Promise<PlcAnalysis>;

  // Acoustic Signatures
  getAcousticSignatures(): Promise<AcousticSignature[]>;
  createAcousticSignature(signature: InsertAcousticSignature): Promise<AcousticSignature>;

  // Thermal Signatures
  getThermalSignatures(): Promise<ThermalSignature[]>;
  createThermalSignature(signature: InsertThermalSignature): Promise<ThermalSignature>;

  // Network Traffic
  getNetworkTraffic(): Promise<NetworkTraffic[]>;
  createNetworkTraffic(traffic: InsertNetworkTraffic): Promise<NetworkTraffic>;
  getStratumConnections(): Promise<NetworkTraffic[]>;

  // Session store for authentication
  sessionStore: any;

  // Statistics
  getStatistics(): Promise<{
    totalDevices: number;
    confirmedMiners: number;
    suspiciousDevices: number;
    totalPowerConsumption: number;
    networkHealth: number;
    rfSignalsDetected: number;
    acousticSignatures: number;
    thermalAnomalies: number;
  }>;
}

const MemorySessionStore = MemoryStore(session);

// حذف mockها و افزودن اتصال واقعی به SQLite
const db = new Database('miners.db');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'operator',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1
);
CREATE TABLE IF NOT EXISTS miners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT,
  mac TEXT,
  device_type TEXT,
  open_ports TEXT,
  suspicion_score INTEGER,
  city TEXT,
  country TEXT,
  latitude REAL,
  longitude REAL,
  hostname TEXT,
  status TEXT,
  detection_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
  power_consumption REAL,
  hash_rate TEXT,
  response_time INTEGER,
  is_active BOOLEAN DEFAULT 1,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  description TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

export function getStatistics() {
  const totalDevices = db.prepare('SELECT COUNT(*) as cnt FROM miners').get().cnt;
  const confirmedMiners = db.prepare('SELECT COUNT(*) as cnt FROM miners WHERE suspicion_score >= 80').get().cnt;
  const suspiciousDevices = db.prepare('SELECT COUNT(*) as cnt FROM miners WHERE suspicion_score >= 50 AND suspicion_score < 80').get().cnt;
  const totalPowerConsumption = db.prepare('SELECT SUM(power_consumption) as sum FROM miners').get().sum || 0;
  // سایر فیلدها را به صورت نمونه صفر می‌گذاریم
  return Promise.resolve({
    totalDevices,
    confirmedMiners,
    suspiciousDevices,
    totalPowerConsumption,
    networkHealth: 0,
    rfSignalsDetected: 0,
    acousticSignatures: 0,
    thermalAnomalies: 0
  });
}

export function getMiners() {
  return db.prepare('SELECT * FROM miners ORDER BY suspicion_score DESC').all();
}

export function getActivities() {
  return db.prepare('SELECT * FROM activities ORDER BY timestamp DESC LIMIT 100').all();
}

function isValidIP(ip: string): boolean {
  // IPv4 validation
  return /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}
function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port < 65536;
}
function isValidOpenPorts(open_ports: string): boolean {
  // open_ports: comma-separated string of ports
  return open_ports.split(',').every(p => isValidPort(Number(p.trim())));
}

export function addMiner(miner: any) {
  if (!isValidIP(miner.ip)) {
    console.error('Invalid IP address:', miner.ip);
    return;
  }
  if (miner.open_ports && !isValidOpenPorts(miner.open_ports)) {
    console.error('Invalid open_ports:', miner.open_ports);
    return;
  }
  const stmt = db.prepare(`INSERT INTO miners (ip, mac, device_type, open_ports, suspicion_score, city, country, latitude, longitude, hostname, status, power_consumption, hash_rate, response_time, is_active, notes) VALUES (@ip, @mac, @device_type, @open_ports, @suspicion_score, @city, @country, @latitude, @longitude, @hostname, @status, @power_consumption, @hash_rate, @response_time, @is_active, @notes)`);
  stmt.run(miner);
}

export function addActivity(activity: any) {
  const stmt = db.prepare(`INSERT INTO activities (type, description) VALUES (?, ?)`);
  stmt.run(activity.type, activity.description);
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemorySessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      return user as User | undefined;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      return user as User | undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const stmt = db.prepare(`
        INSERT INTO users (username, password, email, role, is_active)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        insertUser.username,
        insertUser.password,
        insertUser.email || null,
        insertUser.role || 'operator',
        insertUser.isActive !== false ? 1 : 0
      );

      const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      return newUser as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getDetectedMiners(): Promise<DetectedMiner[]> {
    try {
      const miners = db.prepare('SELECT * FROM miners ORDER BY detection_time DESC').all();
      return miners.map(miner => ({
        ...miner,
        isActive: miner.is_active === 1,
        detectionTime: miner.detection_time,
        lastUpdate: miner.last_update,
        powerConsumption: miner.power_consumption,
        hashRate: miner.hash_rate,
        responseTime: miner.response_time,
        suspicionScore: miner.suspicion_score,
        deviceType: miner.device_type,
        openPorts: miner.open_ports,
        ipAddress: miner.ip,
        macAddress: miner.mac
      })) as DetectedMiner[];
    } catch (error) {
      console.error('Error getting detected miners:', error);
      return [];
    }
  }

  async getMinerById(id: number): Promise<DetectedMiner | undefined> {
    try {
      const miner = db.prepare('SELECT * FROM miners WHERE id = ?').get(id);
      if (!miner) return undefined;

      return {
        ...miner,
        isActive: miner.is_active === 1,
        detectionTime: miner.detection_time,
        lastUpdate: miner.last_update,
        powerConsumption: miner.power_consumption,
        hashRate: miner.hash_rate,
        responseTime: miner.response_time,
        suspicionScore: miner.suspicion_score,
        deviceType: miner.device_type,
        openPorts: miner.open_ports,
        ipAddress: miner.ip,
        macAddress: miner.mac
      } as DetectedMiner;
    } catch (error) {
      console.error('Error getting miner by id:', error);
      return undefined;
    }
  }

  async createMiner(insertMiner: InsertMiner): Promise<DetectedMiner> {
    try {
      const stmt = db.prepare(`
        INSERT INTO miners (ip, mac, device_type, open_ports, suspicion_score, city, country, latitude, longitude, hostname, status, power_consumption, hash_rate, response_time, is_active, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        insertMiner.ipAddress,
        insertMiner.macAddress,
        insertMiner.deviceType || 'unknown',
        insertMiner.openPorts,
        insertMiner.suspicionScore || 50,
        insertMiner.city,
        insertMiner.country,
        insertMiner.latitude,
        insertMiner.longitude,
        insertMiner.hostname,
        insertMiner.status || 'active',
        insertMiner.powerConsumption,
        insertMiner.hashRate,
        insertMiner.responseTime,
        insertMiner.isActive !== false ? 1 : 0,
        insertMiner.notes
      );

      const newMiner = db.prepare('SELECT * FROM miners WHERE id = ?').get(result.lastInsertRowid);
      return {
        ...newMiner,
        isActive: newMiner.is_active === 1,
        detectionTime: newMiner.detection_time,
        lastUpdate: newMiner.last_update,
        powerConsumption: newMiner.power_consumption,
        hashRate: newMiner.hash_rate,
        responseTime: newMiner.response_time,
        suspicionScore: newMiner.suspicion_score,
        deviceType: newMiner.device_type,
        openPorts: newMiner.open_ports,
        ipAddress: newMiner.ip,
        macAddress: newMiner.mac
      } as DetectedMiner;
    } catch (error) {
      console.error('Error creating miner:', error);
      throw error;
    }
  }

  async updateMiner(id: number, updates: Partial<InsertMiner>): Promise<DetectedMiner | undefined> {
    try {
      const setParts = [];
      const values = [];

      if (updates.ipAddress !== undefined) { setParts.push('ip = ?'); values.push(updates.ipAddress); }
      if (updates.macAddress !== undefined) { setParts.push('mac = ?'); values.push(updates.macAddress); }
      if (updates.deviceType !== undefined) { setParts.push('device_type = ?'); values.push(updates.deviceType); }
      if (updates.openPorts !== undefined) { setParts.push('open_ports = ?'); values.push(updates.openPorts); }
      if (updates.suspicionScore !== undefined) { setParts.push('suspicion_score = ?'); values.push(updates.suspicionScore); }
      if (updates.city !== undefined) { setParts.push('city = ?'); values.push(updates.city); }
      if (updates.country !== undefined) { setParts.push('country = ?'); values.push(updates.country); }
      if (updates.latitude !== undefined) { setParts.push('latitude = ?'); values.push(updates.latitude); }
      if (updates.longitude !== undefined) { setParts.push('longitude = ?'); values.push(updates.longitude); }
      if (updates.hostname !== undefined) { setParts.push('hostname = ?'); values.push(updates.hostname); }
      if (updates.status !== undefined) { setParts.push('status = ?'); values.push(updates.status); }
      if (updates.powerConsumption !== undefined) { setParts.push('power_consumption = ?'); values.push(updates.powerConsumption); }
      if (updates.hashRate !== undefined) { setParts.push('hash_rate = ?'); values.push(updates.hashRate); }
      if (updates.responseTime !== undefined) { setParts.push('response_time = ?'); values.push(updates.responseTime); }
      if (updates.isActive !== undefined) { setParts.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }
      if (updates.notes !== undefined) { setParts.push('notes = ?'); values.push(updates.notes); }

      setParts.push('last_update = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`UPDATE miners SET ${setParts.join(', ')} WHERE id = ?`);
      stmt.run(...values);

      return this.getMinerById(id);
    } catch (error) {
      console.error('Error updating miner:', error);
      return undefined;
    }
  }

  async getActiveMiners(): Promise<DetectedMiner[]> {
    try {
      const miners = db.prepare('SELECT * FROM miners WHERE is_active = 1 ORDER BY detection_time DESC').all();
      return miners.map(miner => ({
        ...miner,
        isActive: miner.is_active === 1,
        detectionTime: miner.detection_time,
        lastUpdate: miner.last_update,
        powerConsumption: miner.power_consumption,
        hashRate: miner.hash_rate,
        responseTime: miner.response_time,
        suspicionScore: miner.suspicion_score,
        deviceType: miner.device_type,
        openPorts: miner.open_ports,
        ipAddress: miner.ip,
        macAddress: miner.mac
      })) as DetectedMiner[];
    } catch (error) {
      console.error('Error getting active miners:', error);
      return [];
    }
  }

  async getMinersInArea(bounds: { north: number; south: number; east: number; west: number }): Promise<DetectedMiner[]> {
    try {
      const miners = db.prepare(`
        SELECT * FROM miners
        WHERE latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
        ORDER BY detection_time DESC
      `).all(bounds.south, bounds.north, bounds.west, bounds.east);

      return miners.map(miner => ({
        ...miner,
        isActive: miner.is_active === 1,
        detectionTime: miner.detection_time,
        lastUpdate: miner.last_update,
        powerConsumption: miner.power_consumption,
        hashRate: miner.hash_rate,
        responseTime: miner.response_time,
        suspicionScore: miner.suspicion_score,
        deviceType: miner.device_type,
        openPorts: miner.open_ports,
        ipAddress: miner.ip,
        macAddress: miner.mac
      })) as DetectedMiner[];
    } catch (error) {
      console.error('Error getting miners in area:', error);
      return [];
    }
  }

  async getNetworkConnections(): Promise<NetworkConnection[]> {
    return [];
  }

  async createConnection(insertConnection: InsertConnection): Promise<NetworkConnection> {
    return insertConnection as NetworkConnection;
  }

  async getConnectionsByMiner(minerId: number): Promise<NetworkConnection[]> {
    return [];
  }

  async getScanSessions(): Promise<ScanSession[]> {
    try {
      // Create scan_sessions table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS scan_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_type TEXT NOT NULL,
          ip_range TEXT,
          ports TEXT,
          status TEXT DEFAULT 'pending',
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          end_time DATETIME,
          devices_found INTEGER DEFAULT 0,
          miners_detected INTEGER DEFAULT 0,
          errors TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const sessions = db.prepare('SELECT * FROM scan_sessions ORDER BY created_at DESC').all();
      return sessions.map(session => ({
        ...session,
        sessionType: session.session_type,
        ipRange: session.ip_range,
        startTime: session.start_time,
        endTime: session.end_time,
        devicesFound: session.devices_found,
        minersDetected: session.miners_detected,
        createdAt: session.created_at
      })) as ScanSession[];
    } catch (error) {
      console.error('Error getting scan sessions:', error);
      return [];
    }
  }

  async createScanSession(insertSession: InsertScanSession): Promise<ScanSession> {
    try {
      const stmt = db.prepare(`
        INSERT INTO scan_sessions (session_type, ip_range, ports, status, devices_found, miners_detected, errors)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        insertSession.sessionType,
        insertSession.ipRange,
        insertSession.ports,
        insertSession.status || 'pending',
        insertSession.devicesFound || 0,
        insertSession.minersDetected || 0,
        insertSession.errors
      );

      const newSession = db.prepare('SELECT * FROM scan_sessions WHERE id = ?').get(result.lastInsertRowid);
      return {
        ...newSession,
        sessionType: newSession.session_type,
        ipRange: newSession.ip_range,
        startTime: newSession.start_time,
        endTime: newSession.end_time,
        devicesFound: newSession.devices_found,
        minersDetected: newSession.miners_detected,
        createdAt: newSession.created_at
      } as ScanSession;
    } catch (error) {
      console.error('Error creating scan session:', error);
      throw error;
    }
  }

  async updateScanSession(id: number, updates: Partial<InsertScanSession>): Promise<ScanSession | undefined> {
    try {
      const setParts = [];
      const values = [];

      if (updates.status !== undefined) { setParts.push('status = ?'); values.push(updates.status); }
      if (updates.endTime !== undefined) { setParts.push('end_time = ?'); values.push(updates.endTime); }
      if (updates.devicesFound !== undefined) { setParts.push('devices_found = ?'); values.push(updates.devicesFound); }
      if (updates.minersDetected !== undefined) { setParts.push('miners_detected = ?'); values.push(updates.minersDetected); }
      if (updates.errors !== undefined) { setParts.push('errors = ?'); values.push(updates.errors); }

      values.push(id);

      const stmt = db.prepare(`UPDATE scan_sessions SET ${setParts.join(', ')} WHERE id = ?`);
      stmt.run(...values);

      const updated = db.prepare('SELECT * FROM scan_sessions WHERE id = ?').get(id);
      if (!updated) return undefined;

      return {
        ...updated,
        sessionType: updated.session_type,
        ipRange: updated.ip_range,
        startTime: updated.start_time,
        endTime: updated.end_time,
        devicesFound: updated.devices_found,
        minersDetected: updated.miners_detected,
        createdAt: updated.created_at
      } as ScanSession;
    } catch (error) {
      console.error('Error updating scan session:', error);
      return undefined;
    }
  }

  async getActiveScanSessions(): Promise<ScanSession[]> {
    try {
      const sessions = db.prepare('SELECT * FROM scan_sessions WHERE status = ? ORDER BY created_at DESC').all('running');
      return sessions.map(session => ({
        ...session,
        sessionType: session.session_type,
        ipRange: session.ip_range,
        startTime: session.start_time,
        endTime: session.end_time,
        devicesFound: session.devices_found,
        minersDetected: session.miners_detected,
        createdAt: session.created_at
      })) as ScanSession[];
    } catch (error) {
      console.error('Error getting active scan sessions:', error);
      return [];
    }
  }

  async getRecentActivities(limit: number = 50): Promise<SystemActivity[]> {
    try {
      const activities = db.prepare('SELECT * FROM activities ORDER BY timestamp DESC LIMIT ?').all(limit);
      return activities.map(activity => ({
        ...activity,
        activityType: activity.type,
        createdAt: activity.timestamp
      })) as SystemActivity[];
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }

  async createActivity(insertActivity: InsertActivity): Promise<SystemActivity> {
    try {
      const stmt = db.prepare(`
        INSERT INTO activities (type, description)
        VALUES (?, ?)
      `);

      const result = stmt.run(
        insertActivity.activityType,
        insertActivity.description
      );

      const newActivity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
      return {
        ...newActivity,
        activityType: newActivity.type,
        createdAt: newActivity.timestamp
      } as SystemActivity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async getRfSignals(): Promise<RfSignal[]> {
      return [];
  }

  async createRfSignal(insertSignal: InsertRfSignal): Promise<RfSignal> {
      return insertSignal as RfSignal;
  }

  async getRfSignalsByLocation(location: string): Promise<RfSignal[]> {
      return [];
  }

  async getPlcAnalyses(): Promise<PlcAnalysis[]> {
      return [];
  }

  async createPlcAnalysis(insertAnalysis: InsertPlcAnalysis): Promise<PlcAnalysis> {
      return insertAnalysis as PlcAnalysis;
  }

  async getAcousticSignatures(): Promise<AcousticSignature[]> {
      return [];
  }

  async createAcousticSignature(insertSignature: InsertAcousticSignature): Promise<AcousticSignature> {
      return insertSignature as AcousticSignature;
  }

  async getThermalSignatures(): Promise<ThermalSignature[]> {
      return [];
  }

  async createThermalSignature(insertSignature: InsertThermalSignature): Promise<ThermalSignature> {
      return insertSignature as ThermalSignature;
  }

  async getNetworkTraffic(): Promise<NetworkTraffic[]> {
      return [];
  }

  async createNetworkTraffic(insertTraffic: InsertNetworkTraffic): Promise<NetworkTraffic> {
      return insertTraffic as NetworkTraffic;
  }

  async getStratumConnections(): Promise<NetworkTraffic[]> {
      return [];
  }

  async getStatistics(): Promise<{
      totalDevices: number;
      confirmedMiners: number;
      suspiciousDevices: number;
      totalPowerConsumption: number;
      networkHealth: number;
      rfSignalsDetected: number;
      acousticSignatures: number;
      thermalAnomalies: number;
  }> {
      try {
          const totalDevices = db.prepare('SELECT COUNT(*) as cnt FROM miners').get()?.cnt || 0;
          const confirmedMiners = db.prepare('SELECT COUNT(*) as cnt FROM miners WHERE suspicion_score >= 80').get()?.cnt || 0;
          const suspiciousDevices = db.prepare('SELECT COUNT(*) as cnt FROM miners WHERE suspicion_score >= 50 AND suspicion_score < 80').get()?.cnt || 0;
          const totalPowerConsumption = db.prepare('SELECT SUM(power_consumption) as sum FROM miners WHERE power_consumption IS NOT NULL').get()?.sum || 0;

          // Calculate network health based on active miners vs total
          const activeMiners = db.prepare('SELECT COUNT(*) as cnt FROM miners WHERE is_active = 1').get()?.cnt || 0;
          const networkHealth = totalDevices > 0 ? Math.round((activeMiners / totalDevices) * 100) : 100;

          return {
              totalDevices,
              confirmedMiners,
              suspiciousDevices,
              totalPowerConsumption,
              networkHealth,
              rfSignalsDetected: 0, // TODO: implement RF signals table
              acousticSignatures: 0, // TODO: implement acoustic signatures table
              thermalAnomalies: 0, // TODO: implement thermal signatures table
          };
      } catch (error) {
          console.error('Error getting statistics:', error);
          return {
              totalDevices: 0,
              confirmedMiners: 0,
              suspiciousDevices: 0,
              totalPowerConsumption: 0,
              networkHealth: 0,
              rfSignalsDetected: 0,
              acousticSignatures: 0,
              thermalAnomalies: 0,
          };
      }
  }
}

export class MemStorage implements IStorage {
    sessionStore: any;
    private users: Map<number, User> = new Map();
    private usersByUsername: Map<string, User> = new Map();
    private nextUserId = 1;

    async getUser(id: number): Promise<User | undefined> {
        return this.users.get(id);
    }
    async getUserByUsername(username: string): Promise<User | undefined> {
        return this.usersByUsername.get(username);
    }
    async createUser(insertUser: InsertUser): Promise<User> {
        const user: User = {
            id: this.nextUserId++,
            username: insertUser.username,
            password: insertUser.password,
            email: insertUser.email || null,
            role: insertUser.role || 'operator',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: insertUser.isActive !== false
        };
        this.users.set(user.id, user);
        this.usersByUsername.set(user.username, user);
        return user;
    }
    async getDetectedMiners(): Promise<DetectedMiner[]> {
        return [];
    }
    async getMinerById(id: number): Promise<DetectedMiner | undefined> {
        return undefined;
    }
    async createMiner(miner: InsertMiner): Promise<DetectedMiner> {
        return miner as DetectedMiner;
    }
    async updateMiner(id: number, updates: Partial<InsertMiner>): Promise<DetectedMiner | undefined> {
        return undefined;
    }
    async getActiveMiners(): Promise<DetectedMiner[]> {
        return [];
    }
    async getMinersInArea(bounds: { north: number; south: number; east: number; west: number }): Promise<DetectedMiner[]> {
        return [];
    }
    async getNetworkConnections(): Promise<NetworkConnection[]> {
        return [];
    }
    async createConnection(connection: InsertConnection): Promise<NetworkConnection> {
        return connection as NetworkConnection;
    }
    async getConnectionsByMiner(minerId: number): Promise<NetworkConnection[]> {
        return [];
    }
    async getScanSessions(): Promise<ScanSession[]> {
        return [];
    }
    async createScanSession(session: InsertScanSession): Promise<ScanSession> {
        return session as ScanSession;
    }
    async updateScanSession(id: number, updates: Partial<InsertScanSession>): Promise<ScanSession | undefined> {
        return undefined;
    }
    async getActiveScanSessions(): Promise<ScanSession[]> {
        return [];
    }
    async getRecentActivities(limit?: number): Promise<SystemActivity[]> {
        return [];
    }
    async createActivity(activity: InsertActivity): Promise<SystemActivity> {
        return activity as SystemActivity;
    }
    async getRfSignals(): Promise<RfSignal[]> {
        return [];
    }
    async createRfSignal(signal: InsertRfSignal): Promise<RfSignal> {
        return signal as RfSignal;
    }
    async getRfSignalsByLocation(location: string): Promise<RfSignal[]> {
        return [];
    }
    async getPlcAnalyses(): Promise<PlcAnalysis[]> {
        return [];
    }
    async createPlcAnalysis(analysis: InsertPlcAnalysis): Promise<PlcAnalysis> {
        return analysis as PlcAnalysis;
    }
    async getAcousticSignatures(): Promise<AcousticSignature[]> {
        return [];
    }
    async createAcousticSignature(signature: InsertAcousticSignature): Promise<AcousticSignature> {
        return signature as AcousticSignature;
    }
    async getThermalSignatures(): Promise<ThermalSignature[]> {
        return [];
    }
    async createThermalSignature(signature: InsertThermalSignature): Promise<ThermalSignature> {
        return signature as ThermalSignature;
    }
    async getNetworkTraffic(): Promise<NetworkTraffic[]> {
        return [];
    }
    async createNetworkTraffic(traffic: InsertNetworkTraffic): Promise<NetworkTraffic> {
        return traffic as NetworkTraffic;
    }
    async getStratumConnections(): Promise<NetworkTraffic[]> {
        return [];
    }
    async getStatistics(): Promise<{
        totalDevices: number;
        confirmedMiners: number;
        suspiciousDevices: number;
        totalPowerConsumption: number;
        networkHealth: number;
        rfSignalsDetected: number;
        acousticSignatures: number;
        thermalAnomalies: number;
    }> {
        return {
            totalDevices: 0,
            confirmedMiners: 0,
            suspiciousDevices: 0,
            totalPowerConsumption: 0,
            networkHealth: 0,
            rfSignalsDetected: 0,
            acousticSignatures: 0,
            thermalAnomalies: 0
        };
    }
}

export const storage = new DatabaseStorage();
