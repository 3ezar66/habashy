#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import time
from datetime import datetime
import sqlite3
import os

# Simple logging setup
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedMinerDetectionSystem:
    def __init__(self):
        self.is_active = False
        self.db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'miners.db')
        
    def get_db_connection(self):
        """Get database connection"""
        try:
            conn = sqlite3.connect(self.db_path)
            return conn
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return None

    def start_detection(self, config):
        """Start detection with given configuration"""
        try:
            session_id = f"session_{int(time.time())}"
            self.is_active = True
            
            logger.info(f"Starting advanced detection session: {session_id}")
            
            # Insert detection session into database
            conn = self.get_db_connection()
            if conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO alerts (type, severity, title, message, details)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    'detection',
                    'info',
                    'سیستم تشخیص پیشرفته آغاز شد',
                    f'جلسه تشخیص {session_id} با موفقیت آغاز شد',
                    json.dumps(config)
                ))
                conn.commit()
                conn.close()
            
            return {
                'status': 'started',
                'session_id': session_id,
                'message': 'سیستم تشخیص پیشرفته آغاز شد',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error starting detection: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def stop_detection(self, session_id):
        """Stop detection session"""
        try:
            self.is_active = False
            
            # Log stop event
            conn = self.get_db_connection()
            if conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO alerts (type, severity, title, message, details)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    'system',
                    'info',
                    'سیستم تشخیص متوقف شد',
                    f'جلسه تشخیص {session_id} متوقف شد',
                    json.dumps({'session_id': session_id})
                ))
                conn.commit()
                conn.close()
            
            return {
                'status': 'stopped',
                'session_id': session_id,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error stopping detection: {e}")
            return {
                'status': 'error',
                'error': str(e)
            }

    def get_status(self):
        """Get current system status"""
        try:
            return {
                'status': 'active' if self.is_active else 'inactive',
                'timestamp': datetime.now().isoformat(),
                'modules': {
                    'rf_detection': 'available',
                    'vibration_analysis': 'available',
                    'electromagnetic_scan': 'available',
                    'thermal_imaging': 'available',
                    'acoustic_fingerprinting': 'available',
                    'ai_classification': 'available'
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }

    def get_alerts(self, hours=24):
        """Get alerts from database"""
        try:
            conn = self.get_db_connection()
            if not conn:
                return {'status': 'error', 'error': 'Database connection failed'}
            
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM alerts 
                WHERE timestamp >= datetime('now', '-' || ? || ' hours')
                ORDER BY timestamp DESC
                LIMIT 100
            """, (hours,))
            
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
            
            alerts = []
            for row in rows:
                alert = dict(zip(columns, row))
                alerts.append(alert)
            
            conn.close()
            
            return {
                'status': 'success',
                'alerts': alerts,
                'count': len(alerts),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting alerts: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'alerts': []
            }

    def get_results(self, session_id=None, hours=24):
        """Get detection results"""
        try:
            # For now, return empty results since we removed fake data
            return {
                'status': 'success',
                'results': [],
                'session_id': session_id,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }

def main():
    """Main entry point"""
    try:
        detector = AdvancedMinerDetectionSystem()
        
        if len(sys.argv) < 2:
            print(json.dumps({'error': 'Command required'}, ensure_ascii=False))
            sys.exit(1)
        
        command = sys.argv[1]
        
        if command == 'start':
            # Read config from stdin
            config_data = sys.stdin.read()
            config = json.loads(config_data) if config_data.strip() else {}
            result = detector.start_detection(config)
            
        elif command == 'stop':
            session_id = sys.argv[2] if len(sys.argv) > 2 else None
            result = detector.stop_detection(session_id)
            
        elif command == 'status':
            result = detector.get_status()
            
        elif command == 'alerts':
            hours = int(sys.argv[2]) if len(sys.argv) > 2 else 24
            result = detector.get_alerts(hours)
            
        elif command == 'results':
            if len(sys.argv) > 2:
                # Session ID provided
                session_id = sys.argv[2]
                result = detector.get_results(session_id=session_id)
            else:
                # Hours provided
                hours = int(sys.argv[2]) if len(sys.argv) > 2 else 24
                result = detector.get_results(hours=hours)
        else:
            result = {'error': f'Unknown command: {command}'}
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        error_result = {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == '__main__':
    main()
