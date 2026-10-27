# SmartCampus Runner PowerShell Script
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "    SmartCampus: College Navigation and Shortest Path Finder" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

Start-Process "http://127.0.0.1:5000"

if (Test-Path ".\venv\Scripts\python.exe") {
    Write-Host "[OK] Starting Flask Application..." -ForegroundColor Green
    & ".\venv\Scripts\python.exe" app.py
} else {
    Write-Host "[!] Using default Python..." -ForegroundColor Yellow
    python app.py
}
