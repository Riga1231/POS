@echo off
SETLOCAL EnableDelayedExpansion

REM === Configuration ===
SET FRONTEND_PORT=3000
SET BACKEND_PORT=5000

REM === Check if required folders exist ===
echo Checking application structure...
if not exist "backend\" (
    echo ERROR: "backend" folder not found!
    echo Please ensure this batch file is in the main project folder.
    pause
    exit /b 1
)

if not exist "frontend\" (
    echo ERROR: "frontend" folder not found!
    echo Please ensure this batch file is in the main project folder.
    pause
    exit /b 1
)

REM === Start backend services ===
echo Starting application services...
start "Backend" /B /MIN cmd /c "cd backend && node server.js > backend.log 2>&1"
start "Frontend" /B /MIN cmd /c "cd frontend && npx serve -s dist -l %FRONTEND_PORT% > frontend.log 2>&1"

REM === Wait for services to initialize ===
echo Waiting for services to start...
timeout /t 5 /nobreak > nul

REM === Ultimate Browser Detection ===
echo Detecting browser for optimal experience...

set BROWSER_FOUND=0

REM 1. Try Chrome (Multiple Locations)
echo Checking for Chrome...
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    set BROWSER_FOUND=1
    set BROWSER_NAME=Google Chrome
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    set BROWSER_FOUND=1
    set BROWSER_NAME=Google Chrome
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe"
    set BROWSER_FOUND=1
    set BROWSER_NAME=Google Chrome
)

REM 2. Try Edge if Chrome not found
if !BROWSER_FOUND!==0 (
    echo Checking for Microsoft Edge...
    if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
        set "BROWSER_PATH=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
        set BROWSER_FOUND=1
        set BROWSER_NAME=Microsoft Edge
    ) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
        set "BROWSER_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
        set BROWSER_FOUND=1
        set BROWSER_NAME=Microsoft Edge
    )
)

REM 3. Try Firefox if still not found
if !BROWSER_FOUND!==0 (
    echo Checking for Firefox...
    if exist "%ProgramFiles%\Mozilla Firefox\firefox.exe" (
        set "BROWSER_PATH=%ProgramFiles%\Mozilla Firefox\firefox.exe"
        set BROWSER_FOUND=1
        set BROWSER_NAME=Firefox
    ) else if exist "%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe" (
        set "BROWSER_PATH=%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe"
        set BROWSER_FOUND=1
        set BROWSER_NAME=Firefox
    )
)

REM 4. Registry fallback for any browser
if !BROWSER_FOUND!==0 (
    echo Checking registry for browsers...
    for /f "tokens=2*" %%i in ('reg query "HKEY_CLASSES_ROOT\http\shell\open\command" /ve 2^>nul') do (
        set "DEFAULT_BROWSER=%%j"
        set BROWSER_FOUND=1
        set BROWSER_NAME=Default System Browser
    )
)

REM === Launch Application ===
if !BROWSER_FOUND!==1 (
    echo Launching with !BROWSER_NAME!...
    
    if "!BROWSER_NAME!"=="Google Chrome" (
        start "MyApp" /B "!BROWSER_PATH!" --app="http://localhost:%FRONTEND_PORT%" --start-fullscreen
    ) else if "!BROWSER_NAME!"=="Microsoft Edge" (
        start "MyApp" /B "!BROWSER_PATH!" --app="http://localhost:%FRONTEND_PORT%" --start-fullscreen
    ) else if "!BROWSER_NAME!"=="Firefox" (
        start "MyApp" /B "!BROWSER_PATH!" -kiosk "http://localhost:%FRONTEND_PORT%"
    ) else (
        REM Default browser (no special flags)
        start "MyApp" /B "!DEFAULT_BROWSER!" "http://localhost:%FRONTEND_PORT%"
    )
) else (
    echo No specific browser detected. Using system default...
    start "" "http://localhost:%FRONTEND_PORT%"
)

REM === Success Message ===
echo.
echo ========================================
echo    APPLICATION LAUNCHED SUCCESSFULLY!
echo ========================================
echo.
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Backend:  http://localhost:%BACKEND_PORT%
echo.
echo Closing this will stop the app


REM === Auto-cleanup when app closes ===

:CHECK_LOOP
timeout /t 3 /nobreak > nul
tasklist /FI "WINDOWTITLE EQ MyApp" 2>NUL | find /I /C "chrome.exe" >nul && goto CHECK_LOOP
tasklist /FI "WINDOWTITLE EQ MyApp" 2>NUL | find /I /C "msedge.exe" >nul && goto CHECK_LOOP
tasklist /FI "WINDOWTITLE EQ MyApp" 2>NUL | find /I /C "firefox.exe" >nul && goto CHECK_LOOP
tasklist /FI "WINDOWTITLE EQ MyApp" 2>NUL | find /I /C "opera.exe" >nul && goto CHECK_LOOP
tasklist /FI "WINDOWTITLE EQ MyApp" 2>NUL | find /I /C "brave.exe" >nul && goto CHECK_LOOP

REM === Cleanup services ===
echo.

taskkill /FI "WINDOWTITLE EQ Backend" /F >NUL 2>&1
taskkill /FI "WINDOWTITLE EQ Frontend" /F >NUL 2>&1
timeout /t 2 /nobreak > nul


timeout /t 2 /nobreak > nul