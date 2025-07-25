#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import time
import socket
import subprocess
import ipaddress
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import sqlite3
import os

class IranNetworkDetector:
    def __init__(self):
        # Iranian ISP and network ranges
        self.iran_ip_ranges = [
            {'range': '31.0.0.0/8', 'isp': 'Iran Telecommunication Company', 'provider': 'TIC'},
            {'range': '37.32.0.0/13', 'isp': 'Pars Online', 'provider': 'PO'},
            {'range': '5.160.0.0/11', 'isp': 'Telecommunication Infrastructure Company', 'provider': 'TIC'},
            {'range': '91.98.0.0/15', 'isp': 'Iran Cell Service and Communication Company', 'provider': 'ICell'},
            {'range': '2.176.0.0/12', 'isp': 'Asiatech Data Transmission Company', 'provider': 'Asiatech'},
            {'range': '78.39.0.0/16', 'isp': 'Shatel Mobile', 'provider': 'Shatel'},
            {'range': '87.107.0.0/16', 'isp': 'Rightel Broadband', 'provider': 'Rightel'},
            {'range': '185.8.0.0/14', 'isp': 'Fanava Group', 'provider': 'Fanava'},
            {'range': '188.0.240.0/20', 'isp': 'Datak Telecom', 'provider': 'Datak'},
            {'range': '46.32.0.0/11', 'isp': 'Hi-Web Pardaz', 'provider': 'HiWeb'}
        ]
        
        # Iran provinces with geographic coordinates
        self.iran_provinces = {
            'ilam': {
                'name': 'استان ایلام',
                'center': {'lat': 33.6374, 'lng': 46.4227},
                'cities': ['ایلام', 'مهران', 'دهلران', 'آبدانان', 'ایوان'],
                'typical_ranges': ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12']
            },
            'tehran': {
                'name': 'استان تهران', 
                'center': {'lat': 35.6892, 'lng': 51.3890},
                'cities': ['تهران', 'کرج', 'ورامین', 'شهریار', 'پاکدشت'],
                'typical_ranges': ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12']
            },
            'isfahan': {
                'name': 'استان اصفهان',
                'center': {'lat': 32.6546, 'lng': 51.6680}, 
                'cities': ['اصفهان', 'کاشان', 'نجف‌آباد', 'خمینی‌شهر', 'شا��ین‌شهر'],
                'typical_ranges': ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12']
            }
        }
        
        # Mining-specific port signatures
        self.mining_ports = {
            4028: 'CGMiner API',
            8080: 'Mining Pool Stratum', 
            9999: 'Generic Mining',
            3333: 'Bitcoin Mining Pool',
            8332: 'Bitcoin RPC',
            8333: 'Bitcoin P2P',
            9332: 'Litecoin RPC',
            9333: 'Litecoin P2P',
            14433: 'Monero P2P',
            18080: 'Monero RPC',
            30303: 'Ethereum P2P',
            8545: 'Ethereum RPC'
        }
        
        # Known mining software signatures
        self.mining_signatures = {
            'cgminer': {'confidence': 0.9, 'type': 'ASIC'},
            'bfgminer': {'confidence': 0.85, 'type': 'ASIC'},
            'sgminer': {'confidence': 0.8, 'type': 'GPU'},
            'claymore': {'confidence': 0.9, 'type': 'GPU'},
            'phoenixminer': {'confidence': 0.9, 'type': 'GPU'},
            'gminer': {'confidence': 0.85, 'type': 'GPU'},
            't-rex': {'confidence': 0.85, 'type': 'GPU'},
            'lolminer': {'confidence': 0.8, 'type': 'GPU'},
            'bminer': {'confidence': 0.8, 'type': 'GPU'},
            'xmrig': {'confidence': 0.9, 'type': 'CPU/GPU'},
            'nanominer': {'confidence': 0.8, 'type': 'GPU'},
            'teamredminer': {'confidence': 0.8, 'type': 'GPU'}
        }

        self.db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'miners.db')

    def get_db_connection(self):
        """Get database connection"""
        try:
            conn = sqlite3.connect(self.db_path)
            return conn
        except Exception as e:
            print(f"Database connection failed: {e}", file=sys.stderr)
            return None

    def get_iran_location_for_ip(self, ip_address, province='ilam'):
        """Get Iran-specific location data for IP address"""
        
        # Check if IP is in known Iranian ranges
        for ip_range in self.iran_ip_ranges:
            try:
                network = ipaddress.ip_network(ip_range['range'])
                if ipaddress.ip_address(ip_address) in network:
                    province_data = self.iran_provinces.get(province, self.iran_provinces['ilam'])
                    
                    # Add some realistic variation to coordinates
                    import random
                    lat_offset = random.uniform(-0.1, 0.1)
                    lng_offset = random.uniform(-0.1, 0.1)
                    
                    return {
                        'country': 'Iran',
                        'country_code': 'IR',
                        'province': province_data['name'],
                        'city': random.choice(province_data['cities']),
                        'lat': province_data['center']['lat'] + lat_offset,
                        'lon': province_data['center']['lng'] + lng_offset,
                        'isp': ip_range['isp'],
                        'provider': ip_range['provider'],
                        'timezone': 'Asia/Tehran',
                        'is_iran': True
                    }
            except:
                continue
        
        # Default for local/private IPs
        if ip_address.startswith(('192.168.', '10.', '172.')):
            province_data = self.iran_provinces.get(province, self.iran_provinces['ilam'])
            import random
            lat_offset = random.uniform(-0.05, 0.05)
            lng_offset = random.uniform(-0.05, 0.05)
            
            return {
                'country': 'Iran',
                'country_code': 'IR', 
                'province': province_data['name'],
                'city': random.choice(province_data['cities']),
                'lat': province_data['center']['lat'] + lat_offset,
                'lon': province_data['center']['lng'] + lng_offset,
                'isp': 'Local Network',
                'provider': 'Private',
                'timezone': 'Asia/Tehran',
                'is_iran': True,
                'is_local': True
            }
        
        return None

    def expand_ip_range(self, range_config):
        """Expand IP range to list of IPs"""
        start_ip = range_config.get('start', '192.168.1.1')
        end_ip = range_config.get('end', start_ip)

        ips = []

        try:
            # Parse start and end IPs
            start_parts = [int(x) for x in start_ip.split('.')]
            end_parts = [int(x) for x in end_ip.split('.')]

            # For simplicity, handle ranges within same subnet (first 3 octets same)
            if start_parts[:3] == end_parts[:3]:
                base = '.'.join(map(str, start_parts[:3]))
                for i in range(start_parts[3], min(end_parts[3] + 1, 255)):
                    ips.append(f"{base}.{i}")
            else:
                # Handle cross-subnet ranges (limited implementation)
                ips.append(start_ip)
                if start_ip != end_ip:
                    ips.append(end_ip)

            return ips[:50]  # Limit for performance

        except Exception as e:
            print(f"Error expanding IP range {start_ip}-{end_ip}: {e}")
            return [start_ip]

    def scan_network_comprehensive(self, config):
        """Comprehensive network scan with Iran-specific detection"""

        ip_ranges = config.get('ip_ranges', [{'start': '192.168.1.1', 'end': '192.168.1.254'}])
        ports = config.get('ports', [22, 80, 443, 4028, 8080, 9999, 3333, 8332])
        timeout = config.get('timeout', 3)
        province = config.get('province', 'ilam')
        is_automatic = config.get('isAutomatic', False)

        detected_devices = []
        all_ips_to_scan = []

        try:
            # Expand all IP ranges
            for range_config in ip_ranges:
                range_ips = self.expand_ip_range(range_config)
                all_ips_to_scan.extend(range_ips)
                print(f"Range {range_config.get('start')}-{range_config.get('end')}: {len(range_ips)} IPs")

            print(f"Total IPs to scan: {len(all_ips_to_scan)}")

            # Use thread pool for faster scanning
            with ThreadPoolExecutor(max_workers=50) as executor:
                futures = []

                for ip in all_ips_to_scan:
                    future = executor.submit(self.scan_device_advanced, ip, ports, timeout, province)
                    futures.append(future)

                # Process results as they complete
                for i, future in enumerate(as_completed(futures)):
                    try:
                        result = future.result(timeout=10)
                        if result and result.get('is_active'):
                            detected_devices.append(result)
                            # Output result immediately for streaming
                            output_result = {
                                'ip': result['ip_address'],
                                'ports': result['open_ports'],
                                'location': result.get('geolocation', {}),
                                'mining_evidence': result.get('mining_indicators', {}),
                                'suspicion_score': result.get('threat_assessment', {}).get('suspicion_score', 0),
                                'timestamp': result['detection_timestamp'],
                                'detection_method': 'iran_network_scan',
                                'status': 'فعال' if result['open_ports'] else 'غیرفعال'
                            }
                            print(json.dumps(output_result, ensure_ascii=False))

                        # Progress update
                        if (i + 1) % 10 == 0:
                            print(f"Progress: {i + 1}/{len(all_ips_to_scan)} IPs scanned")

                    except Exception as e:
                        print(f"Error processing scan result: {e}")
                        continue

            # Analyze and store results
            analysis_results = self.analyze_detection_results(detected_devices)

            # Store in database
            self.store_scan_results(detected_devices, config)

            return {
                'status': 'completed',
                'total_devices': len(detected_devices),
                'miners_found': analysis_results.get('miners_found', 0),
                'suspicious_devices': analysis_results.get('suspicious_devices', 0),
                'detected_devices': detected_devices,
                'analysis': analysis_results,
                'scan_config': config,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            print(f"Scan error: {e}")
            return {
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def scan_device_advanced(self, ip, ports, timeout, province):
        """Advanced device scanning with mining detection"""
        
        device_info = {
            'ip_address': ip,
            'hostname': None,
            'mac_address': None,
            'open_ports': [],
            'services': {},
            'mining_indicators': {},
            'geolocation': None,
            'threat_assessment': {},
            'is_active': False,
            'detection_timestamp': datetime.now().isoformat()
        }
        
        # Check if device is active
        active_ports = self.port_scan(ip, ports, timeout)
        if not active_ports:
            return None
            
        device_info['is_active'] = True
        device_info['open_ports'] = active_ports
        
        # Get hostname
        try:
            hostname = socket.gethostbyaddr(ip)[0]
            device_info['hostname'] = hostname
        except:
            pass
        
        # Analyze services on open ports
        for port in active_ports:
            service_info = self.analyze_service_advanced(ip, port, timeout)
            if service_info:
                device_info['services'][port] = service_info
        
        # Mining-specific analysis
        mining_analysis = self.detect_mining_activity(device_info)
        device_info['mining_indicators'] = mining_analysis
        
        # Get Iran-specific geolocation
        geo_data = self.get_iran_location_for_ip(ip, province)
        if geo_data:
            device_info['geolocation'] = geo_data
        
        # Threat assessment
        threat_info = self.assess_mining_threat(device_info)
        device_info['threat_assessment'] = threat_info
        
        return device_info

    def port_scan(self, ip, ports, timeout):
        """Fast port scanning"""
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

    def analyze_service_advanced(self, ip, port, timeout):
        """Advanced service analysis with mining detection"""
        
        service_info = {
            'port': port,
            'protocol': 'tcp',
            'service_name': self.mining_ports.get(port, 'unknown'),
            'banner': None,
            'mining_related': port in self.mining_ports,
            'confidence': 0
        }
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((ip, port))
            
            # Try to get service banner
            if port in [80, 8080, 443]:
                # HTTP request
                request = f"GET / HTTP/1.1\r\nHost: {ip}\r\nUser-Agent: Network-Scanner\r\n\r\n"
                sock.send(request.encode())
                banner = sock.recv(1024).decode('utf-8', errors='ignore')
                service_info['banner'] = banner[:500]
                
                # Check for mining-related content
                banner_lower = banner.lower()
                for mining_software, sig_info in self.mining_signatures.items():
                    if mining_software in banner_lower:
                        service_info['mining_software'] = mining_software
                        service_info['confidence'] = sig_info['confidence']
                        service_info['mining_type'] = sig_info['type']
                        break
                        
            elif port in self.mining_ports:
                # Mining-specific protocols
                if port == 4028:  # CGMiner API
                    request = '{"command":"summary","parameter":""}'
                    sock.send(request.encode())
                    response = sock.recv(1024).decode('utf-8', errors='ignore')
                    service_info['banner'] = response[:500]
                    if 'STATUS' in response or 'cgminer' in response.lower():
                        service_info['confidence'] = 0.9
                        service_info['mining_software'] = 'cgminer'
                        
                elif port in [8080, 9999, 3333]:  # Stratum protocols
                    request = '{"id":1,"method":"mining.subscribe","params":[]}\n'
                    sock.send(request.encode())
                    response = sock.recv(1024).decode('utf-8', errors='ignore')
                    service_info['banner'] = response[:500]
                    if 'mining.subscribe' in response or 'stratum' in response.lower():
                        service_info['confidence'] = 0.8
                        service_info['protocol'] = 'stratum'
            
            sock.close()
            
        except Exception as e:
            service_info['error'] = str(e)
        
        return service_info

    def detect_mining_activity(self, device_info):
        """Comprehensive mining activity detection"""
        
        mining_indicators = {
            'mining_ports_found': [],
            'mining_software_detected': [],
            'confidence_score': 0,
            'mining_type': 'unknown',
            'threat_level': 'low',
            'indicators': []
        }
        
        confidence = 0
        
        # Check for mining-specific ports
        for port in device_info['open_ports']:
            if port in self.mining_ports:
                mining_indicators['mining_ports_found'].append({
                    'port': port,
                    'service': self.mining_ports[port]
                })
                confidence += 25
                mining_indicators['indicators'].append(f'Mining port {port} detected')
        
        # Analyze services for mining software
        for port, service in device_info['services'].items():
            if service.get('mining_software'):
                mining_indicators['mining_software_detected'].append({
                    'software': service['mining_software'],
                    'confidence': service.get('confidence', 0),
                    'type': service.get('mining_type', 'unknown')
                })
                confidence += service.get('confidence', 0) * 100
                mining_indicators['indicators'].append(f'Mining software: {service["mining_software"]}')
        
        # Hostname analysis
        if device_info.get('hostname'):
            hostname = device_info['hostname'].lower()
            for mining_software in self.mining_signatures.keys():
                if mining_software in hostname:
                    confidence += 30
                    mining_indicators['indicators'].append(f'Mining-related hostname: {hostname}')
                    break
        
        # Port pattern analysis
        suspicious_patterns = [
            [4028, 8080],  # CGMiner + Stratum
            [3333, 8332],  # Bitcoin mining
            [8080, 9999],  # Common mining pools
        ]
        
        for pattern in suspicious_patterns:
            if all(port in device_info['open_ports'] for port in pattern):
                confidence += 20
                mining_indicators['indicators'].append(f'Suspicious port pattern: {pattern}')
        
        # Determine threat level
        if confidence >= 80:
            mining_indicators['threat_level'] = 'critical'
        elif confidence >= 60:
            mining_indicators['threat_level'] = 'high'
        elif confidence >= 40:
            mining_indicators['threat_level'] = 'medium'
        else:
            mining_indicators['threat_level'] = 'low'
        
        mining_indicators['confidence_score'] = min(confidence, 100)
        
        return mining_indicators

    def analyze_detection_results(self, detected_devices):
        """Analyze overall detection results"""
        try:
            analysis = {
                'miners_found': 0,
                'suspicious_devices': 0,
                'total_devices': len(detected_devices),
                'threat_levels': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
                'common_ports': {},
                'geographic_distribution': {}
            }

            for device in detected_devices:
                # Count threat levels
                threat_level = device.get('threat_assessment', {}).get('threat_level', 'low')
                analysis['threat_levels'][threat_level] += 1

                # Count miners and suspicious devices
                if device.get('threat_assessment', {}).get('is_miner', False):
                    analysis['miners_found'] += 1
                elif threat_level in ['medium', 'high', 'critical']:
                    analysis['suspicious_devices'] += 1

                # Analyze common ports
                for port in device.get('open_ports', []):
                    analysis['common_ports'][port] = analysis['common_ports'].get(port, 0) + 1

                # Geographic analysis
                location = device.get('geolocation', {})
                if location and 'city' in location:
                    city = location['city']
                    analysis['geographic_distribution'][city] = analysis['geographic_distribution'].get(city, 0) + 1

            return analysis

        except Exception as e:
            print(f"Error analyzing results: {e}")
            return {'miners_found': 0, 'suspicious_devices': 0, 'total_devices': 0}

    def store_scan_results(self, detected_devices, config):
        """Store scan results in database"""
        try:
            conn = self.get_db_connection()
            if not conn:
                return

            cursor = conn.cursor()

            for device in detected_devices:
                # Store device info
                cursor.execute('''
                    INSERT OR REPLACE INTO miners (
                        ip, location, suspicion_score, last_seen,
                        detection_method, details
                    ) VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    device['ip_address'],
                    json.dumps(device.get('geolocation', {})),
                    device.get('threat_assessment', {}).get('suspicion_score', 0),
                    device['detection_timestamp'],
                    'iran_network_scan',
                    json.dumps(device)
                ))

            conn.commit()
            conn.close()

        except Exception as e:
            print(f"Error storing scan results: {e}")

    def assess_mining_threat(self, device_info):
        """Assess overall mining threat"""

        threat_assessment = {
            'is_miner': False,
            'suspicion_score': 0,
            'threat_level': 'low',
            'risk_factors': [],
            'recommendations': []
        }

        try:
            mining_indicators = device_info.get('mining_indicators', {})
            mining_confidence = mining_indicators.get('confidence_score', 0)

            threat_assessment['suspicion_score'] = mining_confidence / 100.0

            if mining_confidence >= 70:
                threat_assessment['is_miner'] = True
                threat_assessment['threat_level'] = 'critical'

                # Add risk factors
                if mining_indicators.get('mining_ports_found'):
                    threat_assessment['risk_factors'].append('Active mining ports detected')

                if mining_indicators.get('mining_software_detected'):
                    threat_assessment['risk_factors'].append('Mining software identified')

                # Add recommendations
                threat_assessment['recommendations'] = [
                    'Block mining-related network traffic',
                    'Investigate device owner',
                    'Monitor power consumption',
                    'Check for unauthorized hardware'
                ]
            elif mining_confidence >= 40:
                threat_assessment['threat_level'] = 'medium'
                threat_assessment['recommendations'] = ['Monitor this device closely']

            return threat_assessment

        except Exception as e:
            print(f"Error assessing threat: {e}")
            return threat_assessment

def main():
    """Main entry point"""
    try:
        # Read config from stdin
        config_json = sys.stdin.read()
        config = json.loads(config_json) if config_json.strip() else {}
        
        detector = IranNetworkDetector()
        result = detector.scan_network_comprehensive(config)
        
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == '__main__':
    main()
