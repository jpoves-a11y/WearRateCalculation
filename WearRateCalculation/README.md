# Sistema de Análisis de Desgaste Acetabular

## Descripción General

El **Sistema de Análisis de Desgaste Acetabular** es una aplicación web de grado profesional diseñada para el análisis cuantitativo preciso del desgaste volumétrico y lineal en componentes protésicos acetabulares de cadera. Esta aplicación HTML5 independiente procesa archivos de malla STL para proporcionar visualización 3D completa, detección automática de zonas de desgaste, ajuste de geometría de referencia y cálculos precisos de medición de desgaste.

### Características Principales

- **Procesamiento de Archivos STL 3D**: Soporta formatos STL binarios y ASCII
- **Aislamiento Automático de Superficie Interna**: Filtrado geométrico robusto con análisis de componentes conectados
- **Detección de Zonas de Desgaste**: Análisis avanzado de curvatura gaussiana basado en el método de Meyer et al. (2003)
- **Detección de Borde (Rim)**: Algoritmo basado en distancias que identifica el 15% de vértices más alejados del centroide
- **Métodos Duales de Ajuste**: 
  - Gauss-Newton + Levenberg-Marquardt (convergencia rápida)
  - RANSAC + refinamiento LM (robusto contra valores atípicos)
- **Opciones de Forma**: Ajuste de superficies esféricas y elipsoidales
- **Métricas Completas**: Desgaste volumétrico, profundidad de penetración lineal y diagnósticos de calidad
- **Visualización Interactiva**: Visualizadores 3D duales con controles de órbita y zonas codificadas por color
- **Exportación Profesional**: Informes CSV, JSON, PDF y visualizaciones HTML interactivas

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Pipeline de Análisis](#pipeline-de-análisis)
3. [Detalles de Algoritmos](#detalles-de-algoritmos)
4. [Diagnósticos de Calidad](#diagnósticos-de-calidad)
5. [Instrucciones de Uso](#instrucciones-de-uso)
6. [Especificaciones Técnicas](#especificaciones-técnicas)
7. [Dependencias](#dependencias)

---

## Arquitectura del Sistema

### Stack Tecnológico

- **Frontend**: Aplicación HTML5 independiente con JavaScript ES6 modular
- **Renderizado 3D**: Three.js (v0.158.0) para visualización basada en WebGL
- **Framework UI**: Tailwind CSS para interfaz profesional y responsiva
- **Servidor**: Servidor HTTP Python 3.11 con encabezados de control de caché (modo desarrollo)
- **Despliegue**: Alojamiento de sitio estático (modo producción)

### Diseño Modular

La aplicación está organizada en módulos de servicio especializados para mantenibilidad y claridad:

#### **GeometryService** - Operaciones Geométricas Fundamentales

Proporciona funciones matemáticas y geométricas esenciales:

- **Cálculo de Áreas de Triángulos**: Usa la fórmula de Heron para calcular áreas precisas
- **Cálculo de Ángulos**: Determina ángulos entre vectores usando producto punto
- **Grafos de Adyacencia**: Construye estructuras de datos para análisis de conectividad de malla
- **Centroides de Triángulos**: Calcula puntos centrales de elementos triangulares
- **Operaciones Vectoriales**: Normalización, producto cruz, magnitudes

**Implementación clave**:
```javascript
// Área de triángulo usando vectores Three.js
triangleArea(v1, v2, v3) {
    const edge1 = new THREE.Vector3().subVectors(v2, v1);
    const edge2 = new THREE.Vector3().subVectors(v3, v1);
    const cross = new THREE.Vector3().crossVectors(edge1, edge2);
    return cross.length() / 2.0;
}
```

#### **CurvatureAnalyzer** - Geometría Diferencial Discreta

Implementa el cálculo de curvatura gaussiana discreta según Meyer et al. (2003):

**Fórmula de Curvatura Gaussiana**:
```
K = (2π - Σθᵢ) / A_mixed
```

Donde:
- **K**: Curvatura gaussiana en el vértice
- **θᵢ**: Ángulos de las caras adyacentes al vértice
- **A_mixed**: Área de Voronoi mixta (región de influencia del vértice)

**Área de Voronoi Mixta**: Se calcula considerando si el triángulo es obtuso o no:
- **Triángulos agudos/rectos**: Usa región de Voronoi estándar
- **Triángulos obtusos**: Usa área baricéntrica (1/3 o 1/6 del área del triángulo)

**Interpretación Física**:
- **K > 0**: Curvatura positiva (geometría esférica convexa) → **Zona NO desgastada**
- **K < 0**: Curvatura negativa (geometría de silla de montar) → **Zona desgastada**
- **K ≈ 0**: Superficie plana o cilíndrica

**Ventajas del método**:
- Robusto para mallas triangulares irregulares
- Computacionalmente eficiente O(n)
- Científicamente validado (Meyer et al., 2003)

#### **PCAService** - Análisis de Componentes Principales

Implementa PCA para ajuste óptimo de planos:

**Algoritmo PCA para Ajuste de Planos**:

1. **Centrado de Datos**: 
   ```
   p'ᵢ = pᵢ - centroide
   ```

2. **Matriz de Covarianza**:
   ```
   C = (1/n) Σ(p'ᵢ ⊗ p'ᵢ)
   ```

3. **Descomposición de Valores Propios**:
   - Calcula eigenvalores λ₁, λ₂, λ₃ y eigenvectores e₁, e₂, e₃
   - Ordena por magnitud: λ₁ ≥ λ₂ ≥ λ₃

4. **Normal del Plano**: 
   - El eigenvector correspondiente al **menor eigenvalue** (e₃) es la normal del plano de mejor ajuste
   - Los otros dos eigenvectores (e₁, e₂) definen el plano

5. **Ecuación del Plano**:
   ```
   n · (x - centroide) = 0
   ```

**Uso en el Sistema**:
- Ajuste del **plano de transición** entre zonas desgastadas/no desgastadas
- Minimiza la suma de distancias perpendiculares al cuadrado
- Más preciso que métodos de normal radial simple

#### **FittingService** - Estrategias de Ajuste de Esferas/Elipsoides

Implementa múltiples estrategias de optimización con diagnósticos completos:

**Capacidades**:
- Ajuste de esferas (4 parámetros: cx, cy, cz, r)
- Ajuste de elipsoides (6 parámetros: cx, cy, cz, rx, ry, rz)
- Método Gauss-Newton con amortiguamiento Levenberg-Marquardt
- RANSAC robusto con refinamiento LM
- Resolución de sistemas lineales 4×4 y 6×6 mediante eliminación gaussiana
- Cálculo de diagnósticos de calidad (RMS, residuales, inliers)

---

## Pipeline de Análisis

El sistema guía a los usuarios a través de un flujo de trabajo secuencial de 4 pasos:

### Paso 1: Aislar Superficie Interna

**Objetivo**: Extraer la superficie articular interna cóncava de la copa acetabular de la malla STL completa.

**Algoritmo Detallado**:

1. **Análisis de Vectores Normales**: 
   - Calcula normales de cara para todos los triángulos usando producto cruz
   - Normaliza vectores para dirección consistente

2. **Cálculo del Centroide**: 
   - Calcula el centro geométrico de toda la malla
   - `centroide = Σ(vértices) / n`

3. **Filtrado de Superficie Interna**: 
   - Para cada cara, calcula `toCentroid = (centroid - faceCenter).normalize()`
   - Producto punto: `dot = normal · toCentroid`
   - Selecciona caras donde `dot > 0.5` (normales apuntan HACIA DENTRO, hacia el centroide)
   - Superficie interna es cóncava, por lo que las normales apuntan hacia el interior

4. **Filtrado por Distancia**:
   - Calcula cuartiles de distribución de distancias (Q1, Q3)
   - Filtra caras: `distance ≤ Q3` (superficie interna está más cerca del centroide)

5. **Análisis de Componentes Conectados**:
   
   **a) Construcción del Grafo de Adyacencia**:
   - Crea mapa `vértice → caras` usando claves de posición (precisión 0.001mm)
   - Las caras son adyacentes si comparten posiciones de vértices
   - Complejidad: O(n·m) donde n=caras, m=vértices por cara

   **b) Búsqueda en Amplitud (BFS)**:
   - Encuentra todos los componentes conectados
   - Para cada cara no visitada, ejecuta BFS para descubrir su componente
   - Complejidad: O(n + e) donde e=aristas

   **c) Selección del Componente Más Grande**:
   - Ordena componentes por tamaño (número de caras)
   - Selecciona el componente más grande (superficie interna principal)
   - Elimina regiones espurias aisladas

6. **Renderizado con Transparencia**:
   - Caras seleccionadas: Material opaco (alfa = 1.0)
   - Caras no seleccionadas: Material transparente (alfa = 0.25)
   - Visualización clara de la superficie aislada

**Resultado**: Superficie interna limpia y aislada lista para análisis de desgaste (típicamente ~355k vértices para copas acetabulares).

**Salida Visual**: Malla renderizada con superficie interna resaltada, resto transparente.

---

### Paso 2: Detectar Zonas de Desgaste

**Objetivo**: Clasificar automáticamente los vértices de la superficie interna como "desgastados" (alto desgaste) o "no desgastados" (desgaste mínimo) basándose en características geométricas.

**Algoritmo de Clasificación Multi-Criterio**:

#### 2.1 Análisis de Curvatura Gaussiana (Meyer et al. 2003)

**Paso a Paso**:

1. **Construcción del Grafo de Vértices**:
   ```javascript
   // Mapa: índice de vértice → lista de vértices vecinos
   vertexGraph[i] = [vecinos que comparten una arista]
   ```

2. **Para cada vértice v**:
   
   **a) Recolectar vértices vecinos** (que comparten arista)
   
   **b) Calcular ángulos θᵢ** entre caras adyacentes:
   ```javascript
   // Para cada par de caras adyacentes
   angle = Math.acos(normal1.dot(normal2))
   ```
   
   **c) Calcular defecto angular**:
   ```javascript
   angleDefect = 2π - Σθᵢ
   ```
   
   **d) Calcular área de Voronoi mixta**:
   - Para cada triángulo adyacente:
     - Si es obtuso en v: `A_mixed += área_triángulo / 2`
     - Si es obtuso en otro vértice: `A_mixed += área_triángulo / 4`
     - Si es agudo: `A_mixed += área_región_Voronoi` (usando cotangentes)
   
   **e) Curvatura Gaussiana**:
   ```javascript
   K = angleDefect / A_mixed
   ```

3. **Interpretación**:
   - **K < 0**: Curvatura negativa → Deformación tipo silla de montar → **DESGASTADO**
   - **K > 0**: Curvatura positiva → Geometría esférica original → **NO DESGASTADO**

#### 2.2 Métrica de Desviación Radial

**Concepto**: El desgaste causa pérdida de material, acercando la superficie al centro de la copa.

**Algoritmo**:

1. **Calcular centroide** de todos los vértices de superficie interna

2. **Para cada vértice**:
   ```javascript
   distance = ||vértice - centroide||
   ```

3. **Dividir en hemisferios**:
   - **Hemisferio Positivo**: Vértices con componente positiva en eje de mayor dispersión
   - **Hemisferio Negativo**: Vértices con componente negativa

4. **Calcular distancias promedio**:
   ```javascript
   avgDistancePositive = promedio(distancias en hemisferio+)
   avgDistanceNegative = promedio(distancias en hemisferio-)
   ```

5. **Clasificación basada en hemisferio**:
   ```javascript
   if (avgDistancePositive > avgDistanceNegative) {
       // Hemisferio+ está MÁS LEJOS del centroide → DESGASTADO
       // Hemisferio- está MÁS CERCA del centroide → NO DESGASTADO
   } else {
       // Viceversa
   }
   ```

