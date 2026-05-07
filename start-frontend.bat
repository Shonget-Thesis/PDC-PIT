@echo off
echo ========================================
echo   Call Me - Anonymous Voice Chat
echo   Starting Frontend Server
echo ========================================
echo.

cd call_me

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18 or higher
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting Next.js development server on http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

npm run dev
