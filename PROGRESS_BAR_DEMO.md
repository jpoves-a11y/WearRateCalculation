# Demo: Barra de Progreso con ETA en Tiempo Real

## 🎬 Flujo Visual de la Barra

### Estado 1: Archivo Seleccionado - Inicio de Carga
```
┌──────────────────────────────────────────────────────────┐
│ 📤 Importing Model         0.00 MB/s    0% / 0s / 8m 45s │
├──────────────────────────────────────────────────────────┤
│ ▁░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────────────────────────────────────┤
│ 1 MB                                            800 MB    │
│                                                          │
│ ⏱️ Estimated time: 8m 45s remaining                     │
└──────────────────────────────────────────────────────────┘
```

### Estado 2: 15% Completado
```
┌──────────────────────────────────────────────────────────┐
│ 📤 Importing Model         1.47 MB/s   15% / 1m 20s / 7m 15s│
├──────────────────────────────────────────────────────────┤
│ ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────────────────────────────────────┤
│ 120 MB                                          800 MB    │
│                                                          │
│ ⏱️ Estimated time: 7m 15s remaining                     │
└──────────────────────────────────────────────────────────┘
```

### Estado 3: 50% Completado - Mitad
```
┌──────────────────────────────────────────────────────────┐
│ 📤 Importing Model         1.52 MB/s   50% / 4m 20s / 4m 20s│
├──────────────────────────────────────────────────────────┤
│ ██████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────────────────────────────────────┤
│ 400 MB                                          800 MB    │
│                                                          │
│ ⏱️ Estimated time: 4m 20s remaining                     │
└──────────────────────────────────────────────────────────┘
```

### Estado 4: 85% Completado - Casi Listo
```
┌──────────────────────────────────────────────────────────┐
│ 📤 Importing Model         1.51 MB/s   85% / 7m 21s / 1m 15s│
├──────────────────────────────────────────────────────────┤
│ █████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────────────────────────────────────┤
│ 680 MB                                          800 MB    │
│                                                          │
│ ⏱️ Estimated time: 1m 15s remaining                     │
└──────────────────────────────────────────────────────────┘
```

### Estado 5: 99% - Casi Completado
```
┌──────────────────────────────────────────────────────────┐
│ 📤 Importing Model         1.50 MB/s   99% / 8m 44s / 5s  │
├──────────────────────────────────────────────────────────┤
│ ████████████████████████████████████████████████░░░░░░░░ │
├──────────────────────────────────────────────────────────┤
│ 792 MB                                          800 MB    │
│                                                          │
│ ⏱️ Estimated time: 5s remaining                         │
└──────────────────────────────────────────────────────────┘
```

### Estado 6: 100% - Completado (Barra Desaparece)
```
✅ STL loaded: 355,432 vertices (8m 45s) - Memory: 234.5MB
```

---

## 📊 Cálculos en Tiempo Real

### Ejemplo: Archivo de 800MB @ 1.5 MB/s

| Tiempo | Cargado | % | Velocidad | ETA |
|--------|---------|---|-----------|-----|
| 0s | 0 MB | 0% | - | 8m 45s |
| 30s | 45 MB | 5% | 1.50 MB/s | 8m 15s |
| 1m | 90 MB | 11% | 1.50 MB/s | 7m 55s |
| 2m | 180 MB | 22% | 1.50 MB/s | 6m 50s |
| 4m | 360 MB | 45% | 1.50 MB/s | 4m 25s |
| 6m | 540 MB | 67% | 1.50 MB/s | 2m 50s |
| 8m | 720 MB | 90% | 1.50 MB/s | 55s |
| 8m 30s | 765 MB | 95% | 1.50 MB/s | 23s |
| 8m 45s | 800 MB | 100% | 1.50 MB/s | ✅ Completo |

---

## 🎨 Componentes Visuales

### 1. Área de Información (Encabezado)
```
📤 Importing Model         1.50 MB/s    45% / 2m 30s / 3m 35s
├─ Label + Velocidad MB/s
├─ Porcentaje
├─ Tiempo transcurrido
└─ Tiempo estimado restante
```

