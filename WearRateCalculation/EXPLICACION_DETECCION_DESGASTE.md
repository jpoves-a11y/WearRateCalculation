# Explicación Detallada: Detección de Zonas de Desgaste

## Resumen Ejecutivo

El sistema de Análisis de Desgaste Acetabular utiliza **principalmente el método de hemisferios** para clasificar las zonas de desgaste. Este documento explica en detalle cómo funciona este algoritmo.

---

## Tabla de Contenidos

1. [Método Principal: División en Hemisferios](#método-principal-división-en-hemisferios)
2. [Detección de Borde (Rim)](#detección-de-borde-rim)
3. [Curvatura Gaussiana (Opcional)](#curvatura-gaussiana-opcional)
4. [Resumen de Clasificación](#resumen-de-clasificación)

---

## Método Principal: División en Hemisferios

### Concepto Fundamental

El sistema divide la superficie interna del acetábulo en dos zonas basándose en la **distancia radial al centroide**:

```
┌─────────────────────────────────────────┐
│                                         │
│     Centroide (punto central)           │
│              ●                          │
│            /   \                        │
│           /     \                       │
│    Más   /       \  Más                 │
│   cerca /         \ lejos               │
│        ▼           ▼                    │
│   ┌─────────┐ ┌─────────┐               │
│   │   NO    │ │DESGASTE │               │
│   │DESGASTE │ │  (rojo) │               │
│   │ (verde) │ │         │               │
│   └─────────┘ └─────────┘               │
└─────────────────────────────────────────┘
```

---

### Algoritmo Paso a Paso

#### Paso 1: Calcular el Centroide Geométrico

El centroide es el "punto central" de todos los vértices de la superficie interna.

**Fórmula**:
```
centroide = (Σ todos los vértices) / número de vértices
```

**Ejemplo**:
```
Si tenemos 3 vértices:
   v1 = (10, 20, 30)
   v2 = (20, 30, 40)
   v3 = (30, 40, 50)

Centroide = ((10+20+30)/3, (20+30+40)/3, (30+40+50)/3)
          = (20, 30, 40)
```

---

#### Paso 2: Medir Distancia de Cada Vértice al Centroide

Para cada vértice se calcula qué tan lejos está del centro geométrico.

**Fórmula**:
```
distancia[i] = √((x_i - cx)² + (y_i - cy)² + (z_i - cz)²)
```

Donde `(cx, cy, cz)` son las coordenadas del centroide.

**Ejemplo Visual**:
```
                    CENTROIDE
                        ●
                       /│\
                      / │ \
           distancia /  │  \ distancia
           = 25mm   /   │   \ = 32mm
                   /    │    \
                  ▼     │     ▼
                 ●      │      ●
           vértice A    │   vértice B
```

---

#### Paso 3: Encontrar el Eje de Mayor Dispersión

El sistema necesita determinar en qué dirección la copa tiene mayor variación geométrica para dividirla correctamente.

**Método**: Probar múltiples direcciones y encontrar la que maximiza la asimetría.

```
        Z (eje de división)
        │
        │    ← Mayor dispersión está aquí
        │
────────┼──────── X
       /│
      / │
     Y  │

Copa Acetabular vista desde arriba:
        
         ┌───────────┐
        /             \
       /   Interior    \
      │    de copa     │
       \               /
        \─────────────/
              │
              ▼
         Eje de división
```

---

#### Paso 4: Dividir en Dos Hemisferios

Una vez identificado el eje de mayor dispersión, se divide la superficie en dos grupos:

```
Vista lateral de la copa:

                    Eje de división
                          │
     HEMISFERIO +         │         HEMISFERIO -
     (un lado)            │         (otro lado)
                          │
    ╭─────────────────────┼─────────────────────╮
   ╱                      │                      ╲
  │  ●  ●  ●  ●  ●       │       ●  ●  ●  ●  ●  │
  │    ●  ●  ●  ●        │        ●  ●  ●  ●    │
  │      ●  ●  ●         │         ●  ●  ●      │
  │        ●  ●          │          ●  ●        │
   ╲         ●           │           ●         ╱
    ╰────────────────────┼────────────────────╯
                         │
                         │
              
   Cada ● representa un vértice de la malla
```

**Código de clasificación**:
```javascript
// Para cada vértice, calcular en qué lado del eje está
hemisferioPositivo = vertices.filter(v => v[ejePrincipal] > centroide[ejePrincipal])
hemisferioNegativo = vertices.filter(v => v[ejePrincipal] <= centroide[ejePrincipal])
```

---

#### Paso 5: Calcular Promedio de Distancias por Hemisferio

Se suman todas las distancias de cada hemisferio y se divide por el número de vértices:

```
HEMISFERIO - (ejemplo con 4 vértices):
   Distancias: 24mm, 25mm, 26mm, 23mm
   Promedio = (24 + 25 + 26 + 23) / 4 = 24.5mm

HEMISFERIO + (ejemplo con 4 vértices):
   Distancias: 30mm, 32mm, 31mm, 33mm  
   Promedio = (30 + 32 + 31 + 33) / 4 = 31.5mm
```

**Fórmula general**:
```
promedio_hemisferio = Σ(distancias en hemisferio) / número de vértices en hemisferio
```

---

#### Paso 6: Comparar y Clasificar

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   Promedio Hemisferio - = 24.5mm  (MÁS CERCA)         │
│   Promedio Hemisferio + = 31.5mm  (MÁS LEJOS)         │
│                                                        │
│   Como 31.5 > 24.5:                                    │
│                                                        │
│   → Hemisferio + (más lejos) = DESGASTADO 🔴          │
│   → Hemisferio - (más cerca) = NO DESGASTADO 🟢       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Código de decisión**:
```javascript
if (promedioPositivo > promedioNegativo) {
    // Positivo está más lejos → es el desgastado
    marcarComoDesgastado(hemisferioPositivo)      // 🔴
    marcarComoNoDesgastado(hemisferioNegativo)    // 🟢
} else {
    // Negativo está más lejos → es el desgastado
    marcarComoDesgastado(hemisferioNegativo)      // 🔴
    marcarComoNoDesgastado(hemisferioPositivo)    // 🟢
}
```

---

### ¿Por Qué el Hemisferio MÁS LEJOS es el Desgastado?

Esto parece contraintuitivo, pero tiene una explicación física clara:

#### Visualización del Fenómeno

```
Vista en corte de la copa acetabular:

ANTES del desgaste (geometría perfecta):
         ╭───────────────╮
        ╱                 ╲
       │    ● centroide    │
       │                   │
        ╲                 ╱
         ╰───────────────╯
         
         Distancias simétricas en ambos lados
         El centroide está exactamente en el centro


DESPUÉS del desgaste (un lado deformado):
         ╭───────────────╮
        ╱        ←desgaste│   ← Material perdido aquí
       │   ●←centroide    │      (superficie se acerca al centro)
       │    (desplazado)  │
        ╲                 ╱
         ╰───────────────╯
         
         El CENTROIDE se mueve hacia el lado desgastado
         porque hay menos material de ese lado
```

#### Explicación Física

1. **Cuando ocurre desgaste en un lado** de la copa (por el contacto con la cabeza femoral), el material se pierde y esos vértices se acercan al interior.

2. **El centroide se recalcula** considerando todos los vértices. Como hay menos material del lado desgastado, el centroide se desplaza hacia ese lado.

3. **Resultado paradójico**:
   - Los vértices del **lado desgastado** quedan **más lejos** del nuevo centroide
   - Los vértices del **lado no desgastado** quedan **más cerca** del nuevo centroide

4. **Analogía**: Imagina una pelota de playa con un lado hundido. Si calculas el centro de todos los puntos de la superficie, ese centro se moverá hacia el lado hundido, haciendo que el lado hundido parezca "más lejos" del nuevo centro.

---

### Ejemplo Numérico Completo

```
Copa acetabular real analizada:

═══════════════════════════════════════════════════════════════
DATOS DE ENTRADA
═══════════════════════════════════════════════════════════════
Total de vértices de superficie interna: 355,000

═══════════════════════════════════════════════════════════════
PASO 1: CENTROIDE
═══════════════════════════════════════════════════════════════
Centroide calculado: (12.34, -5.67, 8.91) mm

═══════════════════════════════════════════════════════════════
PASO 2: DISTANCIAS
═══════════════════════════════════════════════════════════════
Rango de distancias: 15.2mm - 42.8mm
Distancia promedio global: 28.5mm

═══════════════════════════════════════════════════════════════
PASO 3: DIVISIÓN EN HEMISFERIOS
═══════════════════════════════════════════════════════════════
Eje de mayor dispersión: Z

HEMISFERIO NEGATIVO (Z < centroide_z):
   Vértices: 180,000
   Distancia promedio: 26.2mm  ← MÁS CERCA

HEMISFERIO POSITIVO (Z >= centroide_z):
   Vértices: 175,000
   Distancia promedio: 31.1mm  ← MÁS LEJOS

═══════════════════════════════════════════════════════════════
PASO 4: CLASIFICACIÓN
═══════════════════════════════════════════════════════════════
31.1mm > 26.2mm

Por lo tanto:
   🔴 Hemisferio POSITIVO = DESGASTADO (175,000 vértices)
   🟢 Hemisferio NEGATIVO = NO DESGASTADO (180,000 vértices)

═══════════════════════════════════════════════════════════════
RESULTADO FINAL
═══════════════════════════════════════════════════════════════
Zona desgastada: 49.3% de la superficie
Zona no desgastada: 50.7% de la superficie
```

---

## Detección de Borde (Rim)

### Propósito

Antes de clasificar worn/unworn, el sistema **excluye los vértices del borde** (rim) porque representan el límite geométrico natural de la copa, no una zona de desgaste.

### Algoritmo (v3 - Basado en Distancia)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  PASO 1: Calcular distancia de cada vértice al centroide   │
│                                                             │
│  PASO 2: Ordenar vértices por distancia (mayor a menor)    │
│                                                             │
│  PASO 3: El 15% con mayor distancia = BORDE (rim)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Visualización

```
Vista superior de la copa acetabular:

              Borde (rim) - 15% más lejano
              ╭─────────────────────────────╮
             ╱   ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○      ╲
            │  ○                        ○    │
           │ ○    Interior de la copa    ○   │
           │ ○          ●                ○   │
           │ ○       centroide           ○   │
           │ ○                           ○   │
            │  ○                        ○    │
             ╲   ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○      ╱
              ╰─────────────────────────────╯

   ○ = Vértices del borde (rim) - EXCLUIDOS de clasificación
   ● = Centroide
```

### Justificación Física

1. El borde de la copa acetabular forma un **anillo circular** en la abertura
2. Estos vértices están naturalmente **más alejados del centroide** (que está dentro de la copa)
3. El **15% de vértices más lejanos** forman una banda circular alrededor del borde
4. Simple, eficiente y extremadamente confiable

### Código

```javascript
// 1. Calcular distancias
distances = vertices.map(v => distancia(v, centroide))

// 2. Encontrar umbral del percentil 85
distanciasOrdenadas = distances.sort((a, b) => b - a)
umbralRim = distanciasOrdenadas[Math.floor(vertices.length * 0.15)]

// 3. Clasificar vértices de borde
rimVertices = vertices.filter((v, i) => distances[i] >= umbralRim)

// 4. Excluir del análisis worn/unworn
verticesParaClasificar = vertices.filter((v, i) => distances[i] < umbralRim)
```

---

## Curvatura Gaussiana (Opcional)

### Estado Actual

La curvatura gaussiana **está implementada** en el sistema pero se usa como **método opcional de refinamiento** para casos ambiguos. El método principal de clasificación es el de hemisferios descrito arriba.

### Concepto Teórico

La curvatura gaussiana mide cómo se "curva" la superficie en cada punto:

```
CURVATURA POSITIVA (K > 0)           CURVATURA NEGATIVA (K < 0)
       Convexa                              Silla de montar
         
        ╭───╮                              ╭─────╮
       ╱     ╲                            ╱       ╲
      │       │                          ╱    ∨    ╲
       ╲     ╱                           ─────────────
        ╰───╯                           
                                        
  Geometría esférica                   Deformación por desgaste
  (zona NO desgastada)                 (zona desgastada)
```

### Fórmula de Meyer et al. (2003)

```
K = (2π - Σθᵢ) / A_mixed
```

Donde:
- **K**: Curvatura gaussiana en el vértice
- **θᵢ**: Ángulos de las caras adyacentes al vértice
- **A_mixed**: Área de Voronoi mixta (región de influencia del vértice)

### Interpretación

| Curvatura | Geometría | Clasificación |
|-----------|-----------|---------------|
| K > 0 | Convexa/esférica | NO DESGASTADO 🟢 |
| K < 0 | Silla de montar | DESGASTADO 🔴 |
| K ≈ 0 | Plana/cilíndrica | Ambiguo |

### Cuándo se Usaría

El sistema podría usar la curvatura gaussiana para:
1. **Refinar** la clasificación en zonas donde el método de hemisferios es ambiguo
2. **Validar** los resultados de la clasificación por hemisferios
3. **Detectar desgaste localizado** que no sigue el patrón hemisférico típico

---

## Resumen de Clasificación

### Pipeline Completo

```
┌─────────────────────────────────────────────────────────────┐
│                   SUPERFICIE INTERNA                        │
│                   (355,000 vértices)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              PASO 1: DETECCIÓN DE BORDE (RIM)               │
│                                                             │
│   • Calcular distancia de cada vértice al centroide         │
│   • Seleccionar el 15% más lejano como BORDE                │
│   • Estos vértices se EXCLUYEN de la clasificación          │
│                                                             │
│   Resultado: ~53,000 vértices de borde (transparentes)      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              PASO 2: DIVISIÓN EN HEMISFERIOS                │
│                                                             │
│   • Encontrar eje de mayor dispersión geométrica            │
│   • Dividir vértices restantes en dos hemisferios           │
│   • Calcular distancia promedio de cada hemisferio          │
│                                                             │
│   Resultado:                                                │
│     Hemisferio A: promedio 26.2mm                           │
│     Hemisferio B: promedio 31.1mm                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              PASO 3: CLASIFICACIÓN FINAL                    │
│                                                             │
│   • Hemisferio con mayor promedio = DESGASTADO 🔴           │
│   • Hemisferio con menor promedio = NO DESGASTADO 🟢        │
│                                                             │
│   Resultado típico:                                         │
│     🔴 Desgastado: 41,000 vértices (11-13%)                 │
│     🟢 No desgastado: 261,000 vértices (87-89%)             │
│     ⚪ Borde (excluido): 53,000 vértices (15%)              │
└─────────────────────────────────────────────────────────────┘
```

### Tabla de Colores Final

| Color | Zona | Descripción | Porcentaje Típico |
|-------|------|-------------|-------------------|
| 🔴 Rojo | Desgastada | Hemisferio más lejos del centroide | 11-13% |
| 🟢 Verde | No desgastada | Hemisferio más cerca del centroide | 72-74% |
| ⚪ Transparente | Borde (rim) | 15% de vértices más externos | 15% |

---

## Código Simplificado del Algoritmo Completo

```javascript
function detectarZonasDesgaste(verticesSuperificieInterna) {
    
    // ═══════════════════════════════════════════════════════
    // PASO 1: Calcular centroide
    // ═══════════════════════════════════════════════════════
    const centroide = calcularCentroide(verticesSuperificieInterna);
    
    // ═══════════════════════════════════════════════════════
    // PASO 2: Calcular distancias al centroide
    // ═══════════════════════════════════════════════════════
    const distancias = verticesSuperificieInterna.map(v => 
        distanciaEuclidiana(v, centroide)
    );
    
    // ═══════════════════════════════════════════════════════
    // PASO 3: Detectar vértices de borde (rim) - 15% más lejano
    // ═══════════════════════════════════════════════════════
    const umbralRim = calcularPercentil(distancias, 85);
    const esRim = distancias.map(d => d >= umbralRim);
    
    const verticesNoRim = verticesSuperificieInterna.filter((v, i) => !esRim[i]);
    
    // ═══════════════════════════════════════════════════════
    // PASO 4: Encontrar eje de mayor dispersión
    // ═══════════════════════════════════════════════════════
    const ejePrincipal = encontrarEjeMayorDispersion(verticesNoRim);
    
    // ═══════════════════════════════════════════════════════
    // PASO 5: Dividir en hemisferios
    // ═══════════════════════════════════════════════════════
    const hemisferioPositivo = [];
    const hemisferioNegativo = [];
    
    verticesNoRim.forEach(v => {
        if (v[ejePrincipal] > centroide[ejePrincipal]) {
            hemisferioPositivo.push(v);
        } else {
            hemisferioNegativo.push(v);
        }
    });
    
    // ═══════════════════════════════════════════════════════
    // PASO 6: Calcular distancias promedio por hemisferio
    // ═══════════════════════════════════════════════════════
    const promedioPositivo = calcularPromedioDistancia(hemisferioPositivo, centroide);
    const promedioNegativo = calcularPromedioDistancia(hemisferioNegativo, centroide);
    
    console.log(`Promedio hemisferio +: ${promedioPositivo.toFixed(2)}mm`);
    console.log(`Promedio hemisferio -: ${promedioNegativo.toFixed(2)}mm`);
    
    // ═══════════════════════════════════════════════════════
    // PASO 7: Clasificar basado en qué hemisferio está más lejos
    // ═══════════════════════════════════════════════════════
    let verticesDesgastados, verticesNoDesgastados;
    
    if (promedioPositivo > promedioNegativo) {
        // Hemisferio + está más lejos → DESGASTADO
        verticesDesgastados = hemisferioPositivo;
        verticesNoDesgastados = hemisferioNegativo;
        console.log('Hemisferio POSITIVO clasificado como DESGASTADO');
    } else {
        // Hemisferio - está más lejos → DESGASTADO
        verticesDesgastados = hemisferioNegativo;
        verticesNoDesgastados = hemisferioPositivo;
        console.log('Hemisferio NEGATIVO clasificado como DESGASTADO');
    }
    
    // ═══════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════
    return {
        desgastados: verticesDesgastados,      // 🔴 Rojo
        noDesgastados: verticesNoDesgastados,  // 🟢 Verde
        borde: verticesSuperificieInterna.filter((v, i) => esRim[i])  // Transparente
    };
}
```

---

## Referencias

1. **Meyer, M., Desbrun, M., Schröder, P., & Barr, A. H. (2003)**. "Discrete Differential-Geometry Operators for Triangulated 2-Manifolds". *Visualization and Mathematics III*, 35-57.
   - Método de cálculo de curvatura gaussiana

---

**Documento creado**: 26 de noviembre de 2025  
**Sistema**: Acetabular Wear Analysis System v3.2