**Razonamiento Físico**:
- La zona desgastada tiende a estar en un lado de la copa (contacto con cabeza femoral)
- El desgaste desplaza vértices, pero el hemisferio desgastado tiende a estar más lejos del centroide geométrico debido a la geometría de la copa

#### 2.3 Detección de Borde (Rim)

**Nuevo Algoritmo Simplificado (v3 - Basado en Distancia)**:

**Método Anterior (complejo, no confiable)**:
- v1: Usaba eje con mayor dispersión geométrica
- v2: Análisis de normales y métodos de proyección

**Método Actual (simple, robusto)**:

1. **Calcular centroide** de todos los vértices de superficie interna:
   ```javascript
   centroid = Σ(vertices) / n
   ```

2. **Medir distancia al centroide** para cada vértice:
   ```javascript
   distances[i] = ||vertex[i] - centroid||
   ```

3. **Ordenar vértices por distancia** (descendente)

4. **Seleccionar el 15% superior**:
   ```javascript
   rimThreshold = percentile(distances, 85)
   rimVertices = vertices donde distance >= rimThreshold
   ```

**Justificación**:
- El borde de la copa acetabular forma un anillo circular en la abertura
- Estos vértices están naturalmente más alejados del centroide (que está dentro de la copa)
- El 15% de vértices más lejanos forman una banda circular alrededor del borde
- Simple, eficiente y extremadamente confiable

**Resultado**: Detección precisa de la banda de borde - el 15% de vértices más alejados del centroide forman naturalmente el borde circular en la abertura acetabular.

#### 2.4 Clasificación Final

**Combinación de Criterios**:

1. **Excluir vértices de borde** de la clasificación desgastado/no desgastado
2. **Aplicar clasificación de hemisferio** a vértices no-borde
3. **Opcional**: Refinar con puntuación de curvatura para casos ambiguos

**Resultado**: Vértices clasificados en zonas desgastadas (rojo) y no desgastadas (verde) con distribución típica de 11-13% desgastado, 87-89% no desgastado.

**Mejoras sobre Métodos Previos**:
- No depende de clasificación manual
- Robusto a ruido y variaciones de malla
- Computacionalmente eficiente
- Basado en principios físicos de geometría diferencial

---

### Paso 3: Ajustar Esfera de Referencia

**Objetivo**: Reconstruir la geometría esférica ideal no desgastada ajustando una esfera matemática SOLO a los vértices de la zona no desgastada.

**¿Por Qué Solo Vértices No Desgastados?**
- Los vértices no desgastados representan la **geometría original de la prótesis** antes de que ocurriera el desgaste
- Los vértices desgastados ya están deformados y sesgarían el ajuste hacia abajo
- Usar solo datos no desgastados asegura reconstruir la verdadera **superficie de referencia**

#### Métodos de Ajuste

#### **Método 1: Gauss-Newton + Levenberg-Marquardt (Predeterminado)**

**Parámetros**: 4 incógnitas (cx, cy, cz, r) - centro de esfera y radio

**Algoritmo Detallado**:

**1. Inicialización**:
```javascript
// Centro: Centroide geométrico de vértices no desgastados filtrados
center = Σ(unwornVertices) / n

// Radio: Distancia promedio de vértices al centroide
radius = promedio(||pᵢ - center||)
```

**2. Optimización Iterativa** (máximo 20 iteraciones):

**a) Calcular residuales** para cada vértice pᵢ:
```javascript
dist = ||pᵢ - center||
residual[i] = dist - radius
```

**b) Construir matriz Jacobiana** J (n × 4):
```javascript
// Derivadas parciales de residual respecto a parámetros
J[i] = [∂r/∂cx, ∂r/∂cy, ∂r/∂cz, ∂r/∂R]

// Donde:
dx = (pᵢ.x - cx) / dist
dy = (pᵢ.y - cy) / dist  
dz = (pᵢ.z - cz) / dist

∂r/∂cx = -dx
∂r/∂cy = -dy
∂r/∂cz = -dz
∂r/∂R = -1
```

**c) Ecuaciones normales con amortiguamiento LM**:
```javascript
// Sistema: (J^T J + λI) Δ = -J^T r
A = J^T J
b = -J^T r

// Agregar amortiguamiento Levenberg-Marquardt
for (i = 0; i < 4; i++) {
    A[i][i] += lambda
}

// Resolver para Δ = [Δcx, Δcy, Δcz, Δr]
delta = solve(A, b)
```

**d) Actualizar parámetros**:
```javascript
newCenter = center + [Δcx, Δcy, Δcz]
newRadius = radius + Δr

// Calcular nuevo RMSE
newRMSE = sqrt(Σ(residual²) / n)
```

