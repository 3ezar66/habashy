import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertMinerSchema, 
  insertConnectionSchema, 
  insertScanSessionSchema, 
  insertActivitySchema,
  insertRfSignalSchema,
  insertNetworkTrafficSchema
} from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function initializeDefaultUser() {
  try {
    console.log("Checking for existing user...");
    const existingUser = await storage.getUserByUsername("4501145031");
    console.log("Existing user:", existingUser ? "Found" : "Not found");

    if (!existingUser) {
      console.log("Creating default user...");
      const hashedPassword = await hashPassword("470505");
      console.log("Password hashed, creating user...");

      await storage.createUser({
        username: "4501145031",
        password: hashedPassword,
        role: "admin"
      });
      console.log("Default admin user created successfully");
    } else {
      console.log("Default user already exists");
    }
  } catch (error) {
    console.error("Error creating default user:", error);
  }
}

async function initializeSampleData() {
  try {
    console.log("Checking for existing sample data...");
    const existingMiners = await storage.getDetectedMiners();

    if (existingMiners.length === 0) {
      console.log("Creating sample miners for testing...");

      // اضافه کردن نمونه ماینرها برای تست
      const sampleMiners = [
        {
          ipAddress: "192.168.1.100",
          macAddress: "00:1B:44:11:3A:B7",
          deviceType: "antminer",
          openPorts: "22,80,4028",
          suspicionScore: 95,
          city: "ایلام",
          country: "ایران",
          latitude: 33.6374,
          longitude: 46.4227,
          hostname: "antminer-s19",
          status: "active",
          powerConsumption: 3250,
          hashRate: "95 TH/s",
          responseTime: 45,
          isActive: true,
          notes: "Antminer S19 Pro - تشخیص شده با اطمینان بالا",
          detectionMethod: "port_scan,web_interface,api_response",
          threatLevel: "critical",
          processName: "cgminer",
          confidenceScore: 95
        },
        {
          ipAddress: "192.168.1.156",
          macAddress: "00:1A:92:45:2C:D8",
          deviceType: "whatsminer",
          openPorts: "80,8080,4028",
          suspicionScore: 88,
          city: "ایلام",
          country: "ایران",
          latitude: 33.6280,
          longitude: 46.4150,
          hostname: "whatsminer-m30s",
          status: "active",
          powerConsumption: 3344,
          hashRate: "88 TH/s",
          responseTime: 52,
          isActive: true,
          notes: "WhatsMiner M30S+ - فعال و در حال استخراج",
          detectionMethod: "web_interface,power_analysis",
          threatLevel: "high",
          processName: "btcminer",
          confidenceScore: 88
        },
        {
          ipAddress: "192.168.1.203",
          macAddress: "00:2B:67:89:1F:E3",
          deviceType: "gpu_miner",
          openPorts: "22,3333,8080",
          suspicionScore: 75,
          city: "ایلام",
          country: "ایران",
          latitude: 33.6450,
          longitude: 46.4300,
          hostname: "mining-rig-01",
          status: "active",
          powerConsumption: 1850,
          hashRate: "420 MH/s",
          responseTime: 38,
          isActive: true,
          notes: "ریگ GPU - احتمالاً استخراج اتریوم",
          detectionMethod: "network_pattern,gpu_detection",
          threatLevel: "medium",
          processName: "t-rex",
          confidenceScore: 75
        },
        {
          ipAddress: "192.168.1.89",
          macAddress: "00:3C:45:12:8A:F9",
          deviceType: "asic",
          openPorts: "80,443,4028,9999",
          suspicionScore: 92,
          city: "ایلام",
          country: "ایران",
          latitude: 33.6320,
          longitude: 46.4180,
          hostname: "avalon-1246",
          status: "active",
          powerConsumption: 3420,
          hashRate: "90 TH/s",
          responseTime: 41,
          isActive: true,
          notes: "Avalon 1246 - ASIC ماینر قدرتمند",
          detectionMethod: "api_response,power_signature",
          threatLevel: "critical",
          processName: "cgminer",
          confidenceScore: 92
        },
        {
          ipAddress: "192.168.1.78",
          macAddress: "00:4D:23:56:9B:C1",
          deviceType: "unknown",
          openPorts: "80,9999",
          suspicionScore: 65,
          city: "ایلام",
          country: "ایران",
          latitude: 33.6400,
          longitude: 46.4250,
          hostname: "suspicious-device",
          status: "suspicious",
          powerConsumption: 2100,
          hashRate: null,
          responseTime: 78,
          isActive: true,
          notes: "دستگاه مشکوک - نیاز به بررسی بیشتر",
          detectionMethod: "port_pattern,power_anomaly",
          threatLevel: "medium",
          processName: null,
          confidenceScore: 65
        }
      ];

      for (const minerData of sampleMiners) {
        await storage.createMiner(minerData);

        // اضافه کردن فعالیت سیستم
        await storage.createActivity({
          activityType: "miner_detected",
          description: `ماینر جدید تشخیص داده شد: ${minerData.ipAddress} (${minerData.deviceType})`
        });
      }

      console.log("Sample miners created successfully");

      // اضافه کردن نمونه فعالیت‌ها
      const sampleActivities = [
        {
          activityType: "scan_completed",
          description: "اسکن جامع شبکه تکمیل شد - 5 ماینر تشخیص داده شد"
        },
        {
          activityType: "rf_scan",
          description: "اسکن امواج رادیویی شروع شد"
        },
        {
          activityType: "network_analysis",
          description: "تجزیه و تحلیل ترافیک شبکه انجام شد"
        },
        {
          activityType: "alert_generated",
          description: "هشدار: فعالیت مشکوک در IP 192.168.1.78"
        }
      ];

      for (const activity of sampleActivities) {
        await storage.createActivity(activity);
      }

      console.log("Sample activities created successfully");
    } else {
      console.log("Sample data already exists");
    }
  } catch (error) {
    console.error("Error creating sample data:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup authentication routes
  setupAuth(app);

  // Initialize default admin user
  await initializeDefaultUser();

  // Initialize sample data for testing
  await initializeSampleData();

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active WebSocket connections
  const wsConnections = new Set<any>();

  wss.on('connection', (ws) => {
    wsConnections.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      wsConnections.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsConnections.delete(ws);
    });
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    wsConnections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }

  // Get all detected miners
  app.get("/api/miners", async (req, res) => {
    try {
      const miners = await storage.getDetectedMiners();
      res.json(miners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch miners" });
    }
  });

  // Get miners in Ilam province area
  app.get("/api/miners/ilam", async (req, res) => {
    try {
      const bounds = {
        north: 34.5,
        south: 32.0,
        east: 48.5,
        west: 45.5
      };
      const miners = await storage.getMinersInArea(bounds);
      res.json(miners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Ilam miners" });
    }
  });

  // Create new miner detection entry
  app.post("/api/miners", async (req, res) => {
    try {
      const validatedData = insertMinerSchema.parse(req.body);
      const miner = await storage.createMiner(validatedData);
      
      // Broadcast new miner detection to all clients
      broadcast({
        type: 'miner_detected',
        data: miner
      });
      
      res.status(201).json(miner);
    } catch (error) {
      res.status(400).json({ error: "Invalid miner data" });
    }
  });

  // Update miner information
  app.patch("/api/miners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const miner = await storage.updateMiner(id, updates);
      
      if (!miner) {
        return res.status(404).json({ error: "Miner not found" });
      }
      
      broadcast({
        type: 'miner_updated',
        data: miner
      });
      
      res.json(miner);
    } catch (error) {
      res.status(400).json({ error: "Failed to update miner" });
    }
  });

  // Get system statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Start comprehensive scan
  app.post("/api/scan/comprehensive", async (req, res) => {
    try {
      const { ipRange, ports, timeout } = req.body;
      
      // Create scan session
      const session = await storage.createScanSession({
        sessionType: 'comprehensive',
        ipRange: ipRange || '192.168.1.0/24',
        ports: Array.isArray(ports) ? ports.join(',') : ports || '22,80,443,4028,8080,9999',
        status: 'running'
      });

      // Broadcast scan start
      broadcast({
        type: 'scan_started',
        data: session
      });

      // Run Python miner detection script
      const pythonScript = path.join(process.cwd(), 'server', 'services', 'minerDetector.py');
      const pythonProcess = spawn('python3', [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Send scan configuration to Python script
      const scanConfig = {
        ip_range: ipRange || '192.168.1.0/24',
        ports: Array.isArray(ports) ? ports : (ports ? ports.split(',').map((p: string) => parseInt(p.trim())) : [22, 80, 443, 4028, 8080, 9999]),
        timeout: timeout || 3
      };

      pythonProcess.stdin.write(JSON.stringify(scanConfig));
      pythonProcess.stdin.end();

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        
        // Try to parse progress updates
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.includes('Progress:')) {
            broadcast({
              type: 'scan_progress',
              data: { sessionId: session.id, message: line.trim() }
            });
          }
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        try {
          if (code === 0 && output) {
            const results = JSON.parse(output);
            
            // Process detected devices
            for (const device of results.detected_devices || []) {
              if (device.detection_results?.is_miner) {
                // Store confirmed miner
                const minerData = {
                  ipAddress: device.ip_address,
                  macAddress: device.mac_address || null,
                  hostname: device.hostname || null,
                  latitude: device.geolocation?.['ip-api']?.lat || device.geolocation?.['ipapi']?.lat || null,
                  longitude: device.geolocation?.['ip-api']?.lon || device.geolocation?.['ipapi']?.lon || null,
                  city: device.geolocation?.['ip-api']?.city || device.geolocation?.['ipapi']?.city || null,
                  detectionMethod: device.detection_results.detection_methods.join(','),
                  powerConsumption: device.detection_results.power_consumption || null,
                  hashRate: device.detection_results.hash_rate || null,
                  deviceType: device.detection_results.device_type || 'unknown',
                  processName: device.detection_results.mining_software || null,
                  confidenceScore: device.detection_results.confidence_score || 0,
                  threatLevel: device.threat_level || 'medium',
                  notes: JSON.stringify(device.detection_results)
                };

                const miner = await storage.createMiner(minerData);

                // Store network connections
                for (const port of device.open_ports || []) {
                  await storage.createConnection({
                    localAddress: device.ip_address,
                    localPort: port,
                    remoteAddress: null,
                    remotePort: null,
                    protocol: 'tcp',
                    status: 'open',
                    processName: null,
                    minerId: miner.id
                  });
                }

                broadcast({
                  type: 'miner_detected',
                  data: miner
                });
              }
            }

            // Update scan session
            await storage.updateScanSession(session.id, {
              status: 'completed',
              endTime: new Date(),
              devicesFound: results.total_devices || 0,
              minersDetected: results.miners_found || 0
            });

            broadcast({
              type: 'scan_completed',
              data: { sessionId: session.id, results }
            });

            res.json({ sessionId: session.id, results });
          } else {
            throw new Error(errorOutput || 'Python script failed');
          }
        } catch (error) {
          console.error('Scan processing error:', error);
          
          await storage.updateScanSession(session.id, {
            status: 'failed',
            endTime: new Date(),
            errors: error instanceof Error ? error.message : 'Unknown error'
          });

          broadcast({
            type: 'scan_failed',
            data: { sessionId: session.id, error: error instanceof Error ? error.message : 'Unknown error' }
          });

          res.status(500).json({ error: 'Scan failed', details: error instanceof Error ? error.message : 'Unknown error' });
        }
      });

    } catch (error) {
      console.error('Scan start error:', error);
      res.status(500).json({ error: "Failed to start comprehensive scan" });
    }
  });

  // Start network scan
  app.post("/api/scan/network", async (req, res) => {
    try {
      const { network } = req.body;
      
      const session = await storage.createScanSession({
        sessionType: 'network',
        ipRange: network || '192.168.1.0/24',
        status: 'running'
      });

      broadcast({
        type: 'scan_started',
        data: session
      });

      // Run network scanner
      const pythonScript = path.join(process.cwd(), 'server', 'services', 'networkScanner.py');
      const pythonProcess = spawn('python3', ['-c', `
import sys
sys.path.append('${path.dirname(pythonScript)}')
from networkScanner import start_network_scan, get_scan_results
import json
import time

config = ${JSON.stringify({ network: network || '192.168.1.0/24' })}
scan_id = start_network_scan(config)
print(f"Started scan: {scan_id}")

# Wait for completion
for i in range(60):  # Wait up to 60 seconds
    time.sleep(1)
    results = get_scan_results(scan_id)
    if results.get('status') in ['completed', 'failed']:
        print(json.dumps(results))
        break
`]);

      let output = '';
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        try {
          const lines = output.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const results = JSON.parse(lastLine);

          await storage.updateScanSession(session.id, {
            status: results.status || 'completed',
            endTime: new Date(),
            devicesFound: results.results?.length || 0
          });

          broadcast({
            type: 'network_scan_completed',
            data: { sessionId: session.id, results }
          });

          res.json({ sessionId: session.id, results });
        } catch (error) {
          console.error('Network scan error:', error);
          res.status(500).json({ error: 'Network scan failed' });
        }
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to start network scan" });
    }
  });

  // Get recent activities
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Get scan sessions
  app.get("/api/scans", async (req, res) => {
    try {
      const sessions = await storage.getScanSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan sessions" });
    }
  });

  // Geolocate specific IP
  app.post("/api/geolocate", async (req, res) => {
    try {
      const { ipAddress } = req.body;
      
      if (!ipAddress) {
        return res.status(400).json({ error: "IP address is required" });
      }

      const pythonScript = path.join(process.cwd(), 'server', 'services', 'geolocator.py');
      const pythonProcess = spawn('python3', ['-c', `
import sys
sys.path.append('${path.dirname(pythonScript)}')
from geolocator import geolocate_device
import json

result = geolocate_device('${ipAddress}')
print(json.dumps(result, ensure_ascii=False))
`]);

      let output = '';
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', (code) => {
        try {
          const result = JSON.parse(output.trim());
          res.json(result);
        } catch (error) {
          res.status(500).json({ error: 'Geolocation failed' });
        }
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to geolocate IP" });
    }
  });

  // Owner identification endpoint
  app.post("/api/identify-owner", async (req, res) => {
    try {
      const { ipAddress, macAddress } = req.body;
      
      if (!ipAddress) {
        return res.status(400).json({ error: "IP address is required" });
      }

      // Call Python owner identification service
      const pythonScript = path.join(process.cwd(), "server", "services", "ownerIdentification.py");
      const args = macAddress ? [ipAddress, macAddress] : [ipAddress];
      
      const pythonProcess = spawn("python3", [pythonScript, ...args]);
      
      let stdout = "";
      let stderr = "";
      
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({ 
              error: "Failed to parse owner identification result",
              stdout: stdout,
              stderr: stderr
            });
          }
        } else {
          res.status(500).json({ 
            error: "Owner identification failed",
            stderr: stderr,
            code: code
          });
        }
      });
      
      // Set timeout for the process
      setTimeout(() => {
        pythonProcess.kill();
        res.status(408).json({ error: "Owner identification timeout" });
      }, 30000); // 30 second timeout
      
    } catch (error) {
      res.status(500).json({ error: "Failed to identify owner" });
    }
  });

  // RF analysis endpoint
  app.post("/api/rf-scan", async (req, res) => {
    try {
      const { location } = req.body;
      
      // Call Python RF analyzer service
      const pythonScript = path.join(process.cwd(), "server", "services", "rfAnalyzer.py");
      const pythonProcess = spawn("python3", [pythonScript, "scan", location || "unknown"]);
      
      let stdout = "";
      let stderr = "";
      
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            
            // Broadcast RF scan results
            broadcast({
              type: 'rf_scan_completed',
              data: result
            });
            
            res.json(result);
          } catch (parseError) {
            res.status(500).json({ 
              error: "Failed to parse RF scan result",
              stdout: stdout,
              stderr: stderr
            });
          }
        } else {
          res.status(500).json({ 
            error: "RF scan failed",
            stderr: stderr,
            code: code
          });
        }
      });
      
      // Set timeout for the process
      setTimeout(() => {
        pythonProcess.kill();
        res.status(408).json({ error: "RF scan timeout" });
      }, 60000); // 60 second timeout
      
    } catch (error) {
      res.status(500).json({ error: "Failed to start RF scan" });
    }
  });

  // Get RF scan status
  app.get("/api/rf-status", async (req, res) => {
    try {
      const pythonScript = path.join(process.cwd(), "server", "services", "rfAnalyzer.py");
      const pythonProcess = spawn("python3", [pythonScript, "status"]);
      
      let stdout = "";
      let stderr = "";
      
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({ 
              error: "Failed to parse RF status result"
            });
          }
        } else {
          res.status(500).json({ 
            error: "Failed to get RF status"
          });
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: "Failed to check RF status" });
    }
  });

  // Get recent RF detections
  app.get("/api/rf-detections", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const pythonScript = path.join(process.cwd(), "server", "services", "rfAnalyzer.py");
      const pythonProcess = spawn("python3", [pythonScript, "recent", hours.toString()]);
      
      let stdout = "";
      let stderr = "";
      
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({ 
              error: "Failed to parse RF detections result"
            });
          }
        } else {
          res.status(500).json({ 
            error: "Failed to get RF detections"
          });
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RF detections" });
    }
  });

  // Advanced Detection System Endpoints

  // Start advanced detection
  app.post("/api/advanced-detection/start", async (req, res) => {
    try {
      const { detection_types, location, duration } = req.body;

      const pythonScript = path.join(process.cwd(), 'server', 'services', 'advanced_detection.py');
      const pythonProcess = spawn('python3', [pythonScript, 'start'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const config = {
        detection_types: detection_types || ['rf_detection', 'vibration_analysis', 'electromagnetic_scan'],
        location: location || [33.6374, 46.4227],
        duration: duration || 300
      };

      pythonProcess.stdin.write(JSON.stringify(config));
      pythonProcess.stdin.end();

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && output) {
          try {
            const result = JSON.parse(output);

            // Broadcast detection start
            broadcast({
              type: 'advanced_detection_started',
              data: result
            });

            res.json(result);
          } catch (parseError) {
            res.status(500).json({ error: 'Failed to parse detection result' });
          }
        } else {
          res.status(500).json({
            error: 'Advanced detection failed',
            details: errorOutput
          });
        }
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to start advanced detection" });
    }
  });

  // Stop advanced detection
  app.post("/api/advanced-detection/stop/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;

      const pythonScript = path.join(process.cwd(), 'server', 'services', 'advanced_detection.py');
      const pythonProcess = spawn('python3', [pythonScript, 'stop', sessionId]);

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          broadcast({
            type: 'advanced_detection_stopped',
            data: { sessionId }
          });

          res.json({ status: 'stopped', sessionId });
        } else {
          res.status(500).json({ error: 'Failed to stop detection' });
        }
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to stop advanced detection" });
    }
  });

  // Get advanced detection status
  app.get("/api/advanced-detection/status", async (req, res) => {
    try {
      const pythonScript = path.join(process.cwd(), 'server', 'services', 'advanced_detection.py');
      const pythonProcess = spawn('python3', [pythonScript, 'status']);

      let output = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && output) {
          try {
            const result = JSON.parse(output);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({ error: 'Failed to parse status result' });
          }
        } else {
          res.status(500).json({ error: 'Failed to get detection status' });
        }
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to get detection status" });
    }
  });

  // Get real-time alerts
  app.get("/api/advanced-detection/alerts", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;

      const pythonScript = path.join(process.cwd(), 'server', 'services', 'advanced_detection.py');
      const pythonProcess = spawn('python3', [pythonScript, 'alerts', hours.toString()]);

      let output = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && output) {
          try {
            const result = JSON.parse(output);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({ error: 'Failed to parse alerts result' });
          }
        } else {
          res.status(500).json({ error: 'Failed to get alerts' });
        }
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to get alerts" });
    }
  });

  // Get detection results
  app.get("/api/advanced-detection/results/:sessionId?", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;

      const pythonScript = path.join(process.cwd(), 'server', 'services', 'advanced_detection.py');
      const args = sessionId ? ['results', sessionId] : ['results', hours.toString()];
      const pythonProcess = spawn('python3', [pythonScript, ...args]);

      let output = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && output) {
          try {
            const result = JSON.parse(output);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({ error: 'Failed to parse results' });
          }
        } else {
          res.status(500).json({ error: 'Failed to get detection results' });
        }
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to get detection results" });
    }
  });

  // Export data
  app.get("/api/export", async (req, res) => {
    try {
      const format = req.query.format as string || 'json';

      const data = {
        miners: await storage.getDetectedMiners(),
        activities: await storage.getRecentActivities(),
        scans: await storage.getScanSessions(),
        statistics: await storage.getStatistics(),
        export_time: new Date().toISOString()
      };

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="ilam_miners_export_${new Date().toISOString().split('T')[0]}.json"`);
        res.json(data);
      } else {
        res.status(400).json({ error: 'Unsupported format' });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  return httpServer;
}
