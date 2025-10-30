# Sistema de Recompensas por Ejercicios

## 📋 Descripción

Sistema que otorga **Yachay** automáticamente a los estudiantes cuando completan ejercicios correctamente, según la dificultad del ejercicio.

## 🎯 Recompensas por Dificultad

El Yachay otorgado es **proporcional a la calificación obtenida**:

**Fórmula:** `Yachay = (Calificación / 10) × Yachay Base`

| Dificultad | Yachay Base | Ejemplos |
|------------|-------------|----------|
| **Fácil** | 5 Yachay | 10/10 = 5 Yachay, 8/10 = 4 Yachay, 7/10 = 4 Yachay |
| **Medio** | 10 Yachay | 10/10 = 10 Yachay, 8/10 = 8 Yachay, 7/10 = 7 Yachay |
| **Difícil** | 15 Yachay | 10/10 = 15 Yachay, 8/10 = 12 Yachay, 7/10 = 11 Yachay |

**Condición:** Calificación ≥ 7 (aprobado)

## ⚙️ Funcionamiento

### 1. **Validación de Respuesta**
Cuando un estudiante envía una respuesta a un ejercicio:
- El sistema valida la respuesta
- Calcula la calificación (0-10)
- Genera feedback personalizado

### 2. **Otorgamiento de Yachay**
Si la calificación es **≥ 7** (aprobado):
- Se obtiene el Yachay base según la dificultad
- Se calcula el Yachay proporcional: `(calificación / 10) × yachayBase`
- Se redondea al entero más cercano
- Se crea una transacción automática
- Se actualiza el balance del usuario
- Se registra en el historial

### 3. **Respuesta al Frontend**
El endpoint retorna:
```json
{
  "qualification": 10,
  "feedback": "¡Excelente trabajo! Has identificado correctamente...",
  "yachayEarned": 10,
  "difficulty": "Medio"
}
```

## 🔌 Endpoint

### **POST** `/exercises/:id/feedback`

**Descripción:** Valida la respuesta de un ejercicio y otorga Yachay si es correcta.

**Request Body:**
```json
{
  "userId": 1,
  "answerSelect": "opción correcta",
  "answerSelects": ["opción1", "opción2"],
  "answerOrderFragmentCode": ["línea1", "línea2"],
  "answerOrderLineCode": ["código1", "código2"],
  "answerWriteCode": "código escrito",
  "answerFindError": "error identificado"
}
```

**Response:**
```json
{
  "qualification": 10,
  "feedback": "¡Muy bien! Has completado correctamente el ejercicio...",
  "yachayEarned": 10,
  "difficulty": "Medio"
}
```

## 💡 Ejemplo de Uso

### Desde el Frontend

```typescript
// Servicio de ejercicios
async submitExerciseAnswer(exerciseId: number, userId: number, answer: any) {
  const response = await this.http.post(
    `${this.apiUrl}/exercises/${exerciseId}/feedback`,
    {
      userId: userId,
      answerSelect: answer.selected,
      answerSelects: answer.multipleSelected,
      // ... otras respuestas según el tipo de ejercicio
    }
  ).toPromise();

  // response contiene:
  // - qualification: nota del ejercicio
  // - feedback: retroalimentación
  // - yachayEarned: Yachay ganado (si aprobó)
  // - difficulty: dificultad del ejercicio

  if (response.yachayEarned > 0) {
    // Mostrar alerta de recompensa
    this.showRewardAlert(response.yachayEarned, response.difficulty);
  }

  return response;
}

showRewardAlert(yachay: number, difficulty: string) {
  this.messageService.add({
    severity: 'success',
    summary: '¡Felicitaciones!',
    detail: `Has ganado ${yachay} Yachay por completar un ejercicio ${difficulty}`,
    life: 5000
  });
}
```

### Componente de Ejercicio

```typescript
async onSubmitAnswer() {
  this.loading = true;
  
  try {
    const result = await this.exerciseService.submitExerciseAnswer(
      this.exerciseId,
      this.currentUserId,
      this.userAnswer
    );

    // Mostrar calificación
    this.qualification = result.qualification;
    this.feedback = result.feedback;

    // Si ganó Yachay, mostrar alerta especial
    if (result.yachayEarned > 0) {
      this.showYachayReward(result.yachayEarned, result.difficulty);
    }

  } catch (error) {
    console.error('Error al enviar respuesta:', error);
  } finally {
    this.loading = false;
  }
}

showYachayReward(yachay: number, difficulty: string) {
  // Mostrar modal o toast con animación
  Swal.fire({
    icon: 'success',
    title: '¡Excelente!',
    html: `
      <div class="yachay-reward">
        <i class="pi pi-star" style="font-size: 3rem; color: gold;"></i>
        <h2>+${yachay} Yachay</h2>
        <p>Ejercicio ${difficulty} completado</p>
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: 'Continuar'
  });
}
```

## 📊 Transacciones Registradas

Cada vez que se otorga Yachay, se crea una transacción con:

```typescript
{
  userId: 1,
  resourceType: 'yachay',
  transactionType: 'earn',
  reason: 'activity_completed',
  amount: 10,
  balanceBefore: 50,
  balanceAfter: 60,
  description: 'Ejercicio completado correctamente (Medio)',
  relatedActivityId: 123,
  createdAt: '2024-01-15T10:30:00Z'
}
```

## 🎨 Sugerencias de UI para el Frontend

### 1. **Toast Notification**
```html
<p-toast position="top-center">
  <ng-template let-message pTemplate="message">
    <div class="flex flex-column align-items-center" style="flex: 1">
      <div class="text-center">
        <i class="pi pi-star" style="font-size: 3rem; color: gold;"></i>
        <h4>{{ message.summary }}</h4>
        <p>{{ message.detail }}</p>
      </div>
    </div>
  </ng-template>
