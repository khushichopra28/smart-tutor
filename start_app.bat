@echo off
SETLOCAL EnableDelayedExpansion

echo Checking for node_modules...
IF NOT EXIST "node_modules\" (
    echo node_modules not found. Installing dependencies...
    call npm install
) ELSE (
    echo node_modules found. Skipping install.
)

echo Starting Smart Tutor...

:: Start the API server in a new window
echo Launching API Server (Node.js)...
start "Smart Tutor API" cmd /c "npm run serve:api"

:: Start the Frontend (Vite)
echo Launching Frontend (Vite)...
call npm run dev

pause
