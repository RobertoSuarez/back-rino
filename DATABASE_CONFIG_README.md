# Configuración de la Base de Datos PostgreSQL

Este documento explica cómo configurar correctamente la conexión a la base de datos PostgreSQL en Aiven.

## Problema de Certificado SSL

El error `self-signed certificate in certificate chain` ocurre cuando intentamos conectarnos a una base de datos PostgreSQL con SSL pero la configuración del certificado no es correcta.

## Solución

Hemos modificado el archivo `database.module.ts` para manejar correctamente la configuración SSL y los certificados CA. Ahora puedes configurar la conexión a través de variables de entorno.

## Pasos para configurar la conexión

1. Copia el contenido del archivo `env_config_recomendado.txt` a tu archivo `.env`

2. Ajusta las siguientes variables según tu configuración:

   ```
   DATABASE_SSL=true
   DATABASE_REJECT_UNAUTHORIZED=false
   DATABASE_CA_CERT=tu_certificado_ca_aquí
   ```

   - `DATABASE_SSL`: Activa/desactiva la conexión SSL
   - `DATABASE_REJECT_UNAUTHORIZED`: Si es `false`, permite certificados autofirmados
   - `DATABASE_CA_CERT`: El contenido del certificado CA para la verificación SSL

3. Prueba la conexión ejecutando:

   ```bash
   node test-db-connection.js
   ```

## Variables de entorno para la base de datos

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| DATABASE_TYPE | Tipo de base de datos | postgres |
| DATABASE_USER | Usuario de la base de datos | - |
| DATABASE_PASSWORD | Contraseña de la base de datos | - |
| DATABASE_HOST | Host de la base de datos | - |
| DATABASE_PORT | Puerto de la base de datos | - |
| DATABASE_NAME | Nombre de la base de datos | - |
| DATABASE_SSL | Habilitar SSL | false |
| DATABASE_REJECT_UNAUTHORIZED | Rechazar certificados no autorizados | true |
| DATABASE_CA_CERT | Certificado CA para SSL | - |
| DATABASE_CA_CERT_PATH | Ruta al archivo del certificado CA | - |
| DATABASE_SYNCHRONIZE | Sincronizar entidades automáticamente | true |
| DATABASE_LOGGING | Habilitar logs de consultas SQL | false |

## Notas importantes

- En producción, es recomendable establecer `DATABASE_SYNCHRONIZE=false` para evitar cambios automáticos en el esquema de la base de datos.
- Si tienes problemas con la conexión SSL, intenta establecer `DATABASE_REJECT_UNAUTHORIZED=false` temporalmente.
- El certificado CA puede proporcionarse directamente en la variable `DATABASE_CA_CERT` o como una ruta a un archivo en `DATABASE_CA_CERT_PATH`.