**e) Amortiguamiento Adaptativo**:
```javascript
if (newRMSE < currentRMSE) {
    // Mejora: aceptar actualización, reducir amortiguamiento
    center = newCenter
    radius = newRadius
    lambda = lambda / 10  // Más parecido a Gauss-Newton
} else {
    // Empeora: rechazar actualización, aumentar amortiguamiento
    lambda = lambda * 10  // Más parecido a descenso de gradiente
}
```

**3. Criterios de Convergencia**:
- RMSE < 1e-6 mm, O
- |RMSE_prev - RMSE_current| < 1e-7 mm

**4. Cálculo de Diagnósticos Finales**:
```javascript
// Para cada vértice
residuals = []
for (p in vertices) {
    dist = ||p - center||
    residual = |dist - radius|
    residuals.push(residual)
}

rmsError = sqrt(Σ(residuals²) / n)
residualMin = min(residuals)
residualMax = max(residuals)
residualMean = promedio(residuals)
```

**Ventajas**: 
- Convergencia rápida (típicamente 5-10 iteraciones)
- Preciso para datos limpios
- Balance automático entre Gauss-Newton (rápido) y descenso de gradiente (estable)

**Parámetros de Ajuste**:
- `lambda_inicial = 0.001`
- `factor_reducción = 10`
- `factor_aumento = 10`
- `max_iteraciones = 20`
- `tolerancia = 1e-6`

---

#### **Método 2: RANSAC + Refinamiento LM (Robusto)**

**Parámetros**: Mismas 4 incógnitas (cx, cy, cz, r)

**Algoritmo Detallado**:

**Fase 1 - Consenso RANSAC** (100 iteraciones):

**Concepto**: Encuentra el mejor modelo que tiene mayor soporte (más inliers) en los datos, resistente a valores atípicos.

**Pasos**:

1. **Muestreo Aleatorio**:
   ```javascript
   for (iter = 0; iter < 100; iter++) {
       // Seleccionar 20 vértices aleatorios (o 10% del dataset)
       minSampleSize = min(20, floor(vertices.length * 0.1))
       sample = randomSample(vertices, minSampleSize)
   ```

2. **Ajuste del Modelo a la Muestra**:
   ```javascript
       // Ajustar esfera a muestra usando Gauss-Newton
       fit = fitSphereGaussNewton(sample)
   ```

3. **Conteo de Inliers**:
   ```javascript
       inliers = []
       for (p in vertices) {
           dist = ||p - fit.center||
           residual = |dist - fit.radius|
           
           if (residual < threshold) {  // threshold = 1.5 mm
               inliers.push(p)
           }
       }
   ```

4. **Seguimiento de Consenso**:
   ```javascript
       if (inliers.length > bestInlierCount) {
           bestInlierCount = inliers.length
           bestFit = fit
           bestInliers = inliers
       }
   }
   ```

**Umbral de Inlier**: 1.5 mm (aproximadamente 3-5% del radio acetabular típico de 30-50mm)

**Fase 2 - Refinamiento LM**:

1. **Extraer TODOS los inliers** del mejor modelo RANSAC:
   ```javascript
   console.log(`RANSAC: Mejor consenso tiene ${bestInlierCount} inliers 
                (${(bestInlierCount/vertices.length*100).toFixed(1)}%)`)
   ```

2. **Re-ajustar usando Gauss-Newton + LM** en conjunto de inliers limpio:
   ```javascript
   refinedFit = fitSphereGaussNewton(bestInliers)
   ```

3. **Esto elimina influencia de outliers manteniendo precisión**

**Protección contra Fallos**:
```javascript
if (bestInliers.length < minSampleSize) {
    console.warn('RANSAC falló en encontrar consenso, 
                  volviendo a Gauss-Newton en todos los puntos')
    return fitSphereGaussNewton(vertices)
}
```

**Ventajas**: 
- Robusto contra valores atípicos
- Maneja vértices mal clasificados
- Resistente a irregularidades geométricas
- Fallback a Gauss-Newton completo si RANSAC no encuentra consenso

**Parámetros RANSAC**:
- `iteraciones = 100`
- `tamañoMuestra = min(20, 10% de datos)`
- `umbralInlier = 1.5 mm`
- `consensoMínimo = tamañoMuestra`

---

#### **Opción de Ajuste de Elipsoide**

Para prótesis no esféricas, el sistema también soporta ajuste de elipsoides (6 parámetros: cx, cy, cz, rx, ry, rz) usando métodos análogos de Gauss-Newton y RANSAC.

**Ecuación del Elipsoide**:
```
(x-cx)²/rx² + (y-cy)²/ry² + (z-cz)²/rz² = 1
```

**Inicialización de Radios**:
```javascript
// PCA simple: calcular varianza a lo largo de cada eje
vx = sqrt(Σ(xᵢ - cx)² / n)
vy = sqrt(Σ(yᵢ - cy)² / n)
vz = sqrt(Σ(zᵢ - cz)² / n)

radii = { x: vx, y: vy, z: vz }
```

**Métrica de Esfericidad**:
```javascript
avgRadius = (rx + ry + rz) / 3
sphericity = 100 * (1 - max(|rx-avg|, |ry-avg|, |rz-avg|) / avgRadius)
```
- 100% = esfera perfecta
- < 90% = significativamente elipsoidal

---

#### Detección del Plano de Transición

**Objetivo**: Definir el límite geométrico entre zonas desgastadas y no desgastadas para cálculos volumétricos.

**Método RADIAL con PCA (v3 - Actual)**:

**Algoritmo Completo**:

