# Sistema de Análisis de Desgaste Acetabular

## Descripción General

El **Sistema de Análisis de Desgaste Acetabular** es una aplicación web de grado profesional diseñada para el análisis cuantitativo preciso del desgaste volumétrico y lineal en componentes protésicos acetabulares de cadera. Esta aplicación HTML5 independiente procesa archivos de malla STL para proporcionar visualización 3D completa, detección automática de zonas de desgaste, ajuste de geometría de referencia y cálculos precisos de medición de desgaste.

### Versión Actual: v4.0

**Fecha de última actualización**: Noviembre 2025

### Características Principales

- **Procesamiento de Archivos STL 3D**: Soporta formatos STL binarios y ASCII
- **Aislamiento Automático de Superficie Interna**: Filtrado geométrico robusto con análisis de componentes conectados
- **Detección de Zonas de Desgaste**: Análisis dual-sphere con clustering basado en rayos
- **Detección de Borde (Rim)**: Algoritmo basado en distancias que identifica el 15% de vértices más alejados del centroide
- **Métodos Duales de Ajuste**: 
  - Gauss-Newton + Levenberg-Marquardt (convergencia rápida)
  - RANSAC + refinamiento LM (robusto contra valores atípicos)
- **Restricción a Radio Comercial**: Opción para ajustar a radios comerciales estándar (14/16/18/20mm)
- **Plano de Transición Preciso**: Ecuación del plano corregida (n·x - d = 0) para integración volumétrica exacta
- **Métricas Completas**: Desgaste volumétrico, profundidad de penetración lineal y diagnósticos de calidad
- **Visualización Triple**: Tres visores 3D sincronizados para análisis completo
- **Exportación Profesional**: Informes CSV, JSON, PDF y visualizaciones HTML interactivas

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Pipeline de Análisis](#pipeline-de-análisis)
3. [Algoritmos Clave](#algoritmos-clave)
4. [Ecuación del Plano de Transición](#ecuación-del-plano-de-transición)
5. [Cálculo Volumétrico](#cálculo-volumétrico)
6. [Visualización Triple](#visualización-triple)
7. [Diagnósticos de Calidad](#diagnósticos-de-calidad)
8. [Instrucciones de Uso](#instrucciones-de-uso)
9. [Especificaciones Técnicas](#especificaciones-técnicas)

---

## Arquitectura del Sistema

### Stack Tecnológico

- **Frontend**: Aplicación HTML5 independiente con JavaScript ES6 modular
- **Renderizado 3D**: Three.js (v0.158.0) para visualización basada en WebGL
- **Framework UI**: Tailwind CSS para interfaz profesional y responsiva
- **Servidor**: Servidor HTTP Python 3.11 con encabezados de control de caché (modo desarrollo)
- **Despliegue**: Alojamiento de sitio estático (modo producción)

### Diseño Modular

La aplicación está organizada en módulos de servicio especializados:

#### **GeometryService**
- Cálculo de áreas de triángulos
- Operaciones vectoriales
- Grafos de adyacencia

#### **CurvatureAnalyzer**
- Curvatura gaussiana discreta (Meyer et al. 2003)
- Área de Voronoi mixta

#### **PCAService**
- Análisis de componentes principales
- Ajuste de planos por mínimos cuadrados

#### **FittingService**
- Ajuste de esferas/elipsoides
- Métodos Gauss-Newton y RANSAC
- Restricción a radio comercial

---

## Pipeline de Análisis

El sistema guía a los usuarios a través de un flujo de trabajo secuencial de 4 pasos:

### Paso 1: Aislar Superficie Interna

**Objetivo**: Extraer la superficie articular interna cóncava de la copa acetabular.

**Algoritmo**:
1. Análisis de vectores normales (filtro: dot > 0.5)
2. Filtrado por distancia (cuartiles Q1-Q3)
3. Análisis de componentes conectados (BFS)
4. Selección del componente más grande

**Resultado típico**: ~118,000 caras internas de ~355,000 vértices únicos

### Paso 2: Detectar Zonas de Desgaste

**Objetivo**: Clasificar vértices como desgastados o no desgastados.

**Algoritmo Dual-Sphere (v3.5)**:
1. Ajuste de esferas comerciales (14/16/18/20mm) a cada cluster
2. Clasificación por RMS residual al radio comercial más cercano
3. Cluster con menor RMS = zona no desgastada

**Detección de Rim Boundary**:
- 15% de vértices más alejados del centroide
- Almacenados para definir el plano de transición

### Paso 3: Ajustar Esfera de Referencia

**Objetivo**: Reconstruir la geometría esférica ideal no desgastada.

**Métodos disponibles**:
- **Gauss-Newton + LM**: Convergencia rápida (5-10 iteraciones)
- **RANSAC + LM**: Robusto contra outliers

**Restricción a Radio Comercial**:
- Detecta automáticamente el radio comercial más cercano
- Opción para forzar ajuste a 14, 16, 18 o 20mm

**Pre-filtrado de Vértices (v3.6)**:
- Excluye vértices de transición (adyacentes a zona desgastada)
- Mejora precisión del ajuste

### Paso 4: Calcular Desgaste

**Objetivo**: Cuantificar el desgaste volumétrico y lineal.

**Cálculo Volumétrico**:
- Integra sobre TODOS los triángulos de superficie interna
- Clipping por plano de transición
- Solo cuenta penetración positiva (material removido)

**Cálculo Lineal**:
- Profundidad de penetración perpendicular
- Métricas: media, máxima, mínima

---

## Ecuación del Plano de Transición

### Definición Matemática (v4.0 - Corregida)

El plano de transición separa la región de integración volumétrica del resto de la superficie.

**Ecuación del plano**:
```
n · x - d = 0
```

Donde:
- **n**: Vector normal unitario (apunta hacia el centro de la esfera)
- **x**: Punto en el espacio 3D
- **d**: Distancia con signo desde el origen = n · point

**Cálculo de d**:
```javascript
const d = planeNormal.dot(planePoint);  // d = n · point (positivo)
```

**Distancia de un punto al plano**:
```javascript
function distanceToPlane(point, normal, d) {
    return normal.dot(point) - d;
}
```

**Interpretación**:
- **Distancia < 0**: Punto DENTRO de la región acotada (hacia el centro)
- **Distancia > 0**: Punto FUERA de la región acotada
- **Distancia = 0**: Punto exactamente en el plano

### Verificación de Consistencia

El sistema verifica que el plano pasa por su punto de definición:
```javascript
const testDist = planeNormal.dot(planePoint) - d;
// testDist debe ser ≈ 0 (precisión de punto flotante)
```

**Logging de debug**:
```
DEBUG: Distance from plane point to plane = 0.0000000000 (should be ~0)
```

---

## Cálculo Volumétrico

### Metodología (v4.0)

**Principio**: Integrar el volumen entre la esfera ajustada y la superficie STL real dentro de la región acotada por el plano de transición.

**Algoritmo paso a paso**:

1. **Iterar sobre triángulos de superficie interna** (de Paso 1)

2. **Clipear cada triángulo por el plano de transición**:
   - Si todos los vértices están dentro: usar triángulo completo
   - Si algunos están fuera: subdividir en sub-triángulos
   - Si todos están fuera: omitir triángulo

3. **Calcular penetración para cada vértice**:
   ```javascript
   const distToCenter = vertex.distanceTo(sphereCenter);
   const penetration = distToCenter - sphereRadius;
   ```
   - **penetration > 0**: Superficie más lejos del centro que la esfera = material removido
   - **penetration ≤ 0**: Superficie más cerca del centro que la esfera = sin desgaste

4. **Integrar solo penetraciones positivas**:
   ```javascript
   const avgPenetration = (pen1 + pen2 + pen3) / 3.0;
   if (avgPenetration > 0) {
       const area = triangleArea(tri.p1, tri.p2, tri.p3);
       volumetricWear += avgPenetration * area;
   }
   ```

5. **Suma con precisión Kahan** para minimizar error de punto flotante

### Función de Clipping de Triángulos (v4.0)

```javascript
function clipTriangleByPlane(p1, p2, p3, planeNormal, planeD) {
    // Distancia = n·x - d
    const d1 = distanceToPlane(p1, planeNormal, planeD);
    const d2 = distanceToPlane(p2, planeNormal, planeD);
    const d3 = distanceToPlane(p3, planeNormal, planeD);
    
    // Clasificar: inside (≤ 0) vs outside (> 0)
    const inside1 = d1 <= 0;
    const inside2 = d2 <= 0;
    const inside3 = d3 <= 0;
    
    const insideCount = (inside1 ? 1 : 0) + (inside2 ? 1 : 0) + (inside3 ? 1 : 0);
    
    // Casos:
    // 3 inside: retornar triángulo completo
    // 0 inside: retornar vacío
    // 1 o 2 inside: subdividir en sub-triángulos
}
```

---

## Visualización Triple

El sistema utiliza tres visores 3D sincronizados:

### Visor 1: Análisis Principal
- Muestra la malla STL con zonas codificadas por color
- **Verde**: Zona no desgastada
- **Rojo**: Zona desgastada
- **Azul**: Superficie original
- Controles de órbita interactivos

### Visor 2: Esfera de Referencia
- Esfera ajustada (wireframe dorado)
- Esfera desgastada (wireframe rojo)
- Plano de transición
- Marcadores de puntos de inflexión

### Visor 3: Volumen de Desgaste (v4.0)
- STL original transparente
- **Prismas volumétricos naranja** (40% transparencia)
- Representación exacta del volumen calculado
- Permite ver a través de la visualización

**Características del visor volumétrico**:
- Opacidad del volumen de desgaste: 60% (40% transparente)
- Wireframe superpuesto para percepción de profundidad
- Renderizado ordenado para transparencia correcta

---

## Diagnósticos de Calidad

### Métricas de Ajuste de Esfera

| Métrica | Descripción | Valor Ideal |
|---------|-------------|-------------|
| RMS Error | Error cuadrático medio | < 0.15 mm |
| Iteraciones | Convergencia del algoritmo | < 10 |
| Inliers | Puntos dentro de tolerancia | > 90% |
| Residual Max | Máxima desviación | < 0.3 mm |

### Métricas de Desgaste

| Métrica | Unidad | Descripción |
|---------|--------|-------------|
| Desgaste Volumétrico | mm³ | Volumen total de material removido |
| Penetración Media | mm | Profundidad promedio de desgaste |
| Penetración Máxima | mm | Punto de máximo desgaste |
| Penetración Mínima | mm | Desgaste mínimo en zona desgastada |

### Validación del Plano de Transición

El sistema reporta:
- Distancia promedio de puntos rim al plano (debe ser < 0.1 mm)
- Distancia máxima de puntos rim al plano
- Verificación de que el plano pasa por su punto de definición

---

## Instrucciones de Uso

### 1. Cargar Archivo STL
- Click en "Upload STL" o arrastrar archivo
- Formatos soportados: STL binario y ASCII

### 2. Ejecutar Pipeline Secuencial
1. **Aislar Superficie Interna**: Click en botón correspondiente
2. **Detectar Zonas de Desgaste**: Esperar clasificación automática
3. **Ajustar Esfera de Referencia**: Seleccionar método (Gauss-Newton o RANSAC)
4. **Calcular Desgaste**: Ver resultados volumétricos y lineales

### 3. Analizar Resultados
- Revisar panel de diagnósticos
- Examinar visualizaciones 3D
- Verificar métricas de calidad

### 4. Exportar
- **CSV**: Datos tabulares
- **JSON**: Estructura completa
- **PDF**: Informe profesional
- **HTML**: Visualización interactiva

---

## Especificaciones Técnicas

### Requisitos del Sistema
- Navegador moderno con WebGL (Chrome, Firefox, Edge, Safari)
- 4GB RAM mínimo recomendado
- GPU con soporte WebGL 2.0

### Límites de Procesamiento
- Tamaño máximo de archivo STL: 100MB
- Vértices máximos: 500,000 (recomendado < 400,000)
- Triángulos máximos: 250,000 (recomendado < 200,000)

### Precisión Numérica
- Coordenadas: precisión de punto flotante de 64 bits
- Suma volumétrica: algoritmo Kahan para minimizar error
- Tolerancia de convergencia: 1e-6 mm

---

## Dependencias Externas

- **Three.js v0.158.0**: Renderizado 3D WebGL
- **Tailwind CSS**: Framework de diseño UI
- **jsPDF**: Generación de informes PDF
- **Python 3.11**: Servidor HTTP de desarrollo

---

## Historial de Versiones

### v4.0 (Noviembre 2025)
- **CRÍTICO**: Corregida ecuación del plano de transición (n·x - d = 0)
- **CRÍTICO**: Función de clipping usa clasificación inside/outside consistente
- Visor volumétrico con 40% de transparencia
- Logging de debug para verificación del plano
- Pre-filtrado de vértices de transición mejorado

### v3.8
- Integración volumétrica sobre triángulos filtrados de Paso 1
- Consistencia numérica-visual perfecta

### v3.6
- Pre-filtrado de vértices de transición para ajuste de esfera
- Almacenamiento explícito de triángulos filtrados

### v3.5
- Clasificación dual-sphere basada en RMS a radio comercial
- Detección automática de radio comercial más cercano

### v3.4
- Plano de transición basado en puntos rim boundary
- PCA para ajuste de plano

### v3.3
- Análisis de asimetría hemisférica
- Detección de puntos de inflexión

---

## Referencia Científica

Meyer, M., Desbrun, M., Schröder, P., & Barr, A. H. (2003). Discrete differential-geometry operators for triangulated 2-manifolds. In *Visualization and Mathematics III* (pp. 35-57). Springer.

---

## Licencia

Sistema propietario para análisis de prótesis médicas.

---

## Contacto

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.
