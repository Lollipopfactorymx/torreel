# Script de escaneo de seguridad para Windows
# Uso: .\security\scan.ps1 [opcion]
# Opciones: all, deps, secrets, sast, quick

param(
    [string]$ScanType = "all"
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[X] $Message" -ForegroundColor Red
}

# Verificar Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker no esta instalado o no esta en el PATH"
    exit 1
}

# Crear directorio de reportes
$ReportsDir = Join-Path $ProjectRoot "security\reports"
if (-not (Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

Push-Location $ProjectRoot

try {
    switch ($ScanType.ToLower()) {
        "deps" {
            Write-Header "Escaneando dependencias con Trivy"
            docker run --rm -v "${ProjectRoot}:/project" aquasec/trivy:latest fs --scanners vuln /project

            Write-Header "Ejecutando npm audit"
            npm audit
            Push-Location functions
            npm audit
            Pop-Location
        }

        "secrets" {
            Write-Header "Buscando secretos con Gitleaks"
            docker run --rm -v "${ProjectRoot}:/project" zricethezav/gitleaks:latest detect --source=/project --verbose

            Write-Header "Buscando secretos con Trivy"
            docker run --rm -v "${ProjectRoot}:/project" aquasec/trivy:latest fs --scanners secret /project
        }

        "sast" {
            Write-Header "Analisis estatico con Semgrep"
            docker run --rm -v "${ProjectRoot}:/project" semgrep/semgrep:latest scan --config=auto --config=p/security-audit /project
        }

        "quick" {
            Write-Header "Escaneo rapido de seguridad"

            Write-Host "1/3 - npm audit..." -ForegroundColor Yellow
            npm audit --audit-level=high 2>$null

            Write-Host "2/3 - Buscando secretos..." -ForegroundColor Yellow
            docker run --rm -v "${ProjectRoot}:/project" zricethezav/gitleaks:latest detect --source=/project --no-git 2>$null

            Write-Host "3/3 - Vulnerabilidades criticas..." -ForegroundColor Yellow
            docker run --rm -v "${ProjectRoot}:/project" aquasec/trivy:latest fs --scanners vuln --severity HIGH,CRITICAL /project
        }

        default {
            Write-Header "ESCANEO COMPLETO DE SEGURIDAD"

            Write-Header "1/4 - Vulnerabilidades en dependencias"
            docker run --rm -v "${ProjectRoot}:/project" aquasec/trivy:latest fs --scanners vuln /project

            Write-Header "2/4 - Busqueda de secretos"
            docker run --rm -v "${ProjectRoot}:/project" zricethezav/gitleaks:latest detect --source=/project --verbose

            Write-Header "3/4 - Analisis estatico (SAST)"
            docker run --rm -v "${ProjectRoot}:/project" semgrep/semgrep:latest scan --config=auto --config=p/security-audit /project

            Write-Header "4/4 - npm audit"
            npm audit
            Push-Location functions
            npm audit
            Pop-Location
        }
    }
}
finally {
    Pop-Location
}

Write-Header "Escaneo completado"
Write-Host "Reportes guardados en: security\reports\"
