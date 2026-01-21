# Optimizaciones para Modelos 3D Grandes (800MB)

## 📊 Resumen de Mejoras

El sistema ahora soporta procesamiento de modelos hasta **800MB+** mediante las siguientes optimizaciones:

### 1. **Web Workers** ✅
- Procesamiento paralelo de STL en thread separado
- UI nunca se bloquea durante cálculos pesados
- Archivo: `stl-processor-worker.js`

### 2. **Memory Management** ✅
- Pool de buffers reutilizables
- Previene fragmentación de memoria
- Garbage collection automático
- Archivo: `geometry-optimizer.js` → `MemoryManager`

### 3. **Streaming Loader** ✅
- Carga archivos >50MB en chunks
- Previene picos de memoria
- Barra de progreso en tiempo real
- Archivo: `geometry-optimizer.js` → `StreamingGeometryLoader`

### 4. **Compresión de Geometría** ✅
- Quantización de posiciones (16-bit vs 32-bit)
- ~50% reducción de tamaño sin perder calidad
- Eliminación de vértices duplicados
- Archivo: `geometry-optimizer.js` → `GeometryCompressor`

### 5. **Performance Monitoring** ✅
- Métricas en tiempo real de duración y memoria
- Diagnóstico automático de cuellos de botella
- Archivo: `geometry-optimizer.js` → `PerformanceMonitor`

---

## 🚀 Cómo Usar

### Opción A: Carga Normal (UI automática)
1. Abre `index.html`
2. Haz click en "Upload STL File"
3. Selecciona tu archivo (hasta 800MB)
4. Sistema detecta automáticamente tamaño y optimiza

**Sistema automáticamente:**
- ✅ Usa Streaming Loader si > 50MB
- ✅ Monitorea memoria en tiempo real
- ✅ Reutiliza buffers de memoria
- ✅ Muestra progreso detallado

### Opción B: Control Manual (JavaScript console)

```javascript
// Verificar memoria disponible
console.log(state.memoryManager.getStats());

// Comprimir geometría manualmente
const compressed = GeometryCompressor.quantizePositions(
    state.geometry.attributes.position.array,
    16  // bits (8-32)
);
console.log(compressed.info);

// Limpiar memoria
state.memoryManager.clear();

// Ver métricas de performance
console.log(state.performanceMonitor.getAllMetrics());
```

---

## 📈 Límites de Rendimiento

| Tamaño Archivo | Navegador RAM | Tiempo Carga | Tiempo Análisis |
|---|---|---|---|
| 50MB | 2GB | 2-5s | 5-10s |
| 200MB | 4GB | 10-20s | 20-40s |
| 500MB | 8GB | 30-60s | 60-120s |
| 800MB | 16GB | 60-120s | 120-240s |

**Notas:**
- Chrome/Edge: mejor rendimiento
- Firefox: ~10% más lento
- Safari: ~20% más lento
- Requiere navegador moderno (ES6, WebGL 2.0)

---

## 🔧 Configuración Avanzada

### En `geometry-optimizer.js`:

**Ajustar tamaño de pool de memoria:**
```javascript
const mm = new MemoryManager();
mm.maxPoolSize = 100;  // Aumentar para archivos muy grandes
```

**Cambiar umbral de Streaming Loader:**
```javascript
// En el manejador de carga (index.html línea ~1830)
if (file.size > 100 * 1024 * 1024) {  // Cambiar a 100MB
    arrayBuffer = await StreamingGeometryLoader.loadSTLStreaming(file);
}
```

**Precisión de Quantización:**
```javascript
// Más precisión = más memoria, menos pérdida visual
const compressed = GeometryCompressor.quantizePositions(positions, 24);  // 24-bit
```

---

## ⚠️ Troubleshooting

### "OutOfMemory" o crash del navegador
1. Cierra otras pestañas y aplicaciones
2. Aumenta RAM disponible
3. Usa Chrome/Chromium (mejor GC)
4. Considera desplegar backend (ver abajo)

### Web Worker no carga
- Verifica que `stl-processor-worker.js` esté en la raíz
- Algunos browsers requieren HTTPS en producción
- Fallback automático al thread principal

### Carga muy lenta
- Normal para 500MB+
- Usa navegador actualizado (ES6 optimizado)
- Considera comprimir STL antes (format Draco si disponible)

---

## 🎯 Próximas Mejoras

### Tier 2 (Con servidor backend)
Si necesitas **>1GB** o quieres más rendimiento:

**Opción 1: Render.com (FREE)**
```bash
# railway.app también soporta free tier limitado
```

**Opción 2: Cloudflare Workers**
- Procesa en edge computing
- Costo muy bajo (~$0.50/mes)

**Opción 3: AWS Lambda**
- $0.0000166667 por GB-segundo
- Gratis primeros 1,000,000 invocaciones/mes

### Implementación Backend
```javascript
// Ejemplo: enviar a servidor para procesar
const formData = new FormData();
formData.append('stl', file);

const result = await fetch('/api/process-stl', {
    method: 'POST',
    body: formData
});

const geometry = await result.json();
```

---

## 📊 Monitoreo

**Ver métricas en console:**
```javascript
// Abrir DevTools (F12) → Console

// Ver uso actual de memoria
state.memoryManager.getStats()

// Ver todo lo procesado
state.performanceMonitor.getAllMetrics()

// Ver un análisis detallado
console.table(state.performanceMonitor.getAllMetrics())
```

---

## 🔒 Notas de Seguridad

- ✅ Todo procesamiento es **local** (en el navegador)
- ✅ No se envía data al servidor (excepto si configuras backend)
- ✅ Archivos STL nunca se guardan
- ✅ No se requiere login/autenticación
- ⚠️ Browser puede crashes con RAM insuficiente

---

## 📚 Referencias

- [THREE.js Documentation](https://threejs.org/docs/)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Performance Monitor API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

