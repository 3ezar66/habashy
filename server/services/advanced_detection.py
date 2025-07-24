#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ماژول تشخیص پیشرفته و جامع ماینرها
ادغام تمام روش‌های تشخیص: RF، ارتعاشات، رادار، AI و نقشه‌برداری
"""

import numpy as np
import json
import threading
import time
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import queue
import sqlite3

# Import specialized detection modules
try:
    import pyaudio
    import scipy.signal
    from scipy.fft import fft, fftfreq
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False
    print("Audio modules not available")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedMinerDetectionSystem:
    def __init__(self):
        self.is_active = False
        self.detection_results = queue.Queue()
        self.active_sessions = {}
        
        # Detection modules configuration
        self.detection_modules = {
            'rf_detection': True,
            'vibration_analysis': True,
            'network_forensics': True,
            'ai_classification': True,
            'electromagnetic_scan': True,
            'thermal_imaging': True,
            'acoustic_fingerprinting': True
        }
        
        # Initialize detection databases
        self.init_detection_database()
        
        # Miner signatures database
        self.miner_signatures = self.load_miner_signatures()
        
        # Alert thresholds
        self.alert_thresholds = {
            'critical': 0.85,
            'high': 0.70,
            'medium': 0.50,
            'low': 0.30
        }
        
    def init_detection_database(self):
        """Initialize advanced detection database"""
        try:
            self.db_conn = sqlite3.connect('advanced_detection.db', check_same_thread=False)
            cursor = self.db_conn.cursor()
            
            # Detection sessions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS detection_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT UNIQUE,
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    detection_type TEXT,
                    location_lat REAL,
                    location_lon REAL,
                    status TEXT DEFAULT 'active'
                )
            ''')
            
            # Advanced detections table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS advanced_detections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    detection_time TIMESTAMP,
                    device_id TEXT,
                    detection_method TEXT,
                    confidence_score REAL,
                    threat_level TEXT,
                    rf_signature TEXT,
                    vibration_pattern TEXT,
                    electromagnetic_reading TEXT,
                    thermal_signature TEXT,
                    acoustic_fingerprint TEXT,
                    ai_classification TEXT,
                    device_location_lat REAL,
                    device_location_lon REAL,
                    additional_data TEXT
                )
            ''')
            
            # Real-time alerts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS real_time_alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_time TIMESTAMP,
                    alert_type TEXT,
                    severity TEXT,
                    message TEXT,
                    detection_id INTEGER,
                    acknowledged BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (detection_id) REFERENCES advanced_detections (id)
                )
            ''')
            
            self.db_conn.commit()
            logger.info("Advanced detection database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
    
    def load_miner_signatures(self):
        """Load comprehensive miner signatures"""
        return {
            'asic_miners': {
                'bitmain_s19': {
                    'rf_frequencies': [15000, 22000, 35000, 45000],
                    'power_signature': {'min': 3200, 'max': 3800},
                    'vibration_pattern': 'high_frequency_continuous',
                    'electromagnetic_field': {'strength': 'high', 'pattern': 'regular'},
                    'thermal_profile': {'peak_temp': 85, 'distribution': 'concentrated'},
                    'acoustic_pattern': [1380, 1420, 2760, 2840],
                    'confidence_multiplier': 1.0
                },
                'bitmain_s17': {
                    'rf_frequencies': [12000, 18000, 28000, 42000],
                    'power_signature': {'min': 2400, 'max': 2800},
                    'vibration_pattern': 'medium_frequency_pulsed',
                    'electromagnetic_field': {'strength': 'medium', 'pattern': 'irregular'},
                    'thermal_profile': {'peak_temp': 75, 'distribution': 'distributed'},
                    'acoustic_pattern': [1200, 1250, 2400, 2500],
                    'confidence_multiplier': 0.9
                },
                'antminer_t19': {
                    'rf_frequencies': [16000, 24000, 38000, 48000],
                    'power_signature': {'min': 3000, 'max': 3500},
                    'vibration_pattern': 'high_frequency_variable',
                    'electromagnetic_field': {'strength': 'high', 'pattern': 'stable'},
                    'thermal_profile': {'peak_temp': 80, 'distribution': 'uniform'},
                    'acoustic_pattern': [1400, 1450, 2800, 2900],
                    'confidence_multiplier': 0.95
                }
            },
            'gpu_miners': {
                'rtx_3080_rig': {
                    'rf_frequencies': [8000, 12000, 18000, 25000],
                    'power_signature': {'min': 1800, 'max': 2400},
                    'vibration_pattern': 'variable_frequency_burst',
                    'electromagnetic_field': {'strength': 'medium', 'pattern': 'variable'},
                    'thermal_profile': {'peak_temp': 75, 'distribution': 'multi_point'},
                    'acoustic_pattern': [800, 1200, 1600, 2400],
                    'confidence_multiplier': 0.8
                },
                'rtx_4090_rig': {
                    'rf_frequencies': [10000, 15000, 22000, 30000],
                    'power_signature': {'min': 2200, 'max': 3000},
                    'vibration_pattern': 'high_amplitude_variable',
                    'electromagnetic_field': {'strength': 'high', 'pattern': 'complex'},
                    'thermal_profile': {'peak_temp': 85, 'distribution': 'concentrated'},
                    'acoustic_pattern': [900, 1300, 1800, 2600],
                    'confidence_multiplier': 0.85
                }
            },
            'fpga_miners': {
                'custom_fpga': {
                    'rf_frequencies': [5000, 8000, 12000, 20000],
                    'power_signature': {'min': 800, 'max': 1500},
                    'vibration_pattern': 'low_frequency_steady',
                    'electromagnetic_field': {'strength': 'low', 'pattern': 'steady'},
                    'thermal_profile': {'peak_temp': 60, 'distribution': 'even'},
                    'acoustic_pattern': [400, 600, 800, 1200],
                    'confidence_multiplier': 0.7
                }
            }
        }
    
    async def start_comprehensive_detection(self, location_coords=None, detection_types=None):
        """Start comprehensive multi-modal detection"""
        session_id = f"detection_{int(time.time() * 1000)}"
        
        # Create detection session
        cursor = self.db_conn.cursor()
        cursor.execute('''
            INSERT INTO detection_sessions 
            (session_id, start_time, detection_type, location_lat, location_lon, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            session_id,
            datetime.utcnow(),
            ','.join(detection_types or list(self.detection_modules.keys())),
            location_coords[0] if location_coords else None,
            location_coords[1] if location_coords else None,
            'active'
        ))
        self.db_conn.commit()
        
        self.is_active = True
        self.active_sessions[session_id] = {
            'start_time': datetime.utcnow(),
            'location': location_coords,
            'types': detection_types or list(self.detection_modules.keys()),
            'results': []
        }
        
        logger.info(f"Started comprehensive detection session: {session_id}")
        
        # Start detection modules in parallel
        detection_tasks = []
        
        if not detection_types or 'rf_detection' in detection_types:
            detection_tasks.append(self.rf_detection_module(session_id))
        
        if not detection_types or 'vibration_analysis' in detection_types:
            detection_tasks.append(self.vibration_analysis_module(session_id))
        
        if not detection_types or 'electromagnetic_scan' in detection_types:
            detection_tasks.append(self.electromagnetic_scan_module(session_id))
        
        if not detection_types or 'thermal_imaging' in detection_types:
            detection_tasks.append(self.thermal_imaging_module(session_id))
        
        if not detection_types or 'acoustic_fingerprinting' in detection_types:
            detection_tasks.append(self.acoustic_fingerprinting_module(session_id))
        
        if not detection_types or 'ai_classification' in detection_types:
            detection_tasks.append(self.ai_classification_module(session_id))
        
        # Start correlation engine
        detection_tasks.append(self.correlation_engine(session_id))
        
        # Run all detection modules
        await asyncio.gather(*detection_tasks)
        
        return session_id
    
    async def rf_detection_module(self, session_id):
        """Advanced RF detection and analysis"""
        logger.info(f"RF Detection module started for session {session_id}")
        
        # Simulate RF spectrum analysis
        for frequency_band in range(1000, 50000, 1000):
            if not self.is_active:
                break
                
            # Simulate RF reading
            rf_strength = np.random.exponential(0.3)
            noise_floor = np.random.normal(0.1, 0.02)
            
            # Check against known miner signatures
            for miner_category, miners in self.miner_signatures.items():
                for miner_type, signature in miners.items():
                    if frequency_band in signature['rf_frequencies']:
                        # Enhanced signal detected
                        enhanced_strength = rf_strength * (2 + np.random.random())
                        
                        if enhanced_strength > 0.5:  # Detection threshold
                            detection_result = {
                                'session_id': session_id,
                                'detection_time': datetime.utcnow(),
                                'device_id': f"rf_device_{frequency_band}_{int(time.time())}",
                                'detection_method': 'rf_spectrum_analysis',
                                'confidence_score': min(enhanced_strength * signature['confidence_multiplier'], 1.0),
                                'threat_level': self.calculate_threat_level(enhanced_strength * signature['confidence_multiplier']),
                                'rf_signature': json.dumps({
                                    'frequency': frequency_band,
                                    'strength': enhanced_strength,
                                    'matched_miner': f"{miner_category}:{miner_type}",
                                    'pattern_match': True
                                }),
                                'miner_type': miner_type
                            }
                            
                            await self.store_detection(detection_result)
                            await self.send_real_time_alert(detection_result)
            
            await asyncio.sleep(0.1)  # Prevent overwhelming
    
    async def vibration_analysis_module(self, session_id):
        """Advanced vibration pattern analysis"""
        logger.info(f"Vibration Analysis module started for session {session_id}")
        
        if not AUDIO_AVAILABLE:
            logger.warning("Audio libraries not available for vibration analysis")
            return
        
        # Note: Real vibration analysis would require physical accelerometer/microphone hardware
        # This is a placeholder for actual hardware integration
        logger.info("Vibration analysis requires physical sensors - skipping simulated data")
            
            # Find dominant frequencies
            peak_indices = scipy.signal.find_peaks(magnitude, height=np.max(magnitude)*0.3)[0]
            dominant_freqs = freqs[peak_indices]
            
            # Match against signatures
            for miner_category, miners in self.miner_signatures.items():
                for miner_type, signature in miners.items():
                    matches = sum(1 for freq in dominant_freqs 
                                if any(abs(freq - pattern_freq) < 50 
                                      for pattern_freq in signature['acoustic_pattern']))
                    
                    if matches >= 2:  # At least 2 frequency matches
                        confidence = (matches / len(signature['acoustic_pattern'])) * signature['confidence_multiplier']
                        
                        detection_result = {
                            'session_id': session_id,
                            'detection_time': datetime.utcnow(),
                            'device_id': f"vib_device_{sample_batch}_{int(time.time())}",
                            'detection_method': 'vibration_pattern_analysis',
                            'confidence_score': confidence,
                            'threat_level': self.calculate_threat_level(confidence),
                            'vibration_pattern': json.dumps({
                                'dominant_frequencies': dominant_freqs.tolist()[:10],
                                'pattern_type': signature['vibration_pattern'],
                                'matched_miner': f"{miner_category}:{miner_type}",
                                'frequency_matches': matches
                            }),
                            'miner_type': miner_type
                        }
                        
                        await self.store_detection(detection_result)
                        await self.send_real_time_alert(detection_result)
            
            await asyncio.sleep(1.0)
    
    async def electromagnetic_scan_module(self, session_id):
        """Electromagnetic field analysis"""
        logger.info(f"Electromagnetic Scan module started for session {session_id}")
        
        base_field = 25.0  # Earth's magnetic field (microTesla)
        
        for measurement in range(50):
            if not self.is_active:
                break
            
            # Simulate EM field measurements
            field_strength = base_field + np.random.normal(0, 3)
            
            # Check for anomalies
            for miner_category, miners in self.miner_signatures.items():
                for miner_type, signature in miners.items():
                    if signature['electromagnetic_field']['strength'] == 'high':
                        anomaly_threshold = 15.0
                    elif signature['electromagnetic_field']['strength'] == 'medium':
                        anomaly_threshold = 8.0
                    else:
                        anomaly_threshold = 5.0
                    
                    if np.random.random() > 0.8:  # 20% chance of detection
                        field_strength += np.random.uniform(anomaly_threshold, anomaly_threshold * 2)
                        
                        confidence = min((field_strength - base_field) / anomaly_threshold * 0.7, 1.0)
                        
                        detection_result = {
                            'session_id': session_id,
                            'detection_time': datetime.utcnow(),
                            'device_id': f"em_device_{measurement}_{int(time.time())}",
                            'detection_method': 'electromagnetic_field_analysis',
                            'confidence_score': confidence,
                            'threat_level': self.calculate_threat_level(confidence),
                            'electromagnetic_reading': json.dumps({
                                'field_strength': field_strength,
                                'anomaly_strength': field_strength - base_field,
                                'pattern': signature['electromagnetic_field']['pattern'],
                                'matched_miner': f"{miner_category}:{miner_type}"
                            }),
                            'miner_type': miner_type
                        }
                        
                        await self.store_detection(detection_result)
                        await self.send_real_time_alert(detection_result)
            
            await asyncio.sleep(2.0)
    
    async def thermal_imaging_module(self, session_id):
        """Thermal signature analysis"""
        logger.info(f"Thermal Imaging module started for session {session_id}")
        
        ambient_temp = 25.0  # Celsius
        
        for scan in range(30):
            if not self.is_active:
                break
            
            # Simulate thermal readings
            for miner_category, miners in self.miner_signatures.items():
                for miner_type, signature in miners.items():
                    if np.random.random() > 0.85:  # 15% chance of thermal signature
                        peak_temp = signature['thermal_profile']['peak_temp']
                        measured_temp = ambient_temp + np.random.uniform(peak_temp - 20, peak_temp + 5)
                        
                        if measured_temp > ambient_temp + 30:  # Significant heat signature
                            confidence = min((measured_temp - ambient_temp) / peak_temp * 0.8, 1.0)
                            
                            detection_result = {
                                'session_id': session_id,
                                'detection_time': datetime.utcnow(),
                                'device_id': f"thermal_device_{scan}_{int(time.time())}",
                                'detection_method': 'thermal_signature_analysis',
                                'confidence_score': confidence,
                                'threat_level': self.calculate_threat_level(confidence),
                                'thermal_signature': json.dumps({
                                    'peak_temperature': measured_temp,
                                    'ambient_temperature': ambient_temp,
                                    'temperature_delta': measured_temp - ambient_temp,
                                    'distribution': signature['thermal_profile']['distribution'],
                                    'matched_miner': f"{miner_category}:{miner_type}"
                                }),
                                'miner_type': miner_type
                            }
                            
                            await self.store_detection(detection_result)
                            await self.send_real_time_alert(detection_result)
            
            await asyncio.sleep(3.0)
    
    async def acoustic_fingerprinting_module(self, session_id):
        """Advanced acoustic fingerprinting"""
        logger.info(f"Acoustic Fingerprinting module started for session {session_id}")
        
        for recording in range(40):
            if not self.is_active:
                break
            
            # Simulate acoustic signature detection
            for miner_category, miners in self.miner_signatures.items():
                for miner_type, signature in miners.items():
                    if np.random.random() > 0.75:  # 25% chance of acoustic detection
                        # Generate acoustic fingerprint
                        fingerprint = {
                            'fundamental_frequencies': signature['acoustic_pattern'],
                            'harmonics': [f * 2 for f in signature['acoustic_pattern']],
                            'noise_level': np.random.uniform(0.1, 0.3),
                            'pattern_consistency': np.random.uniform(0.7, 0.95)
                        }
                        
                        confidence = fingerprint['pattern_consistency'] * signature['confidence_multiplier']
                        
                        detection_result = {
                            'session_id': session_id,
                            'detection_time': datetime.utcnow(),
                            'device_id': f"acoustic_device_{recording}_{int(time.time())}",
                            'detection_method': 'acoustic_fingerprinting',
                            'confidence_score': confidence,
                            'threat_level': self.calculate_threat_level(confidence),
                            'acoustic_fingerprint': json.dumps({
                                'fingerprint': fingerprint,
                                'matched_miner': f"{miner_category}:{miner_type}",
                                'quality_score': fingerprint['pattern_consistency']
                            }),
                            'miner_type': miner_type
                        }
                        
                        await self.store_detection(detection_result)
                        await self.send_real_time_alert(detection_result)
            
            await asyncio.sleep(1.5)
    
    async def ai_classification_module(self, session_id):
        """AI-powered device classification"""
        logger.info(f"AI Classification module started for session {session_id}")
        
        # Simulate AI model inference
        for inference_batch in range(20):
            if not self.is_active:
                break
            
            # Generate synthetic features for AI model
            features = {
                'power_consumption': np.random.uniform(500, 4000),
                'cpu_usage': np.random.uniform(20, 100),
                'memory_usage': np.random.uniform(30, 95),
                'network_io': np.random.uniform(1e6, 1e10),
                'disk_io': np.random.uniform(1e5, 1e8),
                'open_ports': np.random.randint(1, 10),
                'process_count': np.random.randint(50, 300),
                'temperature': np.random.uniform(30, 90)
            }
            
            # Simulate AI model prediction
            miner_probability = self.simulate_ai_prediction(features)
            
            if miner_probability > 0.5:
                # Classify miner type based on features
                if features['power_consumption'] > 3000:
                    predicted_type = 'asic_miner'
                elif features['power_consumption'] > 1500:
                    predicted_type = 'gpu_rig'
                else:
                    predicted_type = 'fpga_miner'
                
                detection_result = {
                    'session_id': session_id,
                    'detection_time': datetime.utcnow(),
                    'device_id': f"ai_device_{inference_batch}_{int(time.time())}",
                    'detection_method': 'ai_machine_learning',
                    'confidence_score': miner_probability,
                    'threat_level': self.calculate_threat_level(miner_probability),
                    'ai_classification': json.dumps({
                        'predicted_type': predicted_type,
                        'probability': miner_probability,
                        'features': features,
                        'model_version': '2.1.0'
                    }),
                    'miner_type': predicted_type
                }
                
                await self.store_detection(detection_result)
                await self.send_real_time_alert(detection_result)
            
            await asyncio.sleep(4.0)
    
    def simulate_ai_prediction(self, features):
        """Simulate AI model prediction"""
        # Simple heuristic-based prediction for simulation
        score = 0.0
        
        # Power consumption factor
        if features['power_consumption'] > 2000:
            score += 0.3
        elif features['power_consumption'] > 1000:
            score += 0.2
        
        # CPU usage factor
        if features['cpu_usage'] > 80:
            score += 0.25
        
        # Temperature factor
        if features['temperature'] > 70:
            score += 0.2
        
        # Network I/O factor
        if features['network_io'] > 1e8:
            score += 0.15
        
        # Add some randomness
        score += np.random.uniform(-0.1, 0.1)
        
        return min(max(score, 0.0), 1.0)
    
    async def correlation_engine(self, session_id):
        """Correlate detections from multiple modules"""
        logger.info(f"Correlation Engine started for session {session_id}")
        
        correlation_window = 30  # seconds
        
        while self.is_active:
            await asyncio.sleep(10)
            
            # Get recent detections for correlation
            cursor = self.db_conn.cursor()
            cursor.execute('''
                SELECT * FROM advanced_detections 
                WHERE session_id = ? AND detection_time > ?
                ORDER BY detection_time DESC
            ''', (session_id, datetime.utcnow() - timedelta(seconds=correlation_window)))
            
            recent_detections = cursor.fetchall()
            
            if len(recent_detections) >= 3:  # Minimum for correlation
                # Group by device location (if available) or by time proximity
                correlated_groups = self.group_detections_for_correlation(recent_detections)
                
                for group in correlated_groups:
                    if len(group) >= 3:  # Multi-modal detection
                        combined_confidence = self.calculate_combined_confidence(group)
                        
                        if combined_confidence > 0.8:  # High confidence correlation
                            correlation_result = {
                                'session_id': session_id,
                                'detection_time': datetime.utcnow(),
                                'device_id': f"correlated_device_{int(time.time())}",
                                'detection_method': 'multi_modal_correlation',
                                'confidence_score': combined_confidence,
                                'threat_level': 'critical',
                                'additional_data': json.dumps({
                                    'correlated_detections': len(group),
                                    'detection_methods': [d[3] for d in group],  # detection_method column
                                    'avg_confidence': combined_confidence,
                                    'correlation_strength': 'high'
                                })
                            }
                            
                            await self.store_detection(correlation_result)
                            await self.send_high_priority_alert(correlation_result)
    
    def group_detections_for_correlation(self, detections):
        """Group detections for correlation analysis"""
        groups = []
        time_threshold = 20  # seconds
        
        for detection in detections:
            detection_time = datetime.fromisoformat(detection[2])  # detection_time column
            
            # Find existing group or create new one
            placed = False
            for group in groups:
                group_time = datetime.fromisoformat(group[0][2])
                if abs((detection_time - group_time).total_seconds()) <= time_threshold:
                    group.append(detection)
                    placed = True
                    break
            
            if not placed:
                groups.append([detection])
        
        return groups
    
    def calculate_combined_confidence(self, detections):
        """Calculate combined confidence from multiple detections"""
        confidences = [d[4] for d in detections]  # confidence_score column
        
        # Weighted average with diversity bonus
        avg_confidence = np.mean(confidences)
        diversity_bonus = len(set(d[3] for d in detections)) * 0.05  # detection_method uniqueness
        
        return min(avg_confidence + diversity_bonus, 1.0)
    
    def calculate_threat_level(self, confidence):
        """Calculate threat level based on confidence score"""
        if confidence >= self.alert_thresholds['critical']:
            return 'critical'
        elif confidence >= self.alert_thresholds['high']:
            return 'high'
        elif confidence >= self.alert_thresholds['medium']:
            return 'medium'
        else:
            return 'low'
    
    async def store_detection(self, detection_result):
        """Store detection result in database"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute('''
                INSERT INTO advanced_detections 
                (session_id, detection_time, device_id, detection_method, confidence_score, 
                 threat_level, rf_signature, vibration_pattern, electromagnetic_reading, 
                 thermal_signature, acoustic_fingerprint, ai_classification, additional_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                detection_result['session_id'],
                detection_result['detection_time'],
                detection_result['device_id'],
                detection_result['detection_method'],
                detection_result['confidence_score'],
                detection_result['threat_level'],
                detection_result.get('rf_signature'),
                detection_result.get('vibration_pattern'),
                detection_result.get('electromagnetic_reading'),
                detection_result.get('thermal_signature'),
                detection_result.get('acoustic_fingerprint'),
                detection_result.get('ai_classification'),
                detection_result.get('additional_data')
            ))
            self.db_conn.commit()
            
        except Exception as e:
            logger.error(f"Error storing detection: {e}")
    
    async def send_real_time_alert(self, detection_result):
        """Send real-time alert for detection"""
        alert_data = {
            'alert_time': datetime.utcnow(),
            'alert_type': 'detection',
            'severity': detection_result['threat_level'],
            'message': f"تشخیص {detection_result.get('miner_type', 'دستگاه ماینر')} با روش {detection_result['detection_method']}",
            'detection_id': detection_result['device_id'],
            'confidence': detection_result['confidence_score']
        }
        
        # Store alert
        cursor = self.db_conn.cursor()
        cursor.execute('''
            INSERT INTO real_time_alerts (alert_time, alert_type, severity, message, detection_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            alert_data['alert_time'],
            alert_data['alert_type'],
            alert_data['severity'],
            alert_data['message'],
            alert_data['detection_id']
        ))
        self.db_conn.commit()
        
        logger.info(f"Alert sent: {alert_data['message']}")
    
    async def send_high_priority_alert(self, correlation_result):
        """Send high priority alert for correlated detections"""
        alert_data = {
            'alert_time': datetime.utcnow(),
            'alert_type': 'high_priority_correlation',
            'severity': 'critical',
            'message': f"تشخیص همبسته با اطمینان بالا: {correlation_result['confidence_score']:.2f}",
            'detection_id': correlation_result['device_id']
        }
        
        cursor = self.db_conn.cursor()
        cursor.execute('''
            INSERT INTO real_time_alerts (alert_time, alert_type, severity, message, detection_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            alert_data['alert_time'],
            alert_data['alert_type'],
            alert_data['severity'],
            alert_data['message'],
            alert_data['detection_id']
        ))
        self.db_conn.commit()
        
        logger.warning(f"HIGH PRIORITY ALERT: {alert_data['message']}")
    
    def stop_detection(self, session_id=None):
        """Stop detection session"""
        self.is_active = False
        
        if session_id and session_id in self.active_sessions:
            # Update session status
            cursor = self.db_conn.cursor()
            cursor.execute('''
                UPDATE detection_sessions 
                SET end_time = ?, status = 'completed'
                WHERE session_id = ?
            ''', (datetime.utcnow(), session_id))
            self.db_conn.commit()
            
            del self.active_sessions[session_id]
            logger.info(f"Detection session {session_id} stopped")
    
    def get_detection_results(self, session_id=None, hours=24):
        """Get detection results"""
        cursor = self.db_conn.cursor()
        
        if session_id:
            cursor.execute('''
                SELECT * FROM advanced_detections 
                WHERE session_id = ?
                ORDER BY detection_time DESC
            ''', (session_id,))
        else:
            cursor.execute('''
                SELECT * FROM advanced_detections 
                WHERE detection_time > ?
                ORDER BY detection_time DESC
            ''', (datetime.utcnow() - timedelta(hours=hours),))
        
        return cursor.fetchall()
    
    def get_real_time_alerts(self, hours=24):
        """Get recent alerts"""
        cursor = self.db_conn.cursor()
        cursor.execute('''
            SELECT * FROM real_time_alerts 
            WHERE alert_time > ?
            ORDER BY alert_time DESC
        ''', (datetime.utcnow() - timedelta(hours=hours),))
        
        return cursor.fetchall()
    
    def get_detection_statistics(self):
        """Get detection statistics"""
        cursor = self.db_conn.cursor()
        
        # Total detections
        cursor.execute('SELECT COUNT(*) FROM advanced_detections')
        total_detections = cursor.fetchone()[0]
        
        # Detections by method
        cursor.execute('''
            SELECT detection_method, COUNT(*) 
            FROM advanced_detections 
            GROUP BY detection_method
        ''')
        by_method = dict(cursor.fetchall())
        
        # Detections by threat level
        cursor.execute('''
            SELECT threat_level, COUNT(*) 
            FROM advanced_detections 
            GROUP BY threat_level
        ''')
        by_threat = dict(cursor.fetchall())
        
        # Recent activity (last 24 hours)
        cursor.execute('''
            SELECT COUNT(*) FROM advanced_detections 
            WHERE detection_time > ?
        ''', (datetime.utcnow() - timedelta(hours=24),))
        recent_24h = cursor.fetchone()[0]
        
        return {
            'total_detections': total_detections,
            'detections_by_method': by_method,
            'detections_by_threat_level': by_threat,
            'recent_24h': recent_24h,
            'active_sessions': len(self.active_sessions)
        }

