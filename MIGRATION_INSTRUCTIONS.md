# Instrucciones de Migración - Sistema de Transacciones

## 📋 Pasos para Aplicar la Migración

### 1. Verificar la Configuración de TypeORM

Asegúrate de que tu configuración de TypeORM tenga `synchronize: true` en desarrollo o ejecuta las migraciones manualmente.

### 2. Ejecutar la Aplicación

Al iniciar la aplicación, TypeORM creará automáticamente la tabla `game_transaction` con la siguiente estructura:

```sql
CREATE TABLE game_transaction (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "resourceType" VARCHAR NOT NULL CHECK ("resourceType" IN ('yachay', 'tumis', 'mullu')),
  "transactionType" VARCHAR NOT NULL CHECK ("transactionType" IN ('earn', 'spend', 'bonus', 'penalty', 'adjustment', 'reward')),
  reason VARCHAR NOT NULL,
  amount INTEGER NOT NULL,
  "balanceBefore" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  description TEXT,
  "relatedActivityId" INTEGER,
  "relatedChapterId" INTEGER,
  "relatedCourseId" INTEGER,
  "relatedAssessmentId" INTEGER,
  metadata JSONB,
  "adjustedByUserId" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT "FK_game_transaction_user" FOREIGN KEY ("userId") 
    REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT "FK_game_transaction_adjusted_by" FOREIGN KEY ("adjustedByUserId") 
    REFERENCES "user"(id) ON DELETE SET NULL
);

-- Índices para mejorar el rendimiento
CREATE INDEX "IDX_game_transaction_userId_createdAt" ON game_transaction ("userId", "createdAt");
CREATE INDEX "IDX_game_transaction_resourceType_createdAt" ON game_transaction ("resourceType", "createdAt");
CREATE INDEX "IDX_game_transaction_transactionType_createdAt" ON game_transaction ("transactionType", "createdAt");
```

### 3. Verificar que la Tabla se Creó Correctamente

```bash
# Conectarse a PostgreSQL
psql -U tu_usuario -d tu_base_de_datos

# Verificar la tabla
\d game_transaction

# Verificar los índices
\di game_transaction*
```

### 4. Datos Existentes

**IMPORTANTE:** Los usuarios existentes ya tienen valores en `yachay`, `tumis` y `mullu`. Sin embargo, **NO HAY HISTORIAL DE TRANSACCIONES** para esos valores actuales.

#### Opciones:

**Opción A: Mantener los valores actuales sin historial**
- Los usuarios mantienen sus balances actuales
- Las nuevas transacciones se registrarán a partir de ahora
- No hay historial de cómo llegaron a esos valores

**Opción B: Crear transacciones iniciales (Recomendado)**
- Crear una transacción de ajuste inicial para cada usuario
- Esto documenta el estado inicial del sistema

Para la Opción B, ejecuta este script:

```typescript
// Script: seed-initial-transactions.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { GameTransactionsService } from './src/game-transactions/game-transactions.service';
import { UsersService } from './src/user/user.service';
import { ResourceType, TransactionType, TransactionReason } from './src/database/entities/gameTransaction.entity';

async function seedInitialTransactions() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const transactionsService = app.get(GameTransactionsService);
  const usersService = app.get(UsersService);

  const users = await usersService.findAll();

  for (const user of users) {
    // Solo crear transacciones si el usuario tiene algún balance
    if (user.yachay > 0) {
      await transactionsService.createTransaction({
        userId: user.id,
        resourceType: ResourceType.YACHAY,
        transactionType: TransactionType.ADJUSTMENT,
        reason: TransactionReason.SYSTEM_CORRECTION,
        amount: user.yachay,
        description: 'Balance inicial del sistema',
      });
      console.log(`✓ Yachay inicial creado para usuario ${user.id}: ${user.yachay}`);
    }

    if (user.tumis > 0) {
      await transactionsService.createTransaction({
        userId: user.id,
        resourceType: ResourceType.TUMIS,
        transactionType: TransactionType.ADJUSTMENT,
        reason: TransactionReason.SYSTEM_CORRECTION,
        amount: user.tumis,
        description: 'Balance inicial del sistema',
      });
      console.log(`✓ Tumis inicial creado para usuario ${user.id}: ${user.tumis}`);
    }

    if (user.mullu > 0) {
      await transactionsService.createTransaction({
        userId: user.id,
        resourceType: ResourceType.MULLU,
        transactionType: TransactionType.ADJUSTMENT,
        reason: TransactionReason.SYSTEM_CORRECTION,
        amount: user.mullu,
        description: 'Balance inicial del sistema',
      });
      console.log(`✓ Mullu inicial creado para usuario ${user.id}: ${user.mullu}`);
    }
  }

  console.log('✅ Transacciones iniciales creadas exitosamente');
  await app.close();
}

seedInitialTransactions().catch(console.error);
```

Para ejecutar el script:

```bash
# Compilar
npm run build

# Ejecutar
node dist/seed-initial-transactions.js
```

### 5. Probar el Sistema

```bash
# Iniciar el servidor
npm run start:dev

# Probar endpoints (en otra terminal)

# 1. Crear una transacción de prueba
curl -X POST http://localhost:3000/game-transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "userId": 1,
    "resourceType": "yachay",
    "transactionType": "earn",
    "reason": "activity_completed",
    "amount": 50,
    "description": "Prueba del sistema"
  }'

# 2. Ver transacciones del usuario
curl http://localhost:3000/game-transactions/user/1

# 3. Ver estadísticas
curl http://localhost:3000/game-transactions/stats/1

# 4. Ver leaderboard
curl http://localhost:3000/game-transactions/leaderboard/yachay
```

