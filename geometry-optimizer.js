/**
 * Memory Management & Optimization Utilities
 * Helps handle large 3D models efficiently
 */

class MemoryManager {
    constructor() {
        this.pools = new Map();
        this.maxPoolSize = 50;
        this.totalAllocated = 0;
    }

    /**
     * Get or create a buffer pool for efficient allocation
     */
    allocateFloat32Array(size) {
        const key = size;
        if (!this.pools.has(key)) {
            this.pools.set(key, []);
        }

        const pool = this.pools.get(key);
        let buffer;

        if (pool.length > 0) {
            buffer = pool.pop();
        } else {
            buffer = new Float32Array(size);
            this.totalAllocated += size * 4; // bytes
        }

        return buffer;
    }

    /**
     * Release buffer back to pool
     */
    releaseFloat32Array(buffer) {
        const key = buffer.length;
        if (!this.pools.has(key)) {
            this.pools.set(key, []);
        }

        const pool = this.pools.get(key);
        if (pool.length < this.maxPoolSize) {
            pool.push(buffer);
        }
    }

    /**
     * Get memory usage in MB
     */
    getMemoryUsage() {
        return (this.totalAllocated / (1024 * 1024)).toFixed(2);
    }

    /**
     * Clear all pools and force garbage collection
     */
    clear() {
        this.pools.clear();
        this.totalAllocated = 0;
        if (typeof gc !== 'undefined') {
            gc();
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        let totalBuffers = 0;
        let poolDetails = [];

        this.pools.forEach((buffers, size) => {
            totalBuffers += buffers.length;
            poolDetails.push({
                size,
                count: buffers.length,
                bytes: size * buffers.length * 4
            });
        });

        return {
            poolCount: this.pools.size,
            totalBuffers,
            totalAllocatedMB: this.getMemoryUsage(),
            pools: poolDetails
        };
    }
}

/**
 * Geometry compressor using quantization
 * Reduces memory footprint without significant quality loss
 */
class GeometryCompressor {
    /**
     * Quantize positions to reduce precision
     * Trades float32 accuracy for ~50% size reduction
     */
    static quantizePositions(positions, quantizationBits = 16) {
        const min = { x: Infinity, y: Infinity, z: Infinity };
        const max = { x: -Infinity, y: -Infinity, z: -Infinity };

        // Find bounds
        for (let i = 0; i < positions.length; i += 3) {
            min.x = Math.min(min.x, positions[i]);
            max.x = Math.max(max.x, positions[i]);
            min.y = Math.min(min.y, positions[i + 1]);
            max.y = Math.max(max.y, positions[i + 1]);
            min.z = Math.min(min.z, positions[i + 2]);
            max.z = Math.max(max.z, positions[i + 2]);
        }

        const range = {
            x: max.x - min.x,
            y: max.y - min.y,
            z: max.z - min.z
        };

        const maxQuantized = (1 << quantizationBits) - 1;

        // Quantize
        const quantized = new Uint16Array(positions.length * 3);
        for (let i = 0; i < positions.length; i += 3) {
            quantized[i] = Math.round((positions[i] - min.x) / range.x * maxQuantized);
            quantized[i + 1] = Math.round((positions[i + 1] - min.y) / range.y * maxQuantized);
            quantized[i + 2] = Math.round((positions[i + 2] - min.z) / range.z * maxQuantized);
        }

        return {
            quantized,
            bounds: { min, max, range },
            info: {
                originalSize: (positions.length * 4) / (1024 * 1024),
                compressedSize: (quantized.length * 2) / (1024 * 1024),
                compressionRatio: ((positions.length * 4) / (quantized.length * 2)).toFixed(2) + 'x'
            }
        };
    }

    /**
     * Dequantize positions back to float32
     */
    static dequantizePositions(quantized, bounds) {
        const { min, max, range } = bounds;
        const maxQuantized = (1 << 16) - 1;

        const positions = new Float32Array(quantized.length);
        for (let i = 0; i < quantized.length; i += 3) {
            positions[i] = (quantized[i] / maxQuantized) * range.x + min.x;
            positions[i + 1] = (quantized[i + 1] / maxQuantized) * range.y + min.y;
            positions[i + 2] = (quantized[i + 2] / maxQuantized) * range.z + min.z;
        }

        return positions;
    }

    /**
     * Simplify mesh by removing duplicate vertices
     */
    static removeDuplicateVertices(positions, tolerance = 0.001) {
        const uniqueVertices = new Map();
        const newPositions = [];
        const vertexMap = new Map();

        for (let i = 0; i < positions.length; i += 3) {
            const x = Math.round(positions[i] / tolerance) * tolerance;
            const y = Math.round(positions[i + 1] / tolerance) * tolerance;
            const z = Math.round(positions[i + 2] / tolerance) * tolerance;

            const key = `${x},${y},${z}`;

            if (!uniqueVertices.has(key)) {
                const newIndex = newPositions.length / 3;
                uniqueVertices.set(key, newIndex);
                newPositions.push(x, y, z);
            }

            vertexMap.set(i / 3, uniqueVertices.get(key));
        }

        return {
            positions: new Float32Array(newPositions),
            vertexMap,
            reduction: ((positions.length - newPositions.length) / positions.length * 100).toFixed(1) + '%'
        };
    }
}

/**
 * Streaming geometry loader for large files
 * Loads STL in chunks to prevent memory spikes
 */
class StreamingGeometryLoader {
    static async loadSTLStreaming(file, chunkSize = 1024 * 1024) {
        return new Promise((resolve, reject) => {
            const fileSize = file.size;
            let offset = 0;
            const chunks = [];
            const reader = new FileReader();

            const readChunk = () => {
                if (offset >= fileSize) {
                    // All chunks read
                    const combinedArray = new Uint8Array(fileSize);
                    let pos = 0;
                    for (const chunk of chunks) {
                        combinedArray.set(chunk, pos);
                        pos += chunk.length;
                    }
                    resolve(combinedArray);
                    return;
                }

                const chunk = file.slice(offset, offset + chunkSize);
                reader.onload = (e) => {
                    chunks.push(new Uint8Array(e.target.result));
                    offset += chunkSize;

                    // Report progress
                    const progress = (offset / fileSize) * 100;
                    window.dispatchEvent(new CustomEvent('streamProgress', { detail: { progress } }));

                    readChunk();
                };

                reader.onerror = () => reject(reader.error);
                reader.readAsArrayBuffer(chunk);
            };

            readChunk();
        });
    }
}

/**
 * Performance monitor for geometry operations
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }

    startMeasure(label) {
        this.metrics.set(label, {
            startTime: performance.now(),
            startMemory: performance.memory?.usedJSHeapSize || 0
        });
    }

    endMeasure(label) {
        if (!this.metrics.has(label)) return null;

        const metric = this.metrics.get(label);
        const endTime = performance.now();
        const endMemory = performance.memory?.usedJSHeapSize || 0;

        const result = {
            label,
            duration: (endTime - metric.startTime).toFixed(2) + 'ms',
            memoryDelta: ((endMemory - metric.startMemory) / (1024 * 1024)).toFixed(2) + 'MB',
            timestamp: new Date().toISOString()
        };

        this.metrics.set(label, result);
        return result;
    }

    getAllMetrics() {
        return Array.from(this.metrics.values())
            .filter(m => m.duration); // Only completed measurements
    }

    clear() {
        this.metrics.clear();
    }
}

// Export for use in index.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MemoryManager,
        GeometryCompressor,
        StreamingGeometryLoader,
        PerformanceMonitor
    };
}
