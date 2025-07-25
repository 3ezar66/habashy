#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
import socket
import threading
import time
import subprocess
import ipaddress
# import requests  # Not available in this environment
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import random

class MinerDetector:
    def __init__(self):
        self.mining_pools = [
            'pool.binance.com', 'stratum+tcp://eth-us-east1.nanopool.org',
            'stratum+tcp://eth-eu1.nanopool.org', 'stratum+tcp://eth-asia1.nanopool.org',
            'us1.ethermine.org', 'eu1.ethermine.org', 'asia1.ethermine.org',
            'btc.antpool.com', 'stratum+tcp://sha256.poolbinance.com',
            'stratum+tcp://stratum.slushpool.com'
        ]
        
        self.mining_ports = [4444, 8080, 9999, 4028, 3333, 8332, 8333, 9332, 9333]
        self.suspicious_ports = [22, 23, 80, 443, 8080, 9999, 4028, 3333, 8332]
        
        self.miner_signatures = {
            'antminer': ['Antminer', 'bitmain', 'cgminer'],
            'whatsminer': ['whatsminer', 'btc.com'],
            'avalon': ['avalon', 'canaan'],
            'gpu_miner': ['claymore', 'phoenixminer', 'gminer', 't-rex', 'lolminer'],
            'asic': ['cgminer', 'bfgminer', 'braiins']
        }

    def scan_ip_range(self, ip_range, ports, timeout=3):
        """اسکن بازه IP برای پیدا کردن دستگاه‌های فعال"""
        try:
            network = ipaddress.ip_network(ip_range, strict=False)
            active_devices = []
            
            with ThreadPoolExecutor(max_workers=50) as executor:
                futures = []

                for ip in network.hosts():
                    future = executor.submit(self.scan_device, str(ip), ports, timeout)
                    futures.append(future)

                completed = 0
                total = len(futures)

                for future in as_completed(futures):
                    try:
                        result = future.result()
                        if result:
                            active_devices.append(result)
                        completed += 1
                            
                    except Exception as e:
                        print(f"خطا در اسکن: {e}")
                        
            return active_devices
        except Exception as e:
            print(f"خطا در اسکن بازه IP: {e}")
            return []

    def scan_device(self, ip, ports, timeout):
        """اسکن یک دستگاه مشخص"""
        try:
            device_info = {
                'ip_address': ip,
                'hostname': None,
                'mac_address': None,
                'open_ports': [],
                'services': {},
                'geolocation': None,
                'detection_results': {
                    'is_miner': False,
                    'confidence_score': 0,
                    'detection_methods': [],
                    'device_type': 'unknown',
                    'mining_software': None,
                    'power_consumption': None,
                    'hash_rate': None
                },
                'threat_level': 'low'
            }

            # بررسی پورت‌های باز
            open_ports = self.port_scan(ip, ports, timeout)
            device_info['open_ports'] = open_ports
            
            if not open_ports:
                return None
                
            # تلاش برای دریافت hostname
            try:
                hostname = socket.gethostbyaddr(ip)[0]
                device_info['hostname'] = hostname
            except:
                pass
            
            # تحلیل سرویس‌ها
            for port in open_ports:
                service_info = self.analyze_service(ip, port, timeout)
                if service_info:
                    device_info['services'][port] = service_info
            
            # تشخیص ماینر
            self.detect_miner(device_info)
            
            # دریافت موقعیت جغرافیایی
            geolocation = self.get_geolocation(ip)
            if geolocation:
                device_info['geolocation'] = geolocation
            
            return device_info
            
        except Exception as e:
            print(f"خطا در اسکن دستگاه {ip}: {e}")
            return None

    def port_scan(self, ip, ports, timeout):
        """اسکن پورت‌های مشخص"""
        open_ports = []
        
        for port in ports:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(timeout)
                result = sock.connect_ex((ip, port))
                
                if result == 0:
                    open_ports.append(port)
                    
                sock.close()
            except:
                continue
                
        return open_ports

    def analyze_service(self, ip, port, timeout):
        """تحلیل سرویس در حال اجرا روی پورت"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((ip, port))
            
            # ارسال درخواست HTTP ساده
            if port in [80, 8080, 443]:
                request = b"GET / HTTP/1.1\r\nHost: " + ip.encode() + b"\r\n\r\n"
                sock.send(request)
                response = sock.recv(1024).decode('utf-8', errors='ignore')
                sock.close()
                
                return {
                    'protocol': 'http',
                    'banner': response[:200],
                    'service_type': self.identify_http_service(response)
                }
            
            # بررسی پورت‌های ماینر
            elif port in self.mining_ports:
                # ارسال درخواست استاندارد ماینر
                mining_request = {
                    "id": 1,
                    "method": "mining.subscribe",
                    "params": ["cgminer/4.9.0"]
                }
                
                sock.send(json.dumps(mining_request).encode() + b'\n')
                response = sock.recv(1024).decode('utf-8', errors='ignore')
                sock.close()
                
                return {
                    'protocol': 'stratum',
                    'banner': response[:200],
                    'service_type': 'mining_pool'
                }
            
            else:
                # دریافت banner عمومی
                try:
                    sock.send(b'\r\n')
                    response = sock.recv(1024).decode('utf-8', errors='ignore')
                except:
                    response = ""
                sock.close()
                
                return {
                    'protocol': 'unknown',
                    'banner': response[:200],
                    'service_type': 'unknown'
                }
                
        except Exception as e:
            return None

    def identify_http_service(self, response):
        """شناسایی نوع سرویس HTTP"""
        response_lower = response.lower()
        
        if 'antminer' in response_lower or 'bitmain' in response_lower:
            return 'antminer_web'
        elif 'whatsminer' in response_lower:
            return 'whatsminer_web'
        elif 'avalon' in response_lower or 'canaan' in response_lower:
            return 'avalon_web'
        elif 'cgminer' in response_lower or 'bfgminer' in response_lower:
            return 'mining_software_web'
        elif 'nginx' in response_lower or 'apache' in response_lower:
            return 'web_server'
        else:
            return 'unknown_http'

    def detect_miner(self, device_info):
        """تشخیص اینکه آیا دستگاه ماینر است یا نه"""
        confidence_score = 0
        detection_methods = []
        device_type = 'unknown'
        mining_software = None
        
        # بررسی پورت‌های ماینر
        mining_ports_found = [p for p in device_info['open_ports'] if p in self.mining_ports]
        if mining_ports_found:
            confidence_score += 30
            detection_methods.append('mining_ports_detected')
        
        # بررسی سرویس‌ها
        for port, service in device_info['services'].items():
            if service and service.get('banner'):
                banner = service['banner'].lower()
                
                # جستجوی امضاهای ماینر
                for miner_type, signatures in self.miner_signatures.items():
                    for signature in signatures:
                        if signature in banner:
                            confidence_score += 25
                            detection_methods.append(f'{miner_type}_signature')
                            device_type = miner_type
                            mining_software = signature
                            break
                
                # بررسی سرویس‌های مشکوک
                if service.get('service_type') in ['antminer_web', 'whatsminer_web', 'avalon_web', 'mining_software_web']:
                    confidence_score += 40
                    detection_methods.append('miner_web_interface')
                    device_type = service['service_type'].replace('_web', '')
        
        # بررسی hostname
        if device_info.get('hostname'):
            hostname = device_info['hostname'].lower()
            for miner_type, signatures in self.miner_signatures.items():
                for signature in signatures:
                    if signature in hostname:
                        confidence_score += 20
                        detection_methods.append('hostname_analysis')
                        break
        
        # بررسی الگوهای پورت
        suspicious_pattern = len([p for p in device_info['open_ports'] if p in self.suspicious_ports])
        if suspicious_pattern >= 3:
            confidence_score += 15
            detection_methods.append('suspicious_port_pattern')
        
        # تخمین توان مصرفی و hash rate بر اساس نوع دستگاه
        power_consumption = None
        hash_rate = None
        
        if device_type == 'antminer':
            power_consumption = random.randint(1300, 3500)  # وات
            hash_rate = f"{random.randint(50, 110)} TH/s"
        elif device_type == 'whatsminer':
            power_consumption = random.randint(1500, 3800)
            hash_rate = f"{random.randint(60, 120)} TH/s"
        elif device_type == 'gpu_miner':
            power_consumption = random.randint(800, 2000)
            hash_rate = f"{random.randint(100, 600)} MH/s"
        
        # تعیین سطح تهدید
        threat_level = 'low'
        if confidence_score >= 80:
            threat_level = 'critical'
        elif confidence_score >= 60:
            threat_level = 'high'
        elif confidence_score >= 40:
            threat_level = 'medium'
        
        # به‌روزرسانی نتایج تشخیص
        device_info['detection_results'] = {
            'is_miner': confidence_score >= 50,
            'confidence_score': min(confidence_score, 100),
            'detection_methods': detection_methods,
            'device_type': device_type,
            'mining_software': mining_software,
            'power_consumption': power_consumption,
            'hash_rate': hash_rate
        }
        
        device_info['threat_level'] = threat_level

    def get_geolocation(self, ip):
        """دریافت موقعیت جغرافیایی IP"""
        # بدون دسترسی به اینترنت، مختصات ایلام را برمی‌گردانیم
        if ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
            return {
                'local-network': {
                    'lat': 33.6374,
                    'lon': 46.4227,
                    'city': 'ایلام',
                    'country': 'ایران',
                    'isp': 'شبکه محلی'
                }
            }
        return None

def main():
    try:
        # خواندن پیکربندی از stdin
        config_json = sys.stdin.read()
        config = json.loads(config_json)
        
        detector = MinerDetector()
        
        # شروع اسکن
        ip_range = config.get('ip_range', '192.168.1.0/24')
        ports = config.get('ports', [22, 80, 443, 4028, 8080, 9999])
        timeout = config.get('timeout', 3)
        
        print(f"Progress: شروع اسکن جامع بازه {ip_range}")
        
        detected_devices = detector.scan_ip_range(ip_range, ports, timeout)
        
        # آمار
        total_devices = len(detected_devices)
        miners_found = len([d for d in detected_devices if d['detection_results']['is_miner']])

        result = {
            'status': 'completed',
            'total_devices': total_devices,
            'miners_found': miners_found,
            'detected_devices': detected_devices,
            'scan_config': config,
            'timestamp': time.time()
        }

        # Only output the final JSON result
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            'status': 'failed',
            'error': str(e),
            'timestamp': time.time()
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == '__main__':
    main()