## 🔄 Integración con Código Existente

### Actualizar Módulos Existentes

Necesitarás actualizar los módulos que otorgan Yachay, Tumis o Mullu para usar el nuevo sistema:

#### 1. Activity Progress Module

```typescript
// src/course/activity-progress.service.ts

import { GameTransactionsModule } from '../game-transactions/game-transactions.module';
import { TransactionHelper } from '../game-transactions/helpers/transaction.helper';

// En el módulo
@Module({
  imports: [
    // ... otros imports
    GameTransactionsModule,
  ],
})

// En el servicio
@Injectable()
export class ActivityProgressService {
  constructor(
    // ... otros servicios
    private readonly transactionHelper: TransactionHelper,
  ) {}

  async completeActivity(userId: number, activityId: number) {
    // ... lógica existente ...

    // AGREGAR: Registrar transacción
    await this.transactionHelper.rewardActivityCompletion(
      userId,
      activityId,
      50, // cantidad de Yachay
      'Actividad completada'
    );
  }
}
```

#### 2. Assessment Module

```typescript
// src/course/assessment.service.ts

async submitAssessment(userId: number, assessmentId: number, answers: any[]) {
  const result = await this.gradeAssessment(answers);
  
  if (result.passed) {
    // AGREGAR: Registrar transacción de Yachay
    await this.transactionHelper.rewardAssessmentPassed(
      userId,
      assessmentId,
      result.score * 2,
      result.score
    );
  } else {
    // AGREGAR: Penalizar con pérdida de Tumis
    await this.transactionHelper.penalizeActivityFailed(
      userId,
      assessmentId,
      1
    );
  }
  
  return result;
}
```

#### 3. Auth Module (Login Diario)

```typescript
// src/user/auth.service.ts

async login(loginDto: LoginDto) {
  // ... lógica de login existente ...

  // AGREGAR: Sistema de login diario
  await this.handleDailyLogin(user.id);
  
  return { token, user };
}

private async handleDailyLogin(userId: number) {
  const lastLogin = await this.getLastLogin(userId);
  const today = new Date();
  
  if (this.isDifferentDay(lastLogin, today)) {
    // Otorgar Yachay por login diario
    await this.transactionHelper.rewardDailyLogin(userId, 10);
    
    // Recargar Tumis
    await this.transactionHelper.refreshDailyTumis(userId, 5);
  }
}
```

## 📊 Actualizar Leaderboard Existente

El leaderboard actual puede seguir funcionando, pero puedes mejorarlo con los nuevos endpoints:

```typescript
// src/statistics/statistics.service.ts

async getLeaderboard(resourceType: 'yachay' | 'tumis' | 'mullu') {
  // Usar el nuevo servicio
  return this.transactionsService.getLeaderboard(
    ResourceType[resourceType.toUpperCase()],
    100
  );
}

async getLeaderboardWithGrowth(
  resourceType: 'yachay' | 'tumis' | 'mullu',
  startDate: string,
  endDate: string
) {
  return this.transactionsService.getLeaderboardWithGrowth(
    ResourceType[resourceType.toUpperCase()],
    startDate,
    endDate,
    100
  );
}
```

## ⚠️ Consideraciones Importantes

1. **Rendimiento**: Los índices están optimizados para consultas frecuentes por usuario y fecha
2. **Almacenamiento**: Cada transacción ocupa ~200-500 bytes. Con 1000 usuarios y 100 transacciones/mes = ~20MB/mes
3. **Backup**: Asegúrate de incluir la tabla `game_transaction` en tus backups
4. **Retención**: Considera una política de retención de datos (ej: mantener transacciones de los últimos 2 años)

## 🧪 Testing

Crea tests para verificar el funcionamiento:

```typescript
describe('GameTransactionsService', () => {
  it('should create transaction and update user balance', async () => {
    const user = await createTestUser();
    const initialBalance = user.yachay;
    
    await transactionsService.createTransaction({
      userId: user.id,
      resourceType: ResourceType.YACHAY,
      transactionType: TransactionType.EARN,
      reason: TransactionReason.ACTIVITY_COMPLETED,
      amount: 50,
    });
    
    const updatedUser = await usersService.findOne(user.id);
    expect(updatedUser.yachay).toBe(initialBalance + 50);
  });
});
```

## 📝 Checklist de Implementación

- [ ] Tabla `game_transaction` creada en la base de datos
- [ ] Índices creados correctamente
- [ ] Script de transacciones iniciales ejecutado (opcional)
- [ ] Módulos existentes actualizados para usar TransactionHelper
- [ ] Tests creados y pasando
- [ ] Endpoints probados manualmente
- [ ] Documentación actualizada
- [ ] Frontend actualizado para consumir nuevos endpoints

## 🚀 Próximos Pasos

1. Implementar el frontend para visualizar transacciones
2. Crear dashboard de estadísticas
3. Implementar sistema de logros
4. Agregar notificaciones en tiempo real
5. Crear reportes administrativos

## 📞 Soporte

Si tienes problemas durante la migración, revisa:
- Logs del servidor
- Conexión a la base de datos
- Permisos de usuario de PostgreSQL
- Versión de TypeORM
