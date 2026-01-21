#!/usr/bin/env python3
"""
Apply optimizations to index.html:
1. Adjust BasicMaterial threshold from 10M to 30M vertices
2. Add chunked processing to isolate inner surface
"""

import re

filepath = r"c:\Users\jpove\OneDrive\Escritorio\DOCTORADO\WEAR_RATE_SOFTWARE\SOFT_21012026\WearRateCalculation\index.html"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Change 10M threshold to 30M and add log
content = content.replace(
    'const usesBasicMaterial = vertexCount > 10000000; // 10M vertices threshold',
    'const usesBasicMaterial = vertexCount > 30000000; // 30M vertices threshold (allows Phong for 20M models)'
)

content = content.replace(
    '''if (usesBasicMaterial) {
                    console.log(`[MESH] Using BasicMaterial for ${vertexCount.toLocaleString()} vertices (reduces GPU load)`);
                }
                ''',
    '''if (usesBasicMaterial) {
                    console.log(`[MESH] Using BasicMaterial for ${vertexCount.toLocaleString()} vertices (reduces GPU load)`);
                } else {
                    console.log(`[MESH] Using PhongMaterial with lighting for ${vertexCount.toLocaleString()} vertices`);
                }
                '''
)

# Fix 2: Add console log for centroid calculation
content = content.replace(
    '''// Step 1: Calculate geometric centroid
            const centroid = new THREE.Vector3(0, 0, 0);''',
    '''// Step 1: Calculate geometric centroid
            console.log('[ISOLATE] Step 1: Calculating centroid...');
            const centroid = new THREE.Vector3(0, 0, 0);'''
)

# Fix 3: Add chunked processing to face loop
content = content.replace(
    '''// Step 2: Calculate distances to centroid for all faces
            const faceCount = positions.length / 9;
            const faceData = [];
            
            for (let i = 0; i < positions.length; i += 9) {''',
    '''// Step 2: Calculate distances to centroid for all faces (CHUNKED)
            console.log('[ISOLATE] Step 2: Processing faces in chunks...');
            const faceCount = positions.length / 9;
            const faceData = [];
            const chunkSize = 100000; // Process 100k faces at a time
            let processedFaces = 0;
            
            for (let i = 0; i < positions.length; i += 9) {
                // Yield control every chunkSize faces to prevent UI freeze
                if (processedFaces > 0 && processedFaces % chunkSize === 0) {
                    updateStatus('processing', `Processing faces: ${processedFaces.toLocaleString()}/${faceCount.toLocaleString()} (${(processedFaces/faceCount*100).toFixed(1)}%)`);
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                '''
)

# Fix 4: Add counter increment at end of face loop
content = content.replace(
    '''faceData.push({
                    index: i / 9,
                    vertices: [v1, v2, v3],
                    indices: [i / 3, i / 3 + 1, i / 3 + 2],
                    dot,
                    distance: distanceToCentroid,
                    center: faceCenter
                });
            }
            
            // Step 3: Filter inner surface using multiple criteria''',
    '''faceData.push({
                    index: i / 9,
                    vertices: [v1, v2, v3],
                    indices: [i / 3, i / 3 + 1, i / 3 + 2],
                    dot,
                    distance: distanceToCentroid,
                    center: faceCenter
                });
                
                processedFaces++;
            }
            
            console.log(`[ISOLATE] Processed ${faceCount.toLocaleString()} faces`);
            
            // Step 3: Filter inner surface using multiple criteria
            console.log('[ISOLATE] Step 3: Filtering inner surface candidates...');'''
)

# Fix 5: Add log for building triangle set
content = content.replace(
    '''// CRITICAL FIX v3.6: Store filtered inner surface triangles for consistent use
            // This ensures volumetric calculation and visualization use the exact same triangle set
            state.filteredInnerTriangles = [];''',
    '''// CRITICAL FIX v3.6: Store filtered inner surface triangles for consistent use
            // This ensures volumetric calculation and visualization use the exact same triangle set
            console.log('[ISOLATE] Step 6: Building final triangle set...');
            state.filteredInnerTriangles = [];'''
)

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Applied all fixes:")
print("  1. BasicMaterial threshold: 10M → 30M vertices")
print("  2. Added chunked processing (100k faces/chunk)")
print("  3. Added progress updates and logs")
print("  4. PhongMaterial now used for 20M vertex models")
