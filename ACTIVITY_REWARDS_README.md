# Sistema de Recompensas por Actividades Completadas

## 📋 Descripción

Sistema que otorga **Mullu** automáticamente a los estudiantes cuando completan una actividad completa, basado en su precisión general.

## 🎯 Fórmula de Recompensa

```
Precisión (%) = (Suma de Calificaciones / (Total Ejercicios × 10)) × 100
Precisión (0-10) = Precisión (%) / 10
Mullu Ganado = Precisión (0-10) × 2
```

## 📊 Ejemplos de Cálculo

### Ejemplo 1: Actividad con 10 ejercicios - Perfección Total
```
Ejercicios: 10
Calificaciones: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
Suma: 100
Precisión (%): (100 / (10 × 10)) × 100 = 100%
Precisión (0-10): 100 / 10 = 10
Mullu Ganado: 10 × 2 = 20 Mullu
```

### Ejemplo 2: Actividad con 10 ejercicios - Buen Desempeño
```
Ejercicios: 10
Calificaciones: [10, 9, 8, 10, 7, 9, 10, 8, 9, 10]
Suma: 90
Precisión (%): (90 / (10 × 10)) × 100 = 90%
Precisión (0-10): 90 / 10 = 9
Mullu Ganado: 9 × 2 = 18 Mullu
```

### Ejemplo 3: Actividad con 5 ejercicios - Desempeño Medio
```
Ejercicios: 5
Calificaciones: [8, 7, 9, 7, 8]
Suma: 39
Precisión (%): (39 / (5 × 10)) × 100 = 78%
Precisión (0-10): 78 / 10 = 7.8
Mullu Ganado: 7.8 × 2 = 16 Mullu (redondeado)
```

### Ejemplo 4: Actividad con 8 ejercicios - Desempeño Bajo
```
Ejercicios: 8
Calificaciones: [7, 6, 5, 7, 8, 6, 7, 4]
Suma: 50
Precisión (%): (50 / (8 × 10)) × 100 = 62.5%
Precisión (0-10): 62.5 / 10 = 6.25
Mullu Ganado: 6.25 × 2 = 13 Mullu (redondeado)
```

## 🔌 Endpoint

### **POST** `/activity/:id/finish`

**Descripción:** Finaliza una actividad y otorga Mullu según la precisión.

**Request Body:**
```json
{
  "userId": 1,
  "feedback": [
    { "qualification": 10, "feedback": "..." },
    { "qualification": 8, "feedback": "..." },
    { "qualification": 9, "feedback": "..." }
  ]
}
```

**Response:**
```json
{
  "id": 123,
  "progress": 100,
  "score": 27,
  "accuracy": 90,
  "activity": "Introducción a Phishing",
  "gems": 50,
  "mulluEarned": 18
}
```

## ⚙️ Funcionamiento

### 1. **Completar Actividad**
El estudiante completa todos los ejercicios de una actividad.

### 2. **Cálculo de Precisión**
- Se suman todas las calificaciones obtenidas
- Se calcula el porcentaje de precisión
- Se convierte a escala 0-10

### 3. **Otorgamiento de Mullu**
- Se multiplica la precisión por 2
- Se redondea al entero más cercano
- Se crea una transacción automática
- Se actualiza el balance del usuario

### 4. **Registro de Transacción**
```json
{
  "userId": 1,
  "resourceType": "mullu",
  "transactionType": "reward",
  "reason": "achievement_unlocked",
  "amount": 18,
  "description": "Actividad completada: Introducción a Phishing",
  "metadata": {
    "achievementName": "Actividad completada: Introducción a Phishing",
    "achievementId": 123
  }
}
```

## 📈 Tabla de Recompensas

| Precisión (%) | Precisión (0-10) | Mullu Ganado |
|---------------|------------------|--------------|
| 100% | 10 | 20 Mullu |
| 90% | 9 | 18 Mullu |
| 80% | 8 | 16 Mullu |
| 75% | 7.5 | 15 Mullu |
| 70% | 7 | 14 Mullu |
| 60% | 6 | 12 Mullu |
| 50% | 5 | 10 Mullu |
| 40% | 4 | 8 Mullu |
| 30% | 3 | 6 Mullu |
| 20% | 2 | 4 Mullu |
| 10% | 1 | 2 Mullu |

## 💡 Diferencia con Recompensas por Ejercicio

### Recompensas por Ejercicio (Yachay)
- Se otorga **Yachay** por cada ejercicio individual
- Proporcional a la calificación del ejercicio
- Inmediato al completar el ejercicio

### Recompensas por Actividad (Mullu)
- Se otorga **Mullu** al completar toda la actividad
- Basado en la precisión general de todos los ejercicios
- Se otorga al finalizar la actividad completa

## 🎮 Estrategia de Gamificación

### Incentivos Combinados

**Durante la Actividad:**
- Cada ejercicio correcto → Gana Yachay
- Motivación inmediata por cada respuesta correcta

**Al Completar la Actividad:**
- Precisión alta → Gana más Mullu
- Recompensa por el desempeño general
- Incentiva la consistencia y precisión

### Ejemplo Completo

**Actividad: "Introducción a Phishing" (10 ejercicios)**