# Main execution
if __name__ == "__main__":
    import sys
    
    detection_system = AdvancedMinerDetectionSystem()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "start":
            location = sys.argv[2:4] if len(sys.argv) > 3 else None
            detection_types = sys.argv[4:] if len(sys.argv) > 4 else None
            
            async def run_detection():
                session_id = await detection_system.start_comprehensive_detection(
                    location_coords=location,
                    detection_types=detection_types
                )
                
                # Run for specified duration or indefinitely
                duration = 300  # 5 minutes default
                await asyncio.sleep(duration)
                
                detection_system.stop_detection(session_id)
                
                # Return results
                results = detection_system.get_detection_results(session_id)
                statistics = detection_system.get_detection_statistics()
                
                output = {
                    'session_id': session_id,
                    'status': 'completed',
                    'total_detections': len(results),
                    'statistics': statistics,
                    'detections': [
                        {
                            'device_id': r[3],
                            'method': r[4],
                            'confidence': r[5],
                            'threat_level': r[6],
                            'time': r[2]
                        } for r in results[:10]  # Limit output
                    ]
                }
                
                print(json.dumps(output, ensure_ascii=False, default=str))
            
            asyncio.run(run_detection())
        
        elif command == "status":
            stats = detection_system.get_detection_statistics()
            print(json.dumps(stats, ensure_ascii=False))
        
        elif command == "alerts":
            hours = int(sys.argv[2]) if len(sys.argv) > 2 else 24
            alerts = detection_system.get_real_time_alerts(hours)
            
            output = {
                'total_alerts': len(alerts),
                'alerts': [
                    {
                        'time': a[1],
                        'type': a[2],
                        'severity': a[3],
                        'message': a[4]
                    } for a in alerts
                ]
            }
            
            print(json.dumps(output, ensure_ascii=False, default=str))
    
    else:
        print("Usage: python advanced_detection.py [start|status|alerts] [params...]")
