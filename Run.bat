@echo off
start cmd /k "npm run dev"
cd client
start cmd /k "npm run dev"
cd ..
cd server/services
start cmd /k "python minerDetector.py"