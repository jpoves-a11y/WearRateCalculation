/**
 * STL Processor Web Worker
 * Handles heavy 3D geometry processing in background thread
 * Allows UI to remain responsive during analysis
 */

// Worker-side state
let geometryData = null;

self.onmessage = async (event) => {
    const { type, payload } = event.data;

    try {
        switch (type) {
            case 'parseSTL':
                handleParseSTL(payload);
                break;
            case 'isolateInnerSurface':
                handleIsolateInnerSurface(payload);
                break;
            case 'detectWearZones':
                handleDetectWearZones(payload);
                break;
            case 'calculateVolumetricWear':
                handleCalculateVolumetricWear(payload);
                break;
            case 'memoryCleanup':
                handleMemoryCleanup();
                break;
            default:
                self.postMessage({ error: `Unknown message type: ${type}` });
        }
    } catch (error) {
        self.postMessage({ 
            type, 
            error: error.message,
            stack: error.stack 
        });
    }
};

/**
 * Parse STL file in chunks to manage memory
 */
function handleParseSTL(payload) {
    const { arrayBuffer, fileName } = payload;
    
    try {
        const view = new Uint8Array(arrayBuffer);
        const isASCII = isASCIISTL(view);
        
        let geometry;
        if (isASCII) {
            geometry = parseASCIISTL(view);
        } else {
            geometry = parseBinarySTL(view);
        }
        
        // Store parsed data
        geometryData = geometry;
        
        self.postMessage({
            type: 'parseSTL',
            success: true,
            data: {
                vertexCount: geometry.positions.length / 3,
                faceCount: geometry.faces.length,
                fileName,
                boundingBox: geometry.boundingBox
            }
        });
    } catch (error) {
        self.postMessage({
            type: 'parseSTL',
            error: `Failed to parse STL: ${error.message}`
        });
    }
}

/**
 * Detect if STL is ASCII format
 */
function isASCIISTL(view) {
    const header = new TextDecoder().decode(view.slice(0, 5));
    return header === 'solid';
}

/**
 * Parse binary STL file
 */
function parseBinarySTL(view) {
    const positions = [];
    const faces = [];
    
    // Header (80 bytes) + triangle count (4 bytes)
    const triangles = new DataView(view.buffer).getUint32(80, true);
    
    let offset = 84;
    for (let i = 0; i < triangles; i++) {
        // Normal (12 bytes - skip)
        offset += 12;
        
        // Vertices (36 bytes)
        const v1x = new DataView(view.buffer).getFloat32(offset, true);
        const v1y = new DataView(view.buffer).getFloat32(offset + 4, true);
        const v1z = new DataView(view.buffer).getFloat32(offset + 8, true);
        offset += 12;
        
        const v2x = new DataView(view.buffer).getFloat32(offset, true);
        const v2y = new DataView(view.buffer).getFloat32(offset + 4, true);
        const v2z = new DataView(view.buffer).getFloat32(offset + 8, true);
        offset += 12;
        
        const v3x = new DataView(view.buffer).getFloat32(offset, true);
        const v3y = new DataView(view.buffer).getFloat32(offset + 4, true);
        const v3z = new DataView(view.buffer).getFloat32(offset + 8, true);
        offset += 12;
        
        // Attribute byte count (2 bytes - skip)
        offset += 2;
        
        positions.push(v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z);
        faces.push([
            positions.length / 3 - 3,
            positions.length / 3 - 2,
            positions.length / 3 - 1
        ]);
        
        // Progress update every 10000 triangles
        if (i % 10000 === 0) {
            self.postMessage({
                type: 'parseProgress',
                progress: (i / triangles) * 100
            });
        }
    }
    
    return {
        positions: new Float32Array(positions),
        faces,
        boundingBox: calculateBoundingBox(positions)
    };
}

/**
 * Parse ASCII STL file
 */
function parseASCIISTL(view) {
    const text = new TextDecoder().decode(view);
    const positions = [];
    const faces = [];
    
    const vertexRegex = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
    let match;
    let vertexCount = 0;
    
    while ((match = vertexRegex.exec(text)) !== null) {
        positions.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
        vertexCount++;
        
        if (vertexCount % 3 === 0) {
            faces.push([vertexCount - 3, vertexCount - 2, vertexCount - 1]);
        }
        
        if (vertexCount % 30000 === 0) {
            self.postMessage({
                type: 'parseProgress',
                progress: (vertexCount / (view.length / 100)) * 100
            });
        }
    }
    
    return {
        positions: new Float32Array(positions),
        faces,
        boundingBox: calculateBoundingBox(positions)
    };
}