| Ejercicio | Dificultad | Calificación | Yachay Ganado |
|-----------|------------|--------------|---------------|
| 1 | Fácil | 10/10 | 5 Yachay |
| 2 | Fácil | 8/10 | 4 Yachay |
| 3 | Medio | 10/10 | 10 Yachay |
| 4 | Medio | 9/10 | 9 Yachay |
| 5 | Medio | 8/10 | 8 Yachay |
| 6 | Difícil | 10/10 | 15 Yachay |
| 7 | Difícil | 7/10 | 11 Yachay |
| 8 | Fácil | 10/10 | 5 Yachay |
| 9 | Medio | 9/10 | 9 Yachay |
| 10 | Medio | 10/10 | 10 Yachay |

**Totales:**
- **Yachay Total**: 86 Yachay (por ejercicios individuales)
- **Suma de Calificaciones**: 91
- **Precisión**: 91%
- **Mullu Ganado**: 18 Mullu (por actividad completa)

## 🔍 Verificación

### Ver Transacciones de Mullu
```bash
curl http://localhost:3000/game-transactions/user/1?resourceType=mullu
```

### Ver Estadísticas
```bash
curl http://localhost:3000/game-transactions/stats/1
```

## 🎨 Implementación en Frontend

### Mostrar Recompensa al Completar Actividad

```typescript
finishActivity(activityId: number, feedback: any[]) {
  this.activityService.finishActivity(activityId, this.userId, feedback)
    .subscribe({
      next: (result) => {
        // Mostrar resultados de la actividad
        this.showActivityResults(result);
        
        // Si ganó Mullu, mostrar alerta especial
        if (result.mulluEarned > 0) {
          this.showMulluReward(result.mulluEarned, result.accuracy);
        }
        
        // Recargar balance del usuario
        this.loadUserIndicators();
      }
    });
}

showMulluReward(mullu: number, accuracy: number) {
  Swal.fire({
    icon: 'success',
    title: '¡Actividad Completada!',
    html: `
      <div style="text-align: center;">
        <i class="pi pi-trophy" style="font-size: 3rem; color: gold;"></i>
        <h2>+${mullu} Mullu</h2>
        <p>Precisión: ${accuracy}%</p>
        <p>¡Excelente trabajo!</p>
      </div>
    `,
    confirmButtonText: 'Continuar'
  });
}
```

### Modal de Resultados

```html
<p-dialog [(visible)]="showResults" [modal]="true" [closable]="true">
  <div class="activity-results">
    <h2>Resultados de la Actividad</h2>
    
    <div class="stats">
      <div class="stat-card">
        <i class="pi pi-check-circle"></i>
        <h3>Precisión</h3>
        <p class="value">{{ results.accuracy }}%</p>
      </div>
      
      <div class="stat-card">
        <i class="pi pi-star"></i>
        <h3>Puntuación</h3>
        <p class="value">{{ results.score }}/{{ totalPossible }}</p>
      </div>
      
      <div class="stat-card highlight">
        <i class="pi pi-trophy"></i>
        <h3>Mullu Ganado</h3>
        <p class="value">+{{ results.mulluEarned }}</p>
      </div>
    </div>
    
    <button pButton label="Continuar" (click)="closeResults()"></button>
  </div>
</p-dialog>
```

## ⚠️ Consideraciones Importantes

1. **No hay mínimo**: Se otorga Mullu independientemente de la precisión
2. **Una sola vez**: Cada actividad otorga Mullu solo una vez
3. **Transacciones inmutables**: Las transacciones no se pueden editar
4. **Balance automático**: Se actualiza automáticamente en la tabla User
5. **Compatibilidad**: El sistema antiguo de "gems" para Yachay se mantiene por compatibilidad

## 🔄 Flujo Completo

```
1. Usuario completa todos los ejercicios de una actividad
   ↓
2. Frontend envía todas las calificaciones al endpoint finishActivity
   ↓
3. Backend calcula:
   - Suma de calificaciones
   - Precisión en porcentaje
   - Precisión en escala 0-10
   - Mullu = Precisión × 2
   ↓
4. Backend crea transacción de Mullu
   ↓
5. Backend actualiza balance del usuario
   ↓
6. Backend retorna resultados con mulluEarned
   ↓
7. Frontend muestra:
   - Resultados de la actividad
   - Alerta de Mullu ganado
   - Balance actualizado
```

## 📝 Próximas Mejoras

1. **Bonificaciones**: Bonus adicional por precisión perfecta (100%)
2. **Multiplicadores**: Bonus por completar actividades difíciles
3. **Rachas**: Bonus por completar múltiples actividades consecutivas
4. **Logros**: Desbloquear logros especiales por alta precisión
5. **Ranking**: Leaderboard de precisión por actividad

## 🐛 Troubleshooting

### El Mullu no se otorga
- Verificar que el endpoint finishActivity se esté llamando correctamente
- Verificar que todas las calificaciones se envíen en el payload
- Revisar logs del servidor

### Balance no se actualiza
- Verificar que la transacción se creó correctamente
- Refrescar la sesión del usuario
- Verificar que el servicio de transacciones esté funcionando

## 📞 Soporte

Para cualquier duda sobre el sistema de recompensas por actividades, contacta al equipo de desarrollo.