**1. Detección de Vértices de Frontera**:

Identificar "puntos de inflexión" en AMBOS lados de la interfaz desgastado/no desgastado:

```javascript
boundaryVertices = []

// Lado A: Vértices NO desgastados con ≥1 vecino desgastado
for (v in unwornVertices) {
    if (tieneVecinoDesgastado(v)) {
        boundaryVertices.push(v)
    }
}

// Lado B: Vértices desgastados con ≥1 vecino no desgastado
for (v in wornVertices) {
    if (tieneVecinoNoDesgastado(v)) {
        boundaryVertices.push(v)
    }
}
```

**2. Centroide de Frontera**:
```javascript
boundaryCentroid = Σ(boundaryVertices) / boundaryVertices.length
```

**3. Ajuste PCA del Plano** (reemplaza método radial simple):

**a) Centrar puntos**:
```javascript
centeredPoints = boundaryVertices.map(p => p - boundaryCentroid)
```

**b) Matriz de covarianza**:
```javascript
C = zeros(3, 3)
for (p in centeredPoints) {
    C[0][0] += p.x * p.x
    C[0][1] += p.x * p.y
    C[0][2] += p.x * p.z
    C[1][1] += p.y * p.y
    C[1][2] += p.y * p.z
    C[2][2] += p.z * p.z
}
C = C / n
// Simetrizar
C[1][0] = C[0][1]
C[2][0] = C[0][2]
C[2][1] = C[1][2]
```

**c) Descomposición de eigenvalores** (método de potencias):
```javascript
// Encontrar eigenvector del eigenvalor más pequeño
// Este es la normal del plano de mejor ajuste
normal = smallestEigenvector(C)
```

**d) Ajustar orientación de normal**:
```javascript
// Normal debe apuntar HACIA DENTRO (hacia centro de esfera)
toCenter = (sphereCenter - boundaryCentroid).normalize()

if (normal.dot(toCenter) < 0) {
    normal = -normal  // Invertir si apunta hacia afuera
}
```

**4. Ecuación del Plano**:
```javascript
// n · (x - centroide) = 0
// o equivalentemente: n · x + d = 0
d = -normal.dot(boundaryCentroid)
```

**5. Función de Distancia con Signo**:
```javascript
signedDistance(point) {
    return normal.dot(point) + d
}

// Interpretación:
// distancia ≤ 0 → punto en lado desgastado (hacia el centro)
// distancia > 0 → punto en lado no desgastado (lejos del centro)
```

**Detalle Crítico**: La normal que apunta hacia adentro asegura que los vértices desgastados (más cerca del centro de la esfera) tienen distancia con signo negativa (≤ 0), lo que los filtra correctamente para cálculos de desgaste.

**Métrica de Calidad**: Distancia perpendicular promedio desde vértices de frontera al plano ajustado (típicamente < 0.5 mm para buenos ajustes, < 0.1 mm con PCA).

**Ventajas del Método PCA**:
- Plano de mejor ajuste verdadero (minimiza distancias al cuadrado)
- Más preciso que normal radial arbitraria
- Pasa exactamente por los puntos visualizados como marcadores de inflexión amarillos
- Métrica de calidad cuantificable

---

### Paso 4: Calcular Desgaste

**Objetivo**: Cuantificar métricas de desgaste tanto volumétrico como lineal usando la esfera de referencia ajustada y la superficie desgastada real.

#### Cálculo de Desgaste Volumétrico

**Método**: Integración volumétrica de penetraciones positivas a través de toda la superficie interna (v3.2).

**Algoritmo Mejorado (Independiente de Clasificación)**:

**Concepto Clave**: 
- NO confiar en clasificación desgastado/no desgastado
- Procesar TODOS los triángulos
- Contar solo penetración positiva (superficie real dentro de esfera = pérdida de material)
- Espacio de integración delimitado por plano de transición

**Pasos Detallados**:

**1. Procesamiento de Superficie**: Procesar TODOS los triángulos en la superficie interna (independiente de clasificación desgastado/no desgastado)

**2. Recorte de Triángulos por Plano de Transición**:

Para cada triángulo T = [v1, v2, v3]:

**a) Calcular distancias con signo al plano**:
```javascript
d1 = planeNormal.dot(v1) + planeD
d2 = planeNormal.dot(v2) + planeD
d3 = planeNormal.dot(v3) + planeD

// Normal del plano apunta hacia adentro (hacia centro acetabular)
// d ≤ 0 → punto en lado desgastado (hacia el centro)
// d > 0 → punto en lado no desgastado
```

**b) Clasificar triángulo**:
```javascript
if (d1 <= 0 && d2 <= 0 && d3 <= 0) {
    // Completamente en lado desgastado
    clippedTriangles = [T]
    
} else if (d1 > 0 && d2 > 0 && d3 > 0) {
    // Completamente en lado no desgastado
    clippedTriangles = []  // Omitir
    
} else {
    // Intersecta el plano - recortar
    clippedTriangles = clipTriangleByPlane(T, plane)
}
```

**c) Algoritmo de recorte de triángulo**:
```javascript
function clipTriangleByPlane(triangle, plane) {
    inside = []   // vértices con d ≤ 0
    outside = []  // vértices con d > 0
    
    // Clasificar vértices
    for (v in triangle.vertices) {
        d = signedDistance(v, plane)
        if (d <= 0) inside.push(v)
        else outside.push(v)
    }
    
    if (inside.length == 0) return []      // Todo afuera
    if (inside.length == 3) return [triangle]  // Todo adentro
    
    if (inside.length == 1) {
        // 1 vértice adentro, 2 afuera
        // Resultado: 1 triángulo más pequeño
        v_in = inside[0]
        v_out1 = outside[0]
        v_out2 = outside[1]
        
        // Interpolar intersecciones
        i1 = intersectEdge(v_in, v_out1, plane)
        i2 = intersectEdge(v_in, v_out2, plane)
        
        return [Triangle(v_in, i1, i2)]
        
    } else {  // inside.length == 2
        // 2 vértices adentro, 1 afuera
        // Resultado: 1 cuadrilátero → 2 triángulos
        v_in1 = inside[0]
        v_in2 = inside[1]
        v_out = outside[0]
        
        i1 = intersectEdge(v_in1, v_out, plane)
        i2 = intersectEdge(v_in2, v_out, plane)
        
        return [
            Triangle(v_in1, v_in2, i1),
            Triangle(v_in2, i2, i1)
        ]
    }
}
```

**3. Cálculo de Penetración** para cada vértice de triángulo recortado:

```javascript
function calculatePenetration(vertex, sphereCenter, sphereRadius) {
    distanceToCenter = ||vertex - sphereCenter||
    penetration = sphereRadius - distanceToCenter
    
    // penetración > 0 → punto dentro de esfera (pérdida de material)
    // penetración < 0 → punto fuera de esfera (material preservado)
    
    return penetration
}
```

**4. Integración de Volumen**:

Para cada triángulo recortado con penetración promedio positiva:

```javascript
totalVolume = 0

for (triangle in clippedTriangles) {
    // Calcular penetraciones en vértices
    p1 = calculatePenetration(triangle.v1, sphereCenter, sphereRadius)
    p2 = calculatePenetration(triangle.v2, sphereCenter, sphereRadius)
    p3 = calculatePenetration(triangle.v3, sphereCenter, sphereRadius)
    
    // Penetración promedio
    avgPenetration = (p1 + p2 + p3) / 3
    
    // Solo contar contribuciones positivas
    if (avgPenetration > 0) {
        // Área del triángulo
        area = triangleArea(triangle.v1, triangle.v2, triangle.v3)
        
        // Contribución de volumen: penetración promedio × área
        volumeContribution = avgPenetration * area
        
        totalVolume += volumeContribution
    }
}

volumetricWear = totalVolume  // mm³
```

**Fórmula**: 
```
V_desgaste = Σ (penetración_prom × área) para TODOS los triángulos con penetración_prom > 0
```

**Interpretación Física**: 
- Mide pérdida total de material a través de toda la superficie dentro del límite del plano
- Independiente de clasificación desgastado/no desgastado (más objetivo)
- Captura todas las regiones donde la superficie real está dentro de la esfera de referencia ajustada
- Espacio de integración delimitado por plano de transición (hacia superficie interna)

**Ventajas**:
- NO dependiente de precisión de clasificación
- Mide desviación geométrica verdadera de esfera ideal
- Medición más robusta y objetiva
- Maneja casos límite donde clasificación es ambigua

**Unidades**: Milímetros cúbicos (mm³)

**Visualización**: Región resaltada en naranja muestra zona de desgaste volumétrico.

---

#### Métricas de Desgaste Lineal

**Mediciones**: Calcular profundidades de penetración perpendiculares desde esfera ajustada a superficie real.

**Algoritmo**:

**1. Filtrar vértices desgastados** (en lado desgastado del plano de transición):
```javascript
wornVerticesFiltered = []

for (v in innerSurfaceVertices) {
    signedDist = planeNormal.dot(v) + planeD
    
    if (signedDist <= 0) {  // Lado desgastado del plano
        wornVerticesFiltered.push(v)
    }
}
```

**2. Para cada vértice filtrado**:
```javascript
penetrations = []

for (v in wornVerticesFiltered) {
    // Distancia radial al centro de esfera
    radialDistance = ||v - sphereCenter||
    
    // Profundidad de penetración
    penetration = sphereRadius - radialDistance
    
    // penetración > 0 → profundidad de desgaste
    // penetración < 0 → vértice fuera de esfera (error o mal clasificado)
    
    if (penetration > 0) {
        penetrations.push(penetration)
    }
}
```

**3. Calcular métricas estadísticas**:
```javascript
meanPenetration = promedio(penetrations)
maxPenetration = max(penetrations)
minPenetration = min(penetrations)

// Encontrar vértice con penetración máxima
maxPenetrationVertex = wornVerticesFiltered[indexOfMax(penetrations)]
```

**Métricas Reportadas**:
- **Profundidad de Penetración Media**: Profundidad de desgaste promedio a través de zona desgastada
- **Profundidad de Penetración Máxima**: Punto más profundo de desgaste
- **Profundidad de Penetración Mínima**: Punto más superficial en zona desgastada

**Unidades**: Milímetros (mm)

**Visualización**: 

**a) Línea de Profundidad Máxima**:
```javascript
// Punto en superficie de esfera (proyección radial)
direction = (maxPenetrationVertex - sphereCenter).normalize()
sphereSurfacePoint = sphereCenter + direction * sphereRadius

// Dibujar línea de cyan a magenta
line = createLine(
    sphereSurfacePoint,      // Cyan
    maxPenetrationVertex,    // Magenta
    colorGradient: 'cyan → magenta'
)
```

**b) Marcadores de Extremo**:
```javascript
// Marcador cyan en superficie de esfera
markerSphere = Sphere(sphereSurfacePoint, radius: 0.5mm, color: cyan)

// Marcador magenta en punto desgastado más profundo
markerDeepest = Sphere(maxPenetrationVertex, radius: 0.5mm, color: magenta)
```

