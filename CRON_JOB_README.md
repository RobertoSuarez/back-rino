# Sistema de Cron Job - Incremento Automático de Recursos

## 📋 Descripción

Sistema de cron job que incrementa automáticamente los recursos (Yachay, Tumis y Mullu) para todos los estudiantes activos cada hora.

## ⏰ Configuración del Cron Job

### Frecuencia
- **Cada hora** (minuto 0 de cada hora)
- Expresión cron: `'0 0 * * * *'`
- Zona horaria: `America/Guayaquil` (configurable)

### Recursos Incrementados

Por cada hora, **cada estudiante activo** recibe:

| Recurso | Cantidad | Tipo de Transacción | Razón |
|---------|----------|---------------------|-------|
| **Yachay** | +1 | BONUS | DAILY_LOGIN |
| **Tumis** | +1 | BONUS | DAILY_REFRESH |
| **Mullu** | +1 | BONUS | SUBSCRIPTION_REWARD |

## 🔧 Implementación

### Archivo Principal
`/src/game-transactions/services/game-cron.service.ts`

### Características

1. **Procesamiento en Paralelo**: Usa `Promise.allSettled()` para procesar todos los estudiantes simultáneamente
2. **Manejo de Errores**: Captura errores individuales sin detener el proceso completo
3. **Logging Detallado**: Registra éxitos, fallos y estadísticas
4. **Solo Estudiantes Activos**: Filtra por `typeUser: 'student'` y `status: 'active'`

### Código del Cron Job

```typescript
@Cron('0 0 * * * *', {  // Cada hora
  name: 'increment-student-resources',
  timeZone: 'America/Guayaquil',
})
async incrementStudentResources() {
  // Obtener todos los estudiantes activos
  const students = await this.userRepository.find({
    where: {
      typeUser: 'student',
      status: 'active',
    },
  });

  // Procesar cada estudiante
  await Promise.allSettled(
    students.map(async (student) => {
      // Incrementar Yachay, Tumis y Mullu
      // ...
    })
  );
}
```

## 🎮 Endpoints de Control

### 1. Ejecutar Incremento Manual

**POST** `/game-transactions/cron/manual-increment`

**Requiere:** Admin

**Descripción:** Ejecuta el incremento de recursos manualmente sin esperar al cron.

**Uso:**
```bash
curl -X POST http://localhost:3000/game-transactions/cron/manual-increment \
  -H "Authorization: Bearer TU_TOKEN_ADMIN"
```

**Respuesta:**
```json
{
  "statusCode": 200,
  "message": "Incremento manual ejecutado exitosamente"
}
```

### 2. Ver Estado del Cron Job

**GET** `/game-transactions/cron/status`

**Requiere:** Admin

**Descripción:** Obtiene información sobre el estado del cron job.

**Uso:**
```bash
curl http://localhost:3000/game-transactions/cron/status \
  -H "Authorization: Bearer TU_TOKEN_ADMIN"
```

**Respuesta:**
```json
{
  "statusCode": 200,
  "message": "Estado del cron job obtenido exitosamente",
  "data": {
    "name": "increment-student-resources",
    "schedule": "Cada hora",
    "description": "Incrementa Tumis, Mullu y Yachay en 1 para todos los estudiantes activos",
    "active": true
  }
}
```

## 📊 Logs del Sistema

El cron job genera logs detallados en la consola:

```
[GameCronService] Iniciando incremento de recursos para estudiantes...
[GameCronService] Incrementando recursos para 150 estudiantes
[GameCronService] Incremento completado: 150 exitosos, 0 fallidos
```

### Niveles de Log

- **DEBUG**: Inicio del proceso
- **LOG**: Información general y resultados
- **ERROR**: Errores individuales o del proceso completo

## ⚙️ Configuración

### Cambiar la Frecuencia

Edita el decorador `@Cron` en `game-cron.service.ts`:

```typescript
// Cada 6 horas
@Cron('0 0 */6 * * *')

// Cada día a las 00:00
@Cron('0 0 0 * * *')

// Cada lunes a las 09:00
@Cron('0 0 9 * * 1')
```

### Cambiar la Zona Horaria

```typescript
@Cron('0 * * * * *', {
  name: 'increment-student-resources',
  timeZone: 'America/New_York', // Cambiar aquí
})
```

### Cambiar las Cantidades

Edita los valores de `amount` en el método `incrementStudentResources()`:

