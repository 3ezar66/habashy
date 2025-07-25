#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
import socket
import threading
import time
import subprocess
import ipaddress
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
import os

class NetworkScanner:
    def __init__(self):
        self.active_scans = {}
        self.scan_results = {}
        
    def start_network_scan(self, config):
        """شروع اسکن شبکه جدید"""
        scan_id = str(uuid.uuid4())
        
        self.active_scans[scan_id] = {
            'status': 'running',
            'config': config,
            'start_time': time.time(),
            'progress': 0
        }
        
        # شروع اسکن در thread جداگانه
        thread = threading.Thread(target=self._run_network_scan, args=(scan_id, config))
        thread.daemon = True
        thread.start()
        
        return scan_id
    
    def _run_network_scan(self, scan_id, config):
        """اجرای اسکن شبکه"""
        try:
            network = config.get('network', '192.168.1.0/24')
            
            print(f"شروع اسکن شبکه {network}")
            
            # اسکن ping
            active_hosts = self._ping_scan(network, scan_id)
            
            # اسکن پورت برای هاست‌های فعال
            detailed_results = []
            total_hosts = len(active_hosts)
            
            for i, host in enumerate(active_hosts):
                host_info = self._scan_host_details(host)
                detailed_results.append(host_info)
                
                # به‌روزرسانی پیشرفت
                progress = int(((i + 1) / total_hosts) * 100)
                self.active_scans[scan_id]['progress'] = progress
            
            # ذخیره نتایج نهایی
            self.scan_results[scan_id] = {
                'status': 'completed',
                'results': detailed_results,
                'total_hosts': len(active_hosts),
                'scan_time': time.time() - self.active_scans[scan_id]['start_time']
            }
            
            self.active_scans[scan_id]['status'] = 'completed'
            
        except Exception as e:
            self.scan_results[scan_id] = {
                'status': 'failed',
                'error': str(e),
                'scan_time': time.time() - self.active_scans[scan_id]['start_time']
            }
            self.active_scans[scan_id]['status'] = 'failed'
    
    def _ping_scan(self, network, scan_id):
        """اسکن ping برای پیدا کردن هاست‌های فعال"""
        try:
            network_obj = ipaddress.ip_network(network, strict=False)
            active_hosts = []
            
            with ThreadPoolExecutor(max_workers=100) as executor:
                futures = []
                
                for ip in network_obj.hosts():
                    future = executor.submit(self._ping_host, str(ip))
                    futures.append((future, str(ip)))
                
                for future, ip in futures:
                    try:
                        if future.result():
                            active_hosts.append(ip)
                    except:
                        continue
            
            return active_hosts
            
        except Exception as e:
            print(f"خطا در ping scan: {e}")
            return []
    
    def _ping_host(self, ip):
        """ping یک هاست مشخص"""
        try:
            # استفاده از ping برای تشخیص هاست فعال
            if os.name == 'nt':  # Windows
                result = subprocess.run(['ping', '-n', '1', '-w', '1000', ip], 
                                      capture_output=True, text=True)
            else:  # Linux/Unix
                result = subprocess.run(['ping', '-c', '1', '-W', '1', ip], 
                                      capture_output=True, text=True)
            
            return result.returncode == 0
            
        except:
            return False
    
    def _scan_host_details(self, ip):
        """اسکن جزئیات یک هاست"""
        host_info = {
            'ip': ip,
            'hostname': None,
            'mac_address': None,
            'open_ports': [],
            'os_detection': None,
            'services': {},
            'response_time': None
        }
        
        # دریافت hostname
        try:
            hostname = socket.gethostbyaddr(ip)[0]
            host_info['hostname'] = hostname
        except:
            pass
        
        # اسکن پورت‌های رایج
        common_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 993, 995, 1723, 3389, 5900, 8080, 9999, 4028]
        
        start_time = time.time()
        open_ports = []
        
        for port in common_ports:
            if self._check_port(ip, port):
                open_ports.append(port)
                # تشخیص سرویس
                service = self._identify_service(ip, port)
                if service:
                    host_info['services'][port] = service
        
        host_info['open_ports'] = open_ports
        host_info['response_time'] = int((time.time() - start_time) * 1000)
        
        # تشخیص ساده OS
        host_info['os_detection'] = self._simple_os_detection(ip, open_ports)
        
        return host_info
    
    def _check_port(self, ip, port, timeout=1):
        """بررسی باز بودن پورت"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((ip, port))
            sock.close()
            return result == 0
        except:
            return False
    
    def _identify_service(self, ip, port):
        """شناسایی سرویس در حال اجرا روی پورت"""
        service_map = {
            21: 'FTP',
            22: 'SSH',
            23: 'Telnet',
            25: 'SMTP',
            53: 'DNS',
            80: 'HTTP',
            110: 'POP3',
            135: 'RPC',
            139: 'NetBIOS',
            143: 'IMAP',
            443: 'HTTPS',
            993: 'IMAPS',
            995: 'POP3S',
            1723: 'PPTP',
            3389: 'RDP',
            5900: 'VNC',
            8080: 'HTTP-Alt',
            9999: 'Unknown/Miner',
            4028: 'Miner-API'
        }
        
        service_name = service_map.get(port, f'Unknown-{port}')
        
        # تلاش برای دریافت banner
        banner = self._get_service_banner(ip, port)
        
        return {
            'name': service_name,
            'banner': banner,
            'version': self._extract_version(banner) if banner else None
        }
    
    def _get_service_banner(self, ip, port, timeout=2):
        """دریافت banner سرویس"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((ip, port))
            
            # ارسال درخواست ساده
            if port == 80 or port == 8080:
                sock.send(b"GET / HTTP/1.1\r\nHost: " + ip.encode() + b"\r\n\r\n")
            elif port == 443:
                sock.send(b"GET / HTTP/1.1\r\nHost: " + ip.encode() + b"\r\n\r\n")
            else:
                sock.send(b"\r\n")
            
            banner = sock.recv(1024).decode('utf-8', errors='ignore')
            sock.close()
            
            return banner[:200] if banner else None
            
        except:
            return None
    
    def _extract_version(self, banner):
        """استخراج نسخه از banner"""
        if not banner:
            return None
            
        banner_lower = banner.lower()
        
        # جستجوی الگوهای رایج نسخه
        import re
        version_patterns = [
            r'server:\s*([^\r\n]+)',
            r'version\s*[\s:=]\s*([^\s\r\n]+)',
            r'(\d+\.\d+(?:\.\d+)?)',
        ]
        
        for pattern in version_patterns:
            match = re.search(pattern, banner_lower)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _simple_os_detection(self, ip, open_ports):
        """تشخیص ساده سیستم عامل"""
        if 3389 in open_ports:  # RDP
            return 'Windows'
        elif 22 in open_ports and 80 in open_ports:  # SSH + HTTP
            return 'Linux'
        elif 139 in open_ports or 135 in open_ports:  # NetBIOS/RPC
            return 'Windows'
        elif 22 in open_ports:  # SSH only
            return 'Unix/Linux'
        else:
            return 'Unknown'
    
    def get_scan_results(self, scan_id):
        """دریافت نتایج اسکن"""
        if scan_id in self.scan_results:
            return self.scan_results[scan_id]
        elif scan_id in self.active_scans:
            return {
                'status': self.active_scans[scan_id]['status'],
                'progress': self.active_scans[scan_id]['progress']
            }
        else:
            return {'status': 'not_found'}

# نمونه global scanner
_scanner = NetworkScanner()

def start_network_scan(config):
    return _scanner.start_network_scan(config)

def get_scan_results(scan_id):
    return _scanner.get_scan_results(scan_id)

# اگر مستقیماً اجرا شود
if __name__ == '__main__':
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'scan':
            network = sys.argv[2] if len(sys.argv) > 2 else '192.168.1.0/24'
            config = {'network': network}
            scan_id = start_network_scan(config)
            
            # انتظار تا تکمیل اسکن
            while True:
                result = get_scan_results(scan_id)
                if result['status'] in ['completed', 'failed']:
                    print(json.dumps(result, ensure_ascii=False, indent=2))
                    break
                time.sleep(1)
                
        elif command == 'status':
            print(json.dumps({'status': 'ready'}, ensure_ascii=False))
    else:
        print("استفاده: python3 networkScanner.py [scan|status] [network]")