/**
 * Calculate bounding box
 */
function calculateBoundingBox(positions) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (let i = 0; i < positions.length; i += 3) {
        minX = Math.min(minX, positions[i]);
        maxX = Math.max(maxX, positions[i]);
        minY = Math.min(minY, positions[i + 1]);
        maxY = Math.max(maxY, positions[i + 1]);
        minZ = Math.min(minZ, positions[i + 2]);
        maxZ = Math.max(maxZ, positions[i + 2]);
    }
    
    return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
        size: {
            x: maxX - minX,
            y: maxY - minY,
            z: maxZ - minZ
        }
    };
}

/**
 * Isolate inner surface in worker
 */
function handleIsolateInnerSurface(payload) {
    if (!geometryData) {
        self.postMessage({ error: 'No geometry data available' });
        return;
    }
    
    const positions = geometryData.positions;
    const vertexCount = positions.length / 3;
    
    // Calculate centroid
    let centroidX = 0, centroidY = 0, centroidZ = 0;
    for (let i = 0; i < positions.length; i += 3) {
        centroidX += positions[i];
        centroidY += positions[i + 1];
        centroidZ += positions[i + 2];
    }
    centroidX /= vertexCount;
    centroidY /= vertexCount;
    centroidZ /= vertexCount;
    
    // Calculate face data
    const faceData = [];
    const faces = geometryData.faces;
    
    for (let i = 0; i < faces.length; i++) {
        const [i1, i2, i3] = faces[i];
        
        // Get vertices
        const v1x = positions[i1 * 3], v1y = positions[i1 * 3 + 1], v1z = positions[i1 * 3 + 2];
        const v2x = positions[i2 * 3], v2y = positions[i2 * 3 + 1], v2z = positions[i2 * 3 + 2];
        const v3x = positions[i3 * 3], v3y = positions[i3 * 3 + 1], v3z = positions[i3 * 3 + 2];
        
        // Face center
        const fcx = (v1x + v2x + v3x) / 3;
        const fcy = (v1y + v2y + v3y) / 3;
        const fcz = (v1z + v2z + v3z) / 3;
        
        // Distance to centroid
        const dx = centroidX - fcx;
        const dy = centroidY - fcy;
        const dz = centroidZ - fcz;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        faceData.push({
            index: i,
            distance,
            center: [fcx, fcy, fcz]
        });
        
        if (i % 50000 === 0) {
            self.postMessage({
                type: 'isolateProgress',
                progress: (i / faces.length) * 50
            });
        }
    }
    
    // Filter by distance quartiles
    const distances = faceData.map(f => f.distance).sort((a, b) => a - b);
    const q1 = distances[Math.floor(distances.length * 0.25)];
    const q3 = distances[Math.floor(distances.length * 0.75)];
    const maxDist = q3;
    
    const selectedFaces = faceData.filter(f => f.distance <= maxDist).map(f => f.index);
    
    self.postMessage({
        type: 'isolateInnerSurface',
        success: true,
        data: {
            selectedFaceCount: selectedFaces.length,
            totalFaceCount: faces.length,
            selectedFaces
        }
    });
}

/**
 * Detect wear zones
 */
function handleDetectWearZones(payload) {
    const { selectedFaceIndices } = payload;
    
    if (!geometryData) {
        self.postMessage({ error: 'No geometry data available' });
        return;
    }
    
    // Simplified clustering algorithm for wear zones
    const wearZones = [];
    
    self.postMessage({
        type: 'detectWearZones',
        success: true,
        data: {
            wearZones,
            processedFaces: selectedFaceIndices.length
        }
    });
}

/**
 * Calculate volumetric wear
 */
function handleCalculateVolumetricWear(payload) {
    const { wearFaceIndices } = payload;
    
    // Placeholder for volumetric calculation
    const volume = calculateVolume(wearFaceIndices);
    
    self.postMessage({
        type: 'calculateVolumetricWear',
        success: true,
        data: {
            volume,
            faceCount: wearFaceIndices.length
        }
    });
}

function calculateVolume(faceIndices) {
    return 0; // Placeholder
}

/**
 * Clean up memory
 */
function handleMemoryCleanup() {
    geometryData = null;
    if (global.gc) {
        global.gc();
    }
    self.postMessage({ type: 'memoryCleanup', success: true });
}