```typescript
// Incrementar Yachay en 5 en lugar de 1
await this.transactionsService.createTransaction({
  userId: student.id,
  resourceType: ResourceType.YACHAY,
  transactionType: TransactionType.BONUS,
  reason: TransactionReason.DAILY_LOGIN,
  amount: 5, // Cambiar aquí
  description: 'Incremento automático por minuto',
});
```

## 🚀 Inicio Automático

El cron job se inicia automáticamente cuando el servidor arranca, gracias al `ScheduleModule` de NestJS.

### Verificar que está Activo

1. Inicia el servidor: `npm run start:dev`
2. Observa los logs cada minuto
3. O usa el endpoint de status

## 🧪 Testing

### Probar Manualmente

```bash
# 1. Verificar estado
curl http://localhost:3000/game-transactions/cron/status \
  -H "Authorization: Bearer TU_TOKEN_ADMIN"

# 2. Ejecutar manualmente
curl -X POST http://localhost:3000/game-transactions/cron/manual-increment \
  -H "Authorization: Bearer TU_TOKEN_ADMIN"

# 3. Verificar transacciones creadas
curl http://localhost:3000/game-transactions/user/1 \
  -H "Authorization: Bearer TU_TOKEN"
```

### Verificar en Base de Datos

```sql
-- Ver últimas transacciones automáticas
SELECT 
  id, 
  "userId", 
  "resourceType", 
  amount, 
  description, 
  "createdAt"
FROM game_transaction
WHERE description = 'Incremento automático por minuto'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Contar transacciones por minuto
SELECT 
  DATE_TRUNC('minute', "createdAt") as minuto,
  COUNT(*) as total_transacciones
FROM game_transaction
WHERE description = 'Incremento automático por minuto'
GROUP BY minuto
ORDER BY minuto DESC
LIMIT 10;
```

## 📈 Impacto en el Sistema

### Cálculos de Crecimiento

Con **100 estudiantes activos**:

- **Por hora**: 300 transacciones (100 estudiantes × 3 recursos)
- **Por día**: 7,200 transacciones
- **Por mes**: ~216,000 transacciones

### Almacenamiento

- Cada transacción: ~300 bytes
- 100 estudiantes por mes: ~65 MB (antes era ~3.9 GB)

### Recomendaciones

1. **Monitorear el rendimiento** de la base de datos
2. **Implementar política de retención** (ej: mantener solo últimos 3 meses)
3. **Considerar agregación** de datos antiguos
4. **Ajustar frecuencia** según necesidad real

## 🔒 Seguridad

- Solo usuarios con rol `admin` pueden ejecutar el incremento manual
- Solo usuarios con rol `admin` pueden ver el estado del cron
- El cron job se ejecuta automáticamente sin intervención del usuario
- Todas las transacciones quedan registradas con timestamp

## 🐛 Troubleshooting

### El cron no se ejecuta

1. Verificar que `ScheduleModule` está importado en `AppModule`
2. Verificar logs del servidor
3. Verificar que `GameCronService` está en los providers del módulo

### Errores en las transacciones

1. Verificar que los estudiantes tienen status `active`
2. Verificar conexión a la base de datos
3. Revisar logs de errores específicos

### Performance lento

1. Reducir frecuencia del cron
2. Implementar procesamiento por lotes
3. Optimizar consultas de base de datos
4. Agregar índices adicionales

## 📝 Notas Importantes

- El cron job crea transacciones reales que afectan los balances de usuarios
- Cada ejecución es independiente y no se acumulan si el servidor está apagado
- Los errores individuales no detienen el proceso completo
- Se recomienda monitorear los logs regularmente

## 🔄 Desactivar el Cron Job

Si necesitas desactivar temporalmente el cron job:

### Opción 1: Comentar el decorador

```typescript
// @Cron('0 * * * * *', {
//   name: 'increment-student-resources',
//   timeZone: 'America/Lima',
// })
async incrementStudentResources() {
  // ...
}
```

### Opción 2: Usar variable de entorno

```typescript
@Cron('0 * * * * *', {
  name: 'increment-student-resources',
  timeZone: 'America/Lima',
  disabled: process.env.DISABLE_CRON === 'true',
})
```

Luego en `.env`:
```
DISABLE_CRON=true
```

## 📞 Soporte

Para cualquier duda o problema con el cron job, contacta al equipo de desarrollo.
