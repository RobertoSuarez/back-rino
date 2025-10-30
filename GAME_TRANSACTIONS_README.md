# Sistema de Transacciones de Gamificación

Sistema completo para registrar y analizar todas las transacciones de Yachay, Tumis y Mullu en Cyber Imperium.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Entidades](#entidades)
- [Endpoints API](#endpoints-api)
- [Uso del TransactionHelper](#uso-del-transactionhelper)
- [Ejemplos de Integración](#ejemplos-de-integración)
- [Análisis y Estadísticas](#análisis-y-estadísticas)

## 🎯 Descripción General

El sistema de transacciones permite:

- ✅ **Registro automático** de todas las ganancias y gastos de recursos
- ✅ **Historial completo** de transacciones por usuario
- ✅ **Análisis temporal** con filtros por fecha
- ✅ **Estadísticas agregadas** (total ganado, gastado, promedio, etc.)
- ✅ **Análisis de crecimiento** diario, semanal y mensual
- ✅ **Leaderboard mejorado** con análisis de crecimiento en períodos

### Tipos de Recursos

- **Yachay**: Experiencia/conocimiento (XP)
- **Tumis**: Vidas/corazones
- **Mullu**: Moneda premium

### Tipos de Transacciones

- `EARN`: Ganancia normal
- `SPEND`: Gasto
- `BONUS`: Bonificación especial
- `PENALTY`: Penalización
- `ADJUSTMENT`: Ajuste manual
- `REWARD`: Recompensa

### Razones de Transacciones

**Para Yachay:**
- `ACTIVITY_COMPLETED`: Actividad completada
- `CHAPTER_COMPLETED`: Capítulo completado
- `COURSE_COMPLETED`: Curso completado
- `ASSESSMENT_PASSED`: Evaluación aprobada
- `DAILY_LOGIN`: Login diario
- `STREAK_BONUS`: Bonificación por racha

**Para Tumis:**
- `DAILY_REFRESH`: Recarga diaria
- `ACTIVITY_FAILED`: Actividad fallada
- `PURCHASED`: Comprado con Mullu

**Para Mullu:**
- `ACHIEVEMENT_UNLOCKED`: Logro desbloqueado
- `REFERRAL_BONUS`: Bonificación por referido
- `ITEM_PURCHASED`: Item comprado
- `SUBSCRIPTION_REWARD`: Recompensa por suscripción

**General:**
- `ADMIN_ADJUSTMENT`: Ajuste manual por admin
- `SYSTEM_CORRECTION`: Corrección del sistema
- `OTHER`: Otro

## 📊 Entidades

### GameTransaction

```typescript
{
  id: number;
  userId: number;
  resourceType: 'yachay' | 'tumis' | 'mullu';
  transactionType: 'earn' | 'spend' | 'bonus' | 'penalty' | 'adjustment' | 'reward';
  reason: TransactionReason;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  relatedActivityId?: number;
  relatedChapterId?: number;
  relatedCourseId?: number;
  relatedAssessmentId?: number;
  metadata?: Record<string, any>;
  adjustedByUserId?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔌 Endpoints API

### 1. Crear Transacción (Manual)

**POST** `/game-transactions`

**Requiere:** Admin o Teacher

```json
{
  "userId": 1,
  "resourceType": "yachay",
  "transactionType": "earn",
  "reason": "activity_completed",
  "amount": 50,
  "description": "Completó actividad de phishing",
  "relatedActivityId": 123
}
```

### 2. Consultar Transacciones

**GET** `/game-transactions?userId=1&resourceType=yachay&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=50`

**Query Parameters:**
- `userId` (opcional): ID del usuario
- `resourceType` (opcional): yachay, tumis o mullu
- `transactionType` (opcional): earn, spend, etc.
- `reason` (opcional): Razón específica
- `startDate` (opcional): Fecha inicio (ISO 8601)
- `endDate` (opcional): Fecha fin (ISO 8601)
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Items por página (default: 50)
- `relatedActivityId`, `relatedChapterId`, `relatedCourseId`, `relatedAssessmentId` (opcionales)

**Respuesta:**
```json
{
  "statusCode": 200,
  "message": "Transacciones obtenidas exitosamente",
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

### 3. Transacciones de Usuario

**GET** `/game-transactions/user/:userId?resourceType=yachay&page=1&limit=50`

Obtiene el historial de transacciones de un usuario específico.

### 4. Estadísticas de Usuario

**GET** `/game-transactions/stats/:userId?resourceType=yachay&startDate=2024-01-01&endDate=2024-12-31`

**Respuesta:**
```json
{
  "statusCode": 200,
  "message": "Estadísticas obtenidas exitosamente",
  "data": [
    {
      "userId": 1,
      "resourceType": "yachay",
      "currentBalance": 1250,
      "totalEarned": 1500,
      "totalSpent": 250,
      "netChange": 1250,
      "transactionCount": 45,
      "averagePerTransaction": 27.78,
      "largestEarn": 200,
      "largestSpend": 50,
      "periodStart": "2024-01-01T00:00:00.000Z",
      "periodEnd": "2024-12-31T23:59:59.999Z"
    }
  ]
}
```

### 5. Análisis de Crecimiento

**GET** `/game-transactions/growth/:userId?resourceType=yachay&startDate=2024-01-01&endDate=2024-12-31`

**Respuesta:**
```json
{
  "statusCode": 200,
  "message": "Análisis de crecimiento obtenido exitosamente",
  "data": {
    "userId": 1,
    "resourceType": "yachay",
    "dailyGrowth": [
      {
        "date": "2024-01-01",
        "earned": 100,
        "spent": 20,
        "net": 80,
        "balance": 80
      },
      ...
    ],
    "weeklyGrowth": [...],
    "monthlyGrowth": [...]
  }
}
```

### 6. Leaderboard por Recurso

**GET** `/game-transactions/leaderboard/:resourceType?limit=100`

**Ejemplo:** `/game-transactions/leaderboard/yachay?limit=50`

**Respuesta:**
```json
{
  "statusCode": 200,
  "message": "Leaderboard obtenido exitosamente",
  "data": [
    {
      "rank": 1,
      "userId": 5,
      "firstName": "Juan",
      "lastName": "Pérez",
      "urlAvatar": "...",
      "yachay": 2500,
      "tumis": 5,
      "mullu": 150,
      "currentValue": 2500
    },
    ...
  ]
}
```

### 7. Leaderboard con Crecimiento

**GET** `/game-transactions/leaderboard/:resourceType/growth?startDate=2024-01-01&endDate=2024-01-31&limit=100`

**Respuesta:**
```json
{
  "statusCode": 200,
  "message": "Leaderboard con crecimiento obtenido exitosamente",
  "data": [
    {
      "rank": 1,
      "userId": 5,
      "firstName": "Juan",
      "lastName": "Pérez",
      "urlAvatar": "...",
      "yachay": 2500,
      "tumis": 5,
      "mullu": 150,
      "currentValue": 2500,
      "periodGrowth": 450,
      "periodEarned": 500,
      "periodSpent": 50,
      "growthPercentage": 21.95
    },
    ...
  ]
}
```

## 🛠️ Uso del TransactionHelper

El `TransactionHelper` facilita la creación de transacciones desde otros módulos.

### Importar el módulo

```typescript
import { GameTransactionsModule } from '../game-transactions/game-transactions.module';

@Module({
  imports: [GameTransactionsModule],
  // ...
})
export class MiModulo {}
```

### Inyectar el helper

```typescript
import { TransactionHelper } from '../game-transactions/helpers/transaction.helper';

@Injectable()
export class MiServicio {
  constructor(
    private readonly transactionHelper: TransactionHelper,
  ) {}
}
```

### Métodos Disponibles

#### Yachay

```typescript
// Actividad completada
await this.transactionHelper.rewardActivityCompletion(
  userId,
  activityId,
  50, // cantidad de Yachay
  'Completó actividad de phishing'
);

// Capítulo completado
await this.transactionHelper.rewardChapterCompletion(
  userId,
  chapterId,
  100
);

// Curso completado
await this.transactionHelper.rewardCourseCompletion(
  userId,
  courseId,
  500
);

// Evaluación aprobada
await this.transactionHelper.rewardAssessmentPassed(
  userId,
  assessmentId,
  150,
  95 // score
);

// Login diario
await this.transactionHelper.rewardDailyLogin(
  userId,
  10,
  5 // racha de días
);

// Bonificación por racha
await this.transactionHelper.rewardStreak(
  userId,
  50,
  7 // días consecutivos
);
```

#### Tumis

```typescript
// Recarga diaria
await this.transactionHelper.refreshDailyTumis(
  userId,
  5
);

// Penalizar por fallar actividad
await this.transactionHelper.penalizeActivityFailed(
  userId,
  activityId,
  1
);

// Comprar Tumis con Mullu
await this.transactionHelper.purchaseTumis(
  userId,
  3, // tumis a comprar
  50 // costo en Mullu
);
```

#### Mullu

```typescript
// Logro desbloqueado
await this.transactionHelper.rewardAchievement(
  userId,
  100,
  'Maestro del Phishing',
  achievementId
);

// Bonificación por referido
await this.transactionHelper.rewardReferral(
  userId,
  50,
  referredUserId
);

// Comprar item
await this.transactionHelper.purchaseItem(
  userId,
  75,
  'Avatar Premium',
  itemId
);

// Recompensa por suscripción
await this.transactionHelper.rewardSubscription(
  userId,
  25,
  courseId
);
```

#### Ajustes Manuales

```typescript
// Ajuste manual por administrador
await this.transactionHelper.adminAdjustment(
  userId,
  ResourceType.YACHAY,
  1000, // nuevo balance
  adminUserId,
  'Corrección por error del sistema'
);
```

## 💡 Ejemplos de Integración

### Ejemplo 1: Completar Actividad

```typescript
// En activity-progress.service.ts

import { TransactionHelper } from '../game-transactions/helpers/transaction.helper';

@Injectable()
export class ActivityProgressService {
  constructor(
    private readonly transactionHelper: TransactionHelper,
  ) {}

  async completeActivity(userId: number, activityId: number) {
    // Lógica para marcar actividad como completada
    // ...

    // Otorgar Yachay
    const yachayAmount = this.calculateYachayReward(activityId);
    await this.transactionHelper.rewardActivityCompletion(
      userId,
      activityId,
      yachayAmount,
      `Completó actividad: ${activityName}`
    );

    return { success: true };
  }
}
```

### Ejemplo 2: Sistema de Login Diario

```typescript
// En auth.service.ts

import { TransactionHelper } from '../game-transactions/helpers/transaction.helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly transactionHelper: TransactionHelper,
  ) {}

  async handleDailyLogin(userId: number) {
    const lastLogin = await this.getLastLogin(userId);
    const today = new Date();
    
    // Verificar si es un nuevo día
    if (this.isDifferentDay(lastLogin, today)) {
      const streak = await this.calculateStreak(userId);
      
      // Otorgar Yachay por login diario
      await this.transactionHelper.rewardDailyLogin(
        userId,
        10,
        streak
      );

      // Bonificación por racha de 7 días
      if (streak === 7) {
        await this.transactionHelper.rewardStreak(
          userId,
          50,
          streak
        );
      }

      // Recargar Tumis diarios
      await this.transactionHelper.refreshDailyTumis(userId, 5);
    }
  }
}
```

### Ejemplo 3: Evaluación con Penalización

```typescript
// En assessment.service.ts

import { TransactionHelper } from '../game-transactions/helpers/transaction.helper';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly transactionHelper: TransactionHelper,
  ) {}

  async submitAssessment(userId: number, assessmentId: number, answers: any[]) {
    const result = await this.gradeAssessment(answers);
    
    if (result.passed) {
      // Otorgar Yachay por aprobar
      const yachayAmount = Math.floor(result.score * 2);
      await this.transactionHelper.rewardAssessmentPassed(
        userId,
        assessmentId,
        yachayAmount,
        result.score
      );
    } else {
      // Penalizar con pérdida de Tumis
      await this.transactionHelper.penalizeActivityFailed(
        userId,
        assessmentId,
        1
      );
    }

    return result;
  }
}
```

### Ejemplo 4: Sistema de Logros

```typescript
// En achievements.service.ts

import { TransactionHelper } from '../game-transactions/helpers/transaction.helper';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly transactionHelper: TransactionHelper,
  ) {}

  async checkAndUnlockAchievements(userId: number) {
    const achievements = await this.getUnlockedAchievements(userId);
    
    for (const achievement of achievements) {
      // Otorgar Mullu por logro
      await this.transactionHelper.rewardAchievement(
        userId,
        achievement.mulluReward,
        achievement.name,
        achievement.id
      );
      
      // Marcar como desbloqueado
      await this.markAsUnlocked(userId, achievement.id);
    }
  }
}
```

## 📈 Análisis y Estadísticas

### Dashboard de Usuario

Puedes crear un dashboard completo combinando diferentes endpoints:

```typescript
async getUserDashboard(userId: number) {
  // Estadísticas generales
  const stats = await this.transactionsService.getUserStats({
    userId,
    startDate: this.getMonthStart(),
    endDate: this.getMonthEnd(),
  });

  // Crecimiento de Yachay
  const yachayGrowth = await this.transactionsService.getUserGrowth({
    userId,
    resourceType: ResourceType.YACHAY,
    startDate: this.getMonthStart(),
    endDate: this.getMonthEnd(),
  });

  // Últimas transacciones
  const recentTransactions = await this.transactionsService.getUserTransactions(
    userId,
    undefined,
    1,
    10
  );

  return {
    stats,
    yachayGrowth,
    recentTransactions,
  };
}
```

### Reportes Administrativos

```typescript
async getAdminReport(startDate: string, endDate: string) {
  // Top usuarios por crecimiento
  const topGrowth = await this.transactionsService.getLeaderboardWithGrowth(
    ResourceType.YACHAY,
    startDate,
    endDate,
    20
  );

  // Transacciones totales
  const allTransactions = await this.transactionsService.queryTransactions({
    startDate,
    endDate,
    page: 1,
    limit: 1000,
  });

  // Análisis por tipo de transacción
  const byType = this.groupByTransactionType(allTransactions.data);

  return {
    topGrowth,
    totalTransactions: allTransactions.meta.total,
    byType,
  };
}
```

## 🔒 Seguridad

- Todos los endpoints requieren autenticación (AuthGuard)
- La creación manual de transacciones está restringida a admins y teachers
- Los usuarios solo pueden ver sus propias transacciones (implementar validación adicional si es necesario)
- Los ajustes manuales quedan registrados con el ID del administrador que los realizó

## 🎨 Próximos Pasos para Frontend

1. **Dashboard de Usuario**
   - Gráficos de crecimiento (Chart.js, ApexCharts)
   - Estadísticas en tiempo real
   - Historial de transacciones

2. **Leaderboard Mejorado**
   - Filtros por período
   - Análisis de crecimiento
   - Comparación con otros usuarios

3. **Panel de Administración**
   - Crear transacciones manuales
   - Ver todas las transacciones
   - Reportes y análisis

4. **Notificaciones**
   - Alertas cuando se gana Yachay/Tumis/Mullu
   - Notificaciones de logros
   - Recordatorios de racha

## 📝 Notas Importantes

- Todas las transacciones son **inmutables** (no se pueden editar ni eliminar)
- El balance se actualiza **automáticamente** al crear una transacción
- Las transacciones de tipo `ADJUSTMENT` permiten establecer un balance específico
- El sistema valida que no se pueda gastar más de lo disponible
- Todas las fechas están en formato ISO 8601 y se almacenan en UTC

## 🐛 Debugging

Para verificar que todo funciona correctamente:

```bash
# Ver logs de transacciones
curl -X GET "http://localhost:3000/game-transactions?userId=1&limit=10"

# Crear transacción de prueba
curl -X POST "http://localhost:3000/game-transactions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": 1,
    "resourceType": "yachay",
    "transactionType": "earn",
    "reason": "activity_completed",
    "amount": 50
  }'
```

## 📞 Soporte

Para cualquier duda o problema con el sistema de transacciones, contacta al equipo de desarrollo.
