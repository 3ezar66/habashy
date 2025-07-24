#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
# import requests  # Not available
import time

def geolocate_device(ip_address):
    """دریافت موقعیت جغرافیایی برای آدرس IP"""
    
    # چک کردن IP های محلی
    if ip_address.startswith('192.168.') or ip_address.startswith('10.') or ip_address.startswith('172.'):
        return {
            'status': 'local_ip',
            'ip': ip_address,
            'location': {
                'city': 'ایلام',
                'country': 'ایران',
                'country_code': 'IR',
                'region': 'استان ایلام',
                'lat': 33.6374,
                'lon': 46.4227,
                'timezone': 'Asia/Tehran',
                'isp': 'شبکه محلی',
                'org': 'شبکه داخلی'
            },
            'estimated': True
        }
    
    result = {
        'status': 'success',
        'ip': ip_address,
        'location': {},
        'providers': {}
    }
    
    # بدون دسترسی به اینترنت، اطلاعات پیش‌فرض ایلام
    result['providers']['local'] = {
        'city': 'ایلام',
        'country': 'ایران',
        'country_code': 'IR',
        'region': 'استان ایلام',
        'lat': 33.6374,
        'lon': 46.4227,
        'timezone': 'Asia/Tehran',
        'isp': 'شبکه محلی'
    }
    
    # ترکیب نتایج از مناطق مختلف
    if result['providers']:
        # انتخاب بهترین نتیجه (معمولاً ip-api)
        best_provider = None
        if 'ip-api' in result['providers'] and 'error' not in result['providers']['ip-api']:
            best_provider = result['providers']['ip-api']
        elif 'ipapi' in result['providers'] and 'error' not in result['providers']['ipapi']:
            best_provider = result['providers']['ipapi']
        elif 'ipinfo' in result['providers'] and 'error' not in result['providers']['ipinfo']:
            best_provider = result['providers']['ipinfo']
        
        if best_provider:
            result['location'] = best_provider
        else:
            result['status'] = 'failed'
            result['location'] = {
                'city': 'نامشخص',
                'country': 'نامشخص',
                'lat': None,
                'lon': None
            }
    else:
        result['status'] = 'failed'
        result['location'] = {
            'city': 'نامشخص', 
            'country': 'نامشخص',
            'lat': None,
            'lon': None
        }
    
    # اگر در ایران است، شهر را به ایلام تغییر بده (برای تست)
    if result['location'].get('country_code') == 'IR':
        result['location']['estimated_region'] = 'استان ایلام'
        # اگر مختصات ندارد، مختصات ایلام را بده
        if not result['location'].get('lat') or not result['location'].get('lon'):
            result['location']['lat'] = 33.6374
            result['location']['lon'] = 46.4227
    
    return result

def main():
    """اجرای مستقل"""
    if len(sys.argv) > 1:
        ip = sys.argv[1]
        result = geolocate_device(ip)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("استفاده: python3 geolocator.py <IP_ADDRESS>")

if __name__ == '__main__':
    main()