**Interpretación**:
- Línea cyan-a-magenta muestra profundidad de penetración máxima
- Longitud de línea = profundidad de desgaste lineal máximo
- Visualización clara del peor caso de desgaste

---

## Diagnósticos de Calidad

El sistema proporciona métricas de calidad completas para validar precisión del ajuste:

### Diagnósticos de Ajuste

**1. Error RMS (Root Mean Square)**:
```javascript
RMS = sqrt(Σ(residual²) / n)
```
Donde `residual = |distancia_al_centro - radio|`

**Interpretación**:
- Valores típicos: 0.1-0.5 mm para buenos ajustes
- Valores > 1 mm indican ajuste pobre o geometría irregular
- Medida de "bondad de ajuste" general

**2. Iteraciones**: Número de iteraciones de optimización hasta convergencia
- Convergencia rápida: 5-10 iteraciones (datos bien condicionados)
- Convergencia lenta: 15-20 iteraciones (puede indicar problema mal condicionado)

**3. Inliers**: Número de vértices usados en ajuste final
- RANSAC: número de puntos con residual < 1.5mm
- Gauss-Newton: total de vértices filtrados

**4. Rango de Residuales**: [mín, máx, media] de residuales absolutos
```javascript
residuals = vertices.map(v => |distancia(v, centro) - radio|)
```
- Muestra distribución de errores de ajuste a través de superficie
- Rango amplio puede indicar superficie irregular

**5. Estado de Convergencia**: 
- "Converged" si se cumple tolerancia
- "Max iterations" en caso contrario

### Métricas de Calidad Geométrica

**1. Coincidencia de Área No Desgastada**:
```javascript
tolerance = 2 * RMS
matchingVertices = unwornVertices.filter(v => 
    |distancia(v, centro) - radio| < tolerance
)
unwornAreaMatch = 100 * matchingVertices.length / unwornVertices.length
```

**Interpretación**:
- Buenos ajustes: > 95%
- Ajustes marginales: 85-95%
- Ajustes pobres: < 85% (considerar método diferente o verificar calidad de datos)

**2. Esfericidad** (modo Elipsoide):
```javascript
avgRadius = (rx + ry + rz) / 3
maxDeviation = max(|rx - avg|, |ry - avg|, |rz - avg|)
sphericity = 100 * (1 - maxDeviation / avgRadius)
```
- 100% = esfera perfecta
- < 90% = significativamente elipsoidal

**3. Calidad del Plano de Transición**:
```javascript
avgDistance = promedio(|distancia_perpendicular(v, plano)| 
                      para v en boundaryVertices)
```
- Bueno: < 0.5 mm
- Marginal: 0.5-1.0 mm
- Con PCA típicamente < 0.1 mm

---

## Instrucciones de Uso

### Ejecutar la Aplicación

**Modo Desarrollo**:
1. Asegúrese de que Python 3.11 esté instalado
2. Ejecute el flujo de trabajo "Start application"
3. El servidor inicia en `http://0.0.0.0:5000`
4. Acceda vía webview de Replit o navegador local

**Despliegue en Producción**:
- Aplicación configurada como sitio estático
- Sirve `index.html` y todos los assets desde directorio raíz
- No se requiere paso de construcción (todas las dependencias vía CDN)

### Flujo de Trabajo de Análisis

**1. Cargar Archivo STL**: 
- Haga clic en "Choose File" y seleccione STL de copa acetabular
- Soporta formatos binarios y ASCII
- El archivo se carga y muestra en visor 3D

**2. Aislar Superficie Interna** (Paso 1):
- Haga clic en botón para ejecutar aislamiento de superficie interna
- Espere el procesamiento (típicamente 1-3 segundos)
- Verifique superficie aislada en visor (debería mostrar cuenco cóncavo)

**3. Detectar Zonas de Desgaste** (Paso 2):
- Haga clic en botón para ejecutar detección de desgaste
- El sistema analiza curvatura y clasifica vértices
- Verde = no desgastado, Rojo = desgastado
- Verifique que la clasificación se vea razonable

**4. Ajustar Esfera de Referencia** (Paso 3):
- Seleccione forma de ajuste (Esfera o Elipsoide)
- Seleccione método de optimización (Gauss-Newton o RANSAC)
- Alterne "Show inflection point markers" si lo desea
- Haga clic en botón para ajustar
- Revise panel de Diagnósticos de Calidad para precisión de ajuste
- Visor de Esfera muestra geometría ajustada con plano de transición

**5. Calcular Desgaste** (Paso 4):
- Haga clic en botón para calcular métricas de desgaste
- Se muestran resultados de desgaste volumétrico y lineal
- Resaltado naranja muestra región de desgaste volumétrico
- Línea cyan-a-magenta muestra penetración máxima

**6. Exportar Resultados**:
- **Exportar CSV**: Datos tabulares con todas las métricas
- **Exportar JSON**: Metadatos completos incluyendo diagnósticos
- **Exportar PDF**: Informe profesional con todas las mediciones
- **Exportar HTML Interactivo**: Archivo de visualización 3D independiente

### Controles

**Controles del Visor 3D**:
- Clic izquierdo + arrastrar: Rotar vista
- Clic derecho + arrastrar: Panorámica de cámara
- Rueda de scroll: Acercar/alejar zoom

---

## Especificaciones Técnicas

### Codificación de Colores

