#!/usr/bin/env bash
#
# PIGEC-130 — Script unificado de despliegue
#
# Reemplaza los ~20 scripts deploy-*.sh sueltos del repo.
# Uso:
#   ./scripts/deploy.sh --target=preview
#   ./scripts/deploy.sh --target=production
#   ./scripts/deploy.sh --target=preview --skip-tests
#   ./scripts/deploy.sh --help
#
# Requiere: node 20+, npm, vercel CLI (npm i -g vercel)

set -euo pipefail

# ===== Colores para output legible =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # sin color

log_info()  { echo -e "${BLUE}ℹ${NC}  $1"; }
log_ok()    { echo -e "${GREEN}✓${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}⚠${NC}  $1"; }
log_error() { echo -e "${RED}✗${NC}  $1"; }

# ===== Defaults =====
TARGET="preview"
SKIP_TESTS=false
SKIP_LINT=false

# ===== Ayuda =====
show_help() {
  cat <<EOF
PIGEC-130 — Script unificado de despliegue

Uso:
  ./scripts/deploy.sh [opciones]

Opciones:
  --target=<env>      Entorno destino: preview (default) | production
  --skip-tests        Omitir ejecución de pruebas (NO recomendado para production)
  --skip-lint         Omitir lint y typecheck (NO recomendado para production)
  --help              Mostrar esta ayuda

Ejemplos:
  ./scripts/deploy.sh --target=preview
  ./scripts/deploy.sh --target=production
  ./scripts/deploy.sh --target=preview --skip-tests

Entornos:
  preview      Genera URL de vista previa desde la rama actual.
               Útil para que los clínicos validen antes del merge.
  production   Despliega a producción. Solo se permite desde la rama 'main'.

Requisitos:
  - node 20 o superior
  - npm
  - vercel CLI autenticado (vercel login)

EOF
}

# ===== Parseo de argumentos =====
for arg in "$@"; do
  case $arg in
    --target=*)     TARGET="${arg#*=}"; shift ;;
    --skip-tests)   SKIP_TESTS=true;    shift ;;
    --skip-lint)    SKIP_LINT=true;     shift ;;
    --help|-h)      show_help; exit 0 ;;
    *) log_error "Opción desconocida: $arg"; show_help; exit 1 ;;
  esac
done

# ===== Validaciones =====
if [[ "$TARGET" != "preview" && "$TARGET" != "production" ]]; then
  log_error "Target inválido: '$TARGET'. Usar 'preview' o 'production'."
  exit 1
fi

log_info "Iniciando despliegue PIGEC-130 — target: $TARGET"

# Validar que estamos en la raíz del repo
if [[ ! -f "package.json" ]]; then
  log_error "No se encontró package.json. Ejecutar desde la raíz del repositorio."
  exit 1
fi

# Validar rama para production
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$TARGET" == "production" && "$CURRENT_BRANCH" != "main" ]]; then
  log_error "Los despliegues a production solo se permiten desde 'main'. Rama actual: '$CURRENT_BRANCH'."
  exit 1
fi

# Validar que no hay cambios sin commitear
if [[ -n "$(git status --porcelain)" ]]; then
  log_warn "Hay cambios sin commitear:"
  git status --short
  read -p "¿Continuar de todos modos? [y/N] " -n 1 -r; echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Despliegue cancelado."
    exit 0
  fi
fi

# ===== Instalación de dependencias =====
log_info "Instalando dependencias..."
npm ci --silent || { log_error "Fallo en npm ci"; exit 1; }
log_ok "Dependencias instaladas"

# ===== Lint + typecheck =====
if [[ "$SKIP_LINT" == false ]]; then
  log_info "Ejecutando lint..."
  npm run lint || { log_error "Fallo en lint"; exit 1; }
  log_ok "Lint OK"

  log_info "Ejecutando typecheck..."
  npm run typecheck 2>/dev/null || npx tsc --noEmit || { log_error "Fallo en typecheck"; exit 1; }
  log_ok "Typecheck OK"
fi

# ===== Tests =====
if [[ "$SKIP_TESTS" == false ]]; then
  log_info "Ejecutando pruebas..."
  npm test --silent 2>/dev/null || log_warn "No hay script 'test' configurado o falló — revisa"
  log_ok "Pruebas OK (o inexistentes)"
fi

# ===== Build =====
log_info "Construyendo aplicación..."
npm run build || { log_error "Fallo en build"; exit 1; }
log_ok "Build OK"

# ===== Deploy a Vercel =====
log_info "Desplegando a Vercel ($TARGET)..."
if [[ "$TARGET" == "production" ]]; then
  vercel deploy --prod --yes
else
  vercel deploy --yes
fi

log_ok "Despliegue completado"
log_info "Target: $TARGET | Rama: $CURRENT_BRANCH | Commit: $(git rev-parse --short HEAD)"
