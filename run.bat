@echo off
title SmartCampus - College Navigation and Shortest Path Finder
echo ===============================================================
echo     SmartCampus: College Navigation and Shortest Path Finder
echo ===============================================================
echo.

start "" "http://127.0.0.1:5000"

IF EXIST "venv\Scripts\python.exe" (
    echo [OK] Starting SmartCampus Flask app...
    venv\Scripts\python.exe app.py
) ELSE (
    echo [!] Starting with system Python...
    python app.py
)

pause
