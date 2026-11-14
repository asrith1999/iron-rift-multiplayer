@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required. Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)
echo IRON RIFT multiplayer starting at http://localhost:3000
node server.mjs
pause
