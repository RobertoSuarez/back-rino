#!/usr/bin/env bash
set -euo pipefail

# Configuración del contenedor PostgreSQL para el proyecto
# Puedes ajustar estas variables si lo necesitas
DATABASE_HOST="localhost"
DATABASE_NAME="db-rino"
DATABASE_PASSWORD="npg_i5HCNhUuBe4s"
DATABASE_PORT="5432"
DATABASE_TYPE="postgres"
DATABASE_USER="postgres"

CONTAINER_NAME="back-rino-postgres"
VOLUME_NAME="back-rino-pgdata"
IMAGE="postgres:16-alpine"

# Crear volumen persistente (idempotente)
echo "Creando/verificando volumen: ${VOLUME_NAME}"
docker volume create "${VOLUME_NAME}" >/dev/null

# Si existe un contenedor con el mismo nombre, detenerlo y eliminarlo
if [ "$(docker ps -aq -f name=^${CONTAINER_NAME}$)" ]; then
  echo "Encontrado contenedor existente ${CONTAINER_NAME}. Deteniendo y eliminando..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null || true
fi

# Iniciar contenedor
echo "Levantando contenedor PostgreSQL (${IMAGE}) como ${CONTAINER_NAME}..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -e POSTGRES_DB="${DATABASE_NAME}" \
  -e POSTGRES_USER="${DATABASE_USER}" \
  -e POSTGRES_PASSWORD="${DATABASE_PASSWORD}" \
  -p "${DATABASE_PORT}:5432" \
  -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
  --health-cmd='pg_isready -U postgres' \
  --health-interval=10s \
  --health-timeout=5s \
  --health-retries=5 \
  "${IMAGE}" >/dev/null

# Mostrar información de conexión
echo "\nPostgreSQL en ejecución. Datos persistentes en volumen: ${VOLUME_NAME}"
echo "Contenedor: ${CONTAINER_NAME}"
echo "Credenciales:"
echo "  HOST=${DATABASE_HOST}"
echo "  PORT=${DATABASE_PORT}"
echo "  USER=${DATABASE_USER}"
echo "  PASSWORD=${DATABASE_PASSWORD}"
echo "  DB=${DATABASE_NAME}"

echo "\nComandos útiles:"
echo "  Ver logs:   docker logs -f ${CONTAINER_NAME}"
echo "  Detener:     docker stop ${CONTAINER_NAME}"
echo "  Eliminar:    docker rm -f ${CONTAINER_NAME}"
echo "  Psql (docker): docker exec -it ${CONTAINER_NAME} psql -U ${DATABASE_USER} -d ${DATABASE_NAME}"

echo "\nConfig .env sugerida (ya coincide con tus valores):"
echo "  DATABASE_HOST=localhost"
echo "  DATABASE_PORT=${DATABASE_PORT}"
echo "  DATABASE_USER=${DATABASE_USER}"
echo "  DATABASE_PASSWORD=${DATABASE_PASSWORD}"
echo "  DATABASE_NAME=${DATABASE_NAME}"
echo "  DATABASE_TYPE=${DATABASE_TYPE}"
