#!/bin/bash

# Script de escaneo de seguridad
# Uso: ./security/scan.sh [opcion]
# Opciones: all, deps, secrets, sast

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Crear directorio de reportes
mkdir -p security/reports

case "${1:-all}" in
    deps)
        print_header "Escaneando dependencias con Trivy"
        docker run --rm -v "$(pwd):/project" aquasec/trivy:latest fs --scanners vuln /project

        print_header "Ejecutando npm audit"
        npm audit
        cd functions && npm audit
        ;;

    secrets)
        print_header "Buscando secretos con Gitleaks"
        docker run --rm -v "$(pwd):/project" zricethezav/gitleaks:latest detect --source=/project --verbose

        print_header "Buscando secretos con Trivy"
        docker run --rm -v "$(pwd):/project" aquasec/trivy:latest fs --scanners secret /project
        ;;

    sast)
        print_header "Análisis estático con Semgrep"
        docker run --rm -v "$(pwd):/project" semgrep/semgrep:latest scan --config=auto --config=p/security-audit /project
        ;;

    quick)
        print_header "Escaneo rápido de seguridad"

        echo -e "${YELLOW}1/3 - npm audit...${NC}"
        npm audit --audit-level=high 2>/dev/null

        echo -e "${YELLOW}2/3 - Buscando secretos...${NC}"
        docker run --rm -v "$(pwd):/project" zricethezav/gitleaks:latest detect --source=/project --no-git 2>/dev/null

        echo -e "${YELLOW}3/3 - Escaneo de vulnerabilidades...${NC}"
        docker run --rm -v "$(pwd):/project" aquasec/trivy:latest fs --scanners vuln --severity HIGH,CRITICAL /project
        ;;

    all|*)
        print_header "ESCANEO COMPLETO DE SEGURIDAD"

        print_header "1/4 - Vulnerabilidades en dependencias"
        docker run --rm -v "$(pwd):/project" aquasec/trivy:latest fs --scanners vuln /project

        print_header "2/4 - Búsqueda de secretos"
        docker run --rm -v "$(pwd):/project" zricethezav/gitleaks:latest detect --source=/project --verbose

        print_header "3/4 - Análisis estático (SAST)"
        docker run --rm -v "$(pwd):/project" semgrep/semgrep:latest scan --config=auto --config=p/security-audit /project

        print_header "4/4 - npm audit"
        npm audit
        cd functions && npm audit
        ;;
esac

print_header "Escaneo completado"
echo "Reportes guardados en: security/reports/"