</p-toast>
```

### 2. **Modal de Recompensa**
```html
<p-dialog 
  [(visible)]="showRewardModal" 
  [modal]="true" 
  [closable]="true"
  styleClass="reward-modal">
  <div class="reward-content">
    <div class="reward-icon">
      <i class="pi pi-star"></i>
    </div>
    <h2>¡Felicitaciones!</h2>
    <div class="yachay-amount">
      +{{ yachayEarned }} Yachay
    </div>
    <p>Has completado un ejercicio {{ difficulty }}</p>
    <div class="progress-info">
      <span>Total Yachay: {{ totalYachay }}</span>
    </div>
  </div>
</p-dialog>
```

### 3. **Animación CSS**
```css
@keyframes yachay-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.yachay-reward {
  animation: yachay-pop 0.5s ease-out;
}

.reward-icon i {
  font-size: 4rem;
  color: gold;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
```

## 🔍 Verificación

### Ver Transacciones de un Usuario
```bash
curl http://localhost:3000/game-transactions/user/1?resourceType=yachay
```

### Ver Estadísticas
```bash
curl http://localhost:3000/game-transactions/stats/1
```

## 🎯 Casos de Uso

### Caso 1: Ejercicio Fácil - Respuesta Perfecta
```
Usuario responde correctamente → Calificación: 10/10
→ Yachay otorgado: (10/10) × 5 = 5 Yachay
→ Mensaje: "¡Bien hecho! Has ganado 5 Yachay"
```

### Caso 2: Ejercicio Medio - Respuesta Parcial
```
Usuario responde parcialmente → Calificación: 8/10
→ Yachay otorgado: (8/10) × 10 = 8 Yachay
→ Mensaje: "¡Muy bien! Has ganado 8 Yachay por completar un ejercicio Medio"
```

### Caso 3: Ejercicio Difícil - Respuesta Mínima Aprobatoria
```
Usuario responde correctamente → Calificación: 7/10
→ Yachay otorgado: (7/10) × 15 = 11 Yachay (redondeado)
→ Mensaje: "¡Aprobado! Has ganado 11 Yachay por completar un ejercicio Difícil"
```

### Caso 4: Ejercicio Reprobado
```
Usuario responde incorrectamente → Calificación: 4/10
→ Yachay otorgado: 0 (no alcanza el mínimo de 7)
→ Mensaje: "Sigue intentando. Revisa el feedback para mejorar"
```

## ⚠️ Consideraciones Importantes

1. **Calificación Mínima**: Solo se otorga Yachay si la calificación es ≥ 7
2. **Una Sola Vez**: Cada ejercicio otorga Yachay solo una vez (implementar control si es necesario)
3. **Transacciones Inmutables**: Las transacciones no se pueden editar ni eliminar
4. **Manejo de Errores**: Si falla la transacción, el ejercicio se valida igual
5. **Balance Actualizado**: El balance se actualiza automáticamente en la tabla User

## 🔄 Flujo Completo

```
1. Usuario completa ejercicio
   ↓
2. Frontend envía respuesta con userId
   ↓
3. Backend valida respuesta
   ↓
4. Calcula calificación
   ↓
5. Si calificación ≥ 7:
   - Calcula Yachay según dificultad
   - Crea transacción
   - Actualiza balance
   ↓
6. Retorna resultado con yachayEarned
   ↓
7. Frontend muestra alerta de recompensa
   ↓
8. Usuario ve su nuevo balance
```

## 📝 Próximas Mejoras

1. **Multiplicadores**: Bonus por rachas de ejercicios correctos
2. **Logros**: Desbloquear logros por completar X ejercicios
3. **Límite Diario**: Evitar farming de Yachay
4. **Historial Visual**: Gráfico de Yachay ganado por día
5. **Ranking**: Leaderboard de Yachay ganado por ejercicios

## 🐛 Troubleshooting

### El Yachay no se otorga
- Verificar que `userId` esté en el request
- Verificar que la calificación sea ≥ 7
- Revisar logs del servidor
- Verificar que `GameTransactionsModule` esté importado

### Error al crear transacción
- Verificar que el usuario exista
- Verificar conexión a la base de datos
- Revisar logs de error en consola

### Balance no se actualiza
- Verificar que la transacción se creó correctamente
- Refrescar la sesión del usuario
- Verificar que el servicio esté funcionando

## 📞 Soporte

Para cualquier duda sobre el sistema de recompensas, contacta al equipo de desarrollo.
