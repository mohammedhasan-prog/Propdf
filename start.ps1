# ProPDF Quick Start Script
# Run this script to start all microservices

Write-Host "Starting ProPDF Microservices..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerRunning = docker info 2>&1 | Select-String "Server Version"
if (-not $dockerRunning) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Docker is running" -ForegroundColor Green
Write-Host ""

# Build and start services
Write-Host "Building and starting all services..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
Write-Host ""

docker-compose up --build

Write-Host ""
Write-Host "Services stopped" -ForegroundColor Yellow
