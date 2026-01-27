@echo off
echo ==========================================
echo       Anti Print - Development Server
echo ==========================================
echo.
echo Starting local server on port 8000...
echo Opening application in your default browser...
echo.

start http://localhost:8000

python -m http.server 8000

pause