### 2. Barra de Progreso
```
████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
├─ Gradiente azul → púrpura (#667eea → #764ba2)
├─ Altura: 8px
├─ Animación smooth
└─ Transición 300ms
```

### 3. Información de Tamaños
```
120 MB                                              270 MB
├─ MB cargados en la izquierda
└─ MB totales en la derecha
```

### 4. ETA Box (Informativo)
```
⏱️ Estimated time: 2m 30s remaining
├─ Fondo azul claro
├─ Solo aparece durante carga
└─ Se actualiza cada 100ms
```

---

## ⚙️ Configuración Interna

### Variables de Estado
```javascript
progressState = {
    startTime: null,           // Cuando comenzó la carga
    lastUpdateTime: null,      // Último update
    lastLoadedBytes: 0,        // Bytes en última actualización
    totalBytes: 0,             // Total de bytes a cargar
    loadedBytes: 0,            // Bytes cargados actualmente
    updateInterval: null       // ID del intervalo de actualización
}
```

### Funciones Clave

**`showProgressBar(totalBytes)`**
- Muestra la barra de progreso
- Inicializa estado
- Calcula tamaño total

**`updateProgressBar(loadedBytes)`**
- Actualiza UI con progreso
- Calcula velocidad actual
- Estima ETA
- Formatea tiempo inteligentemente

**`hideProgressBar()`**
- Oculta barra cuando completa
- Limpia intervalos

---

## 🧮 Fórmulas Utilizadas

### Velocidad (MB/s)
```
velocidad = (bytes_cargados / 1024 / 1024) / tiempo_transcurrido
Ej: 120 MB / 80s = 1.5 MB/s
```

### Tiempo Estimado (ETA)
```
bytes_restantes = total_bytes - bytes_cargados
eta_segundos = (bytes_restantes / 1024 / 1024) / velocidad
Ej: 680 MB / 1.5 MB/s = 453s = 7m 33s
```

### Porcentaje Completado
```
porcentaje = (bytes_cargados / total_bytes) * 100
Ej: 120 / 800 = 15%
```

### Formato de Tiempo Inteligente
```
if eta < 60s:
    "Xs remaining"          // "45s remaining"
else if eta < 3600s:
    "Xm Ys remaining"       // "7m 30s remaining"
else:
    "Xh Ym remaining"       // "2h 15m remaining"
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Archivo Pequeño (5MB)
- Usuario hace click
- Barra aparece por < 1 segundo
- "Xs remaining" disminuye rápidamente
- Barra desaparece
- ✅ Muy rápido, sin estrés

### Caso 2: Archivo Mediano (200MB)
- Usuario hace click
- Barra aparece
- Muestra "1m 50s remaining"
- Se actualiza cada segundo
- ✅ Usuario sabe exactamente cuánto esperar

### Caso 3: Archivo Grande (800MB)
- Usuario hace click
- Barra aparece con "8m 45s remaining"
- Puede minimizar ventana y esperar
- Ve progreso actualizarse cada segundo
- Sabe que llegará en ~8-9 minutos
- ✅ Transparencia total, sin incertidumbre

---

## 🔍 Debugging

Para ver el progreso en detalle, abre console (F12):

```javascript
// Ver velocidad actual
console.log(progressState.loadedBytes / (1024 * 1024) / 
           ((Date.now() - progressState.startTime) / 1000) + ' MB/s')

// Ver ETA en segundos
const elapsed = (Date.now() - progressState.startTime) / 1000;
const speed = progressState.loadedBytes / (1024 * 1024) / elapsed;
const remaining = (progressState.totalBytes - progressState.loadedBytes) / (1024 * 1024);
console.log(remaining / speed + ' segundos restantes')
```

---

## ✨ Características Especiales

✓ **Cálculo dinámico**: ETA se recalcula cada frame  
✓ **Formato inteligente**: Cambia formato según tiempo  
✓ **Sin lag**: Updates de 100ms no afectan performance  
✓ **Visual hermoso**: Gradientes y animaciones smooth  
✓ **Responsive**: Adapta a cualquier ancho de pantalla  
✓ **Accesible**: Contraste adecuado para lectura  

---

**Fecha de implementación**: 21 Enero 2026  
**Versión**: 1.0