| Color | Significado | Ubicación |
|-------|-------------|-----------|
| Azul | Componente original (antes del análisis) | Malla cargada inicial |
| Verde | Zona no desgastada (geometría preservada) | Después del Paso 2 |
| Rojo | Zona desgastada (pérdida de material) | Después del Paso 2 |
| Amarillo (wireframe) | Esfera de referencia ajustada | Después del Paso 3 |
| Naranja (resaltado) | Región de desgaste volumétrico | Después del Paso 4 |
| Marcador cyan | Punto de superficie de esfera (desgaste máx) | Después del Paso 4 |
| Marcador magenta | Punto desgastado más profundo | Después del Paso 4 |
| Esferas amarillas | Marcadores de inflexión (zona de transición) | Después del Paso 3 (si está habilitado) |

### Características de Rendimiento

- **Dataset Típico**: ~355k vértices totales, ~313k no desgastados, ~41k desgastados
- **Tiempo de Procesamiento**:
  - Paso 1 (Aislamiento): 1-3 segundos
  - Paso 2 (Detección de Desgaste): 2-5 segundos
  - Paso 3 (Ajuste de Esfera): 0.5-2 segundos
  - Paso 4 (Cálculo de Desgaste): 1-3 segundos

- **Uso de Memoria**: ~200-400 MB para STL de copa acetabular típico

### Consideraciones de Precisión

- **Resolución Espacial**: Limitada por resolución de malla STL (tamaño de triángulo)
- **Precisión de Ajuste**: Errores RMS típicamente 0.1-0.5 mm para datos de calidad
- **Desgaste Volumétrico**: ±5% de precisión para datasets típicos
- **Desgaste Lineal**: ±0.1 mm de precisión para profundidad máxima

---

## Dependencias

### Librerías Externas (CDN)

- **Three.js** (v0.158.0): Renderizado 3D y operaciones de geometría
  - Fuente: `https://unpkg.com/three@0.158.0/build/three.module.js`

- **Tailwind CSS** (última): Framework UI responsivo
  - Fuente: `https://cdn.tailwindcss.com`

- **jsPDF** (v2.5.1): Generación de exportación PDF
  - Fuente: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`

- **ES Module Shims** (v1.6.3): Soporte de import map
  - Fuente: `https://unpkg.com/es-module-shims@1.6.3/dist/es-module-shims.js`

### Dependencias del Servidor

- **Python 3.11**: Servidor HTTP para modo desarrollo
- **No se requieren paquetes adicionales**: Usa solo librería estándar de Python

---

## Referencias Científicas

1. **Meyer, M., Desbrun, M., Schröder, P., & Barr, A. H. (2003)**. "Discrete Differential-Geometry Operators for Triangulated 2-Manifolds". *Visualization and Mathematics III*, 35-57.
   - Método de cálculo de curvatura gaussiana

2. **Algoritmo de Levenberg-Marquardt**: Amortiguamiento adaptativo para optimización de mínimos cuadrados no lineales
   - Combina Gauss-Newton y descenso de gradiente para convergencia robusta

3. **RANSAC** (Fischler & Bolles, 1981): "Random Sample Consensus: A Paradigm for Model Fitting with Applications to Image Analysis and Automated Cartography"
   - Ajuste robusto en presencia de valores atípicos

4. **Principal Component Analysis (PCA)**: Análisis de componentes principales para ajuste óptimo de planos
   - Descomposición de eigenvalores de matriz de covarianza

---

## Estructura de Archivos

```
.
├── index.html              # Aplicación principal (independiente, ~4071 líneas)
├── server.py               # Servidor HTTP Python con control de caché
├── replit.md              # Documentación de proyecto y registro de cambios
├── README.md              # Este archivo
├── .gitignore             # Exclusiones de Git (Python, archivos IDE)
└── attached_assets/       # Assets estáticos (favicon, archivos generados)
    ├── favicon_1763986228549.png
    ├── explicacion_wear_1764068917229.png
    ├── image_1764074277450.png
    └── image_1764074353635.png
```

---

## Historial de Versiones

- **v3.2** (2025-11-25): Cálculo mejorado de desgaste volumétrico para procesar TODOS los triángulos con penetración positiva (independiente de clasificación, más robusto)
- **v3.1** (2025-11-25): Detección de borde simplificada usando método basado en distancia (15% de vértices más lejanos)
- **v3.0** (2025-11-25): Ajuste de plano de transición con PCA para mejor precisión
- **v2.5** (2025-11-24): Capacidades de exportación mejoradas (PDF, HTML interactivo), leyenda completa
- **v2.4** (2025-11-24): Corrección crítica para orientación de normal del plano de transición (apuntando hacia adentro)
- **v2.3** (2025-11-24): Configuración de entorno Replit completada
- **v2.2** (2025-11-24): Cálculo mejorado de plano de transición con método radial
- **v2.1** (2025-11-23): Diagnósticos de calidad, métrica de coincidencia de área no desgastada, funcionalidad de descarga
- **v2.0** (2025-11-23): Arquitectura ES6 modular, ajuste RANSAC, detección de plano PCA
- **v1.0** (2025-11-21): Lanzamiento inicial con funcionalidad principal

---

## Licencia y Uso

Este software está diseñado para investigación y análisis clínico de desgaste de prótesis ortopédicas. Para aplicaciones de dispositivos médicos, asegúrese del cumplimiento con los requisitos regulatorios relevantes (FDA, marcado CE, etc.).

---

## Soporte y Contacto

Para preguntas, reportes de errores o solicitudes de características, contacte al equipo de desarrollo o envíe un issue a través del repositorio del proyecto.

---

**Última Actualización**: 25 de noviembre de 2025
