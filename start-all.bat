@echo off
echo ========================================
echo   Call Me - Anonymous Voice Chat
echo   Starting Both Servers
echo ========================================
echo.
echo This will start both the backend and frontend servers
echo in separate windows.
echo.

REM Start backend in new window
start "Call Me Backend" cmd /k "cd /d "%~dp0" && start-backend.bat"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Call Me Frontend" cmd /k "cd /d "%~dp0" && start-frontend.bat"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Open http://localhost:3000 in your browser to use the app
echo.
