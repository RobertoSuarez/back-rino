# Sincronización de Base de Datos

Este directorio contiene la configuración y scripts para gestionar la sincronización entre las entidades de TypeORM y las tablas de la base de datos PostgreSQL.

## Configuración de Sincronización

La configuración principal se encuentra en `database.module.ts`. Los aspectos más importantes son:

- `synchronize`: Se establece automáticamente según el entorno (activo en desarrollo, desactivado en producción)
- `autoLoadEntities`: Carga automáticamente las entidades registradas en los módulos
- `logging`: Activado en entorno de desarrollo para mejor depuración

## Scripts de Sincronización

Se han creado scripts para facilitar la gestión de la sincronización:

### Verificar Sincronización

Para verificar si las entidades están sincronizadas con las tablas de la base de datos:

```bash
npm run db:check
```

Este comando:
- Compara todas las entidades con las tablas existentes
- Identifica tablas faltantes
- Detecta columnas que existen en las entidades pero no en las tablas
- Detecta columnas que existen en las tablas pero no en las entidades

### Sincronizar Manualmente

Para sincronizar manualmente la base de datos con las entidades:

```bash
npm run db:sync
```

Este comando es especialmente útil en entornos de producción donde `synchronize: true` no es recomendable.

## Buenas Prácticas

1. **Desarrollo**:
   - La sincronización automática está activada por defecto
   - Ejecuta `npm run db:check` regularmente para verificar la sincronización

2. **Producción**:
   - Asegúrate de que `NODE_ENV=production` para desactivar la sincronización automática
   - Usa `npm run db:check` para verificar el estado de sincronización
   - Usa `npm run db:sync` para sincronizar manualmente después de despliegues

3. **Migraciones**:
   - Para cambios estructurales importantes, considera usar migraciones de TypeORM en lugar de sincronización automática

## Solución de Problemas

Si encuentras discrepancias entre entidades y tablas:

1. Verifica que todas las entidades estén correctamente decoradas con `@Entity()`
2. Asegúrate de que las entidades estén siendo importadas en sus respectivos módulos
3. Comprueba que las rutas de entidades en `database.module.ts` sean correctas
4. Ejecuta `npm run db:sync` para forzar la sincronización

## Estructura de Entidades

Las entidades se encuentran en:
- `/src/database/entities/`: Entidades principales
- `/src/common/entities/`: Entidades base y comunes
