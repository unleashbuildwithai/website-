@echo off
echo ========================================
echo Starting Ardy W Backend Server...
echo ========================================
echo.

cd backend

echo Checking if dependencies are installed...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js

pause
