@echo off
REM Start Vite dev server in background
start "Vite" cmd /c "npm run dev"
REM Wait for port 5173
:loop
netstat -an | find "127.0.0.1:5173" >nul
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto loop
)
REM Launch Electron directly (bypass npm wrapper)
set NODE_ENV=development
"%~dp0..\node_modules\electron\dist\electron.exe" "%~dp0main.cjs"