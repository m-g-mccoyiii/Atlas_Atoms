@echo off
rem Starts a tiny local web server and opens the game. Close this window to stop it.
cd /d "%~dp0"
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8765/apps/steam/react.html"
where python >nul 2>nul && (python -m http.server 8765) || (py -m http.server 8765)
