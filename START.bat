@echo off
cd /d "%~dp0"
title Finovate
echo.
echo Stopping old Finovate servers on port 3000 (if any)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%p >nul 2>&1
)
echo.
echo Installing dependencies (first run may take a minute)...
call npm install
if errorlevel 1 (
  echo npm install failed. Install Node.js from https://nodejs.org
  pause
  exit /b 1
)
echo.
echo Starting Finovate...
echo.
echo  IMPORTANT: Use this address in your browser (not the HTML file directly):
echo  http://localhost:3000/auth.html
echo.
echo Press Ctrl+C to stop.
echo.
start "" "http://localhost:3000/auth.html"
call npm start
