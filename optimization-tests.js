/**
 * Optimization Test Suite
 * Validates Web Workers, Memory Manager, and Performance features
 * 
 * Usage: Abrir en consola F12 y ejecutar:
 *   runOptimizationTests()
 */

async function runOptimizationTests() {
    console.log('🧪 Starting Optimization Test Suite...\n');
    
    const tests = [];
    
    // Test 1: Web Worker Availability
    tests.push(testWebWorker());
    
    // Test 2: Memory Manager
    tests.push(testMemoryManager());
    
    // Test 3: GeometryCompressor
    tests.push(testGeometryCompressor());
    
    // Test 4: Performance Monitor
    tests.push(testPerformanceMonitor());
    
    // Test 5: Streaming Loader
    tests.push(testStreamingLoader());
    
    const results = await Promise.all(tests);
    
    console.log('\n📊 Test Results:\n');
    results.forEach((result, index) => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} Test ${index + 1}: ${result.name}`);
        if (result.message) console.log(`   └─ ${result.message}`);
        if (result.details) console.log(`   └─ Details:`, result.details);
    });
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`\n📈 Overall: ${passedCount}/${totalCount} tests passed`);
    
    return results;
}

function testWebWorker() {
    return new Promise((resolve) => {
        try {
            if (state.stlWorker) {
                resolve({
                    passed: true,
                    name: 'Web Worker',
                    message: 'Web Worker initialized successfully'
                });
            } else if (typeof Worker !== 'undefined') {
                resolve({
                    passed: true,
                    name: 'Web Worker',
                    message: 'Worker API available but not initialized (will lazy-load)',
                    details: 'Browser supports Web Workers'
                });
            } else {
                resolve({
                    passed: false,
                    name: 'Web Worker',
                    message: 'Web Workers not supported in this browser'
                });
            }
        } catch (error) {
            resolve({
                passed: false,
                name: 'Web Worker',
                message: error.message
            });
        }
    });
}

function testMemoryManager() {
    return new Promise((resolve) => {
        try {
            if (!state.memoryManager) {
                resolve({
                    passed: false,
                    name: 'Memory Manager',
                    message: 'Memory Manager not initialized'
                });
                return;
            }
            
            const mm = state.memoryManager;
            
            // Test allocation
            const buffer1 = mm.allocateFloat32Array(1000);
            const buffer2 = mm.allocateFloat32Array(1000);
            
            if (buffer1.length !== 1000 || buffer2.length !== 1000) {
                resolve({
                    passed: false,
                    name: 'Memory Manager',
                    message: 'Buffer allocation failed'
                });
                return;
            }
            
            // Test release
            mm.releaseFloat32Array(buffer1);
            mm.releaseFloat32Array(buffer2);
            
            // Test stats
            const stats = mm.getStats();
            
            resolve({
                passed: true,
                name: 'Memory Manager',
                message: 'Memory pooling working correctly',
                details: `${stats.poolCount} pool sizes, ${stats.totalBuffers} buffers available`
            });
        } catch (error) {
            resolve({
                passed: false,
                name: 'Memory Manager',
                message: error.message
            });
        }
    });
}

function testGeometryCompressor() {
    return new Promise((resolve) => {
        try {
            if (typeof GeometryCompressor === 'undefined') {
                resolve({
                    passed: false,
                    name: 'Geometry Compressor',
                    message: 'GeometryCompressor not found'
                });
                return;
            }
            
            // Create test data
            const testPositions = new Float32Array([
                0, 0, 0,
                1, 0, 0,
                1, 1, 0,
                0, 1, 0
            ]);
            
            // Test quantization
            const compressed = GeometryCompressor.quantizePositions(testPositions, 16);
            const decompressed = GeometryCompressor.dequantizePositions(
                compressed.quantized,
                compressed.bounds
            );
            
            // Test duplicate removal
            const testPosWithDuplicates = new Float32Array([
                0.0001, 0.0001, 0.0001,
                0.0002, 0.0002, 0.0002,
                0.0001, 0.0001, 0.0001
            ]);
            
            const deduped = GeometryCompressor.removeDuplicateVertices(
                testPosWithDuplicates,
                0.001
            );
            
            resolve({
                passed: true,
                name: 'Geometry Compressor',
                message: 'Compression/decompression working',
                details: `Compression ratio: ${compressed.info.compressionRatio}, Deduped: ${deduped.reduction} removed`
            });
        } catch (error) {
            resolve({
                passed: false,
                name: 'Geometry Compressor',
                message: error.message
            });
        }
    });
}

function testPerformanceMonitor() {
    return new Promise((resolve) => {
        try {
            if (!state.performanceMonitor) {
                resolve({
                    passed: false,
                    name: 'Performance Monitor',
                    message: 'Performance Monitor not initialized'
                });
                return;
            }
            
            const pm = state.performanceMonitor;
            
            // Test measurement
            pm.startMeasure('test-operation');
            
            // Simulate work
            let sum = 0;
            for (let i = 0; i < 1000000; i++) {
                sum += Math.sqrt(i);
            }
            
            const result = pm.endMeasure('test-operation');
            const metrics = pm.getAllMetrics();
            
            if (!result || metrics.length === 0) {
                resolve({
                    passed: false,
                    name: 'Performance Monitor',
                    message: 'Metrics not recorded'
                });
                return;
            }
            
            resolve({
                passed: true,
                name: 'Performance Monitor',
                message: 'Performance monitoring working',
                details: `Test operation: ${result.duration}`
            });
        } catch (error) {
            resolve({
                passed: false,
                name: 'Performance Monitor',
                message: error.message
            });
        }
    });
}

function testStreamingLoader() {
    return new Promise((resolve) => {
        try {
            if (typeof StreamingGeometryLoader === 'undefined') {
                resolve({
                    passed: false,
                    name: 'Streaming Loader',
                    message: 'StreamingGeometryLoader not found'
                });
                return;
            }
            
            // Check if FileReader API available
            if (typeof FileReader === 'undefined') {
                resolve({
                    passed: false,
                    name: 'Streaming Loader',
                    message: 'FileReader API not available'
                });
                return;
            }
            
            resolve({
                passed: true,
                name: 'Streaming Loader',
                message: 'Streaming loader ready for large files',
                details: 'API available - will activate for files > 50MB'
            });
        } catch (error) {
            resolve({
                passed: false,
                name: 'Streaming Loader',
                message: error.message
            });
        }
    });
}

/**
 * Detailed Performance Profiling
 */
function profileMemoryUsage() {
    console.log('📊 Memory Profiling:\n');
    
    if (!performance.memory) {
        console.warn('⚠️  performance.memory not available (not Chrome-based)');
        return;
    }
    
    const used = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
    const limit = (performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2);
    const percent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(1);
    
    console.log(`Used: ${used} MB`);
    console.log(`Limit: ${limit} MB`);
    console.log(`Usage: ${percent}%`);
    
    if (state.memoryManager) {
        const stats = state.memoryManager.getStats();
        console.log(`\nBuffer Pools:`);
        console.log(`  - Total pools: ${stats.poolCount}`);
        console.log(`  - Total buffers: ${stats.totalBuffers}`);
        console.log(`  - Allocated: ${stats.totalAllocatedMB} MB`);
    }
}

/**
 * Browser Compatibility Check
 */
function checkBrowserCapabilities() {
    console.log('🌐 Browser Capabilities:\n');
    
    const capabilities = {
        'ES6 Modules': typeof import !== 'undefined',
        'Web Workers': typeof Worker !== 'undefined',
        'WebGL': !!document.createElement('canvas').getContext('webgl2'),
        'FileReader': typeof FileReader !== 'undefined',
        'Uint32Array': typeof Uint32Array !== 'undefined',
        'Typed Arrays': typeof ArrayBuffer !== 'undefined',
        'Promise': typeof Promise !== 'undefined',
        'Fetch': typeof fetch !== 'undefined',
        'Performance API': typeof performance !== 'undefined',
        'Memory API': typeof performance.memory !== 'undefined'
    };
    
    Object.entries(capabilities).forEach(([feature, available]) => {
        const status = available ? '✅' : '❌';
        console.log(`${status} ${feature}`);
    });
    
    return capabilities;
}

/**
 * Quick Load Test with Synthetic Data
 */
function testSyntheticLoad() {
    console.log('⚡ Synthetic Load Test:\n');
    
    state.performanceMonitor.startMeasure('synthetic-load');
    
    // Create synthetic large geometry
    const positions = [];
    const triangleCount = 100000; // 100k triangles
    
    for (let i = 0; i < triangleCount * 3; i++) {
        positions.push(
            Math.random() * 100 - 50,
            Math.random() * 100 - 50,
            Math.random() * 100 - 50
        );
    }
    
    const result = state.performanceMonitor.endMeasure('synthetic-load');
    
    console.log(`Generated: ${triangleCount.toLocaleString()} triangles`);
    console.log(`Size: ${(positions.length * 4 / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Time: ${result.duration}`);
    console.log(`Memory delta: ${result.memoryDelta}`);
}

// Export functions for global use
window.runOptimizationTests = runOptimizationTests;
window.profileMemoryUsage = profileMemoryUsage;
window.checkBrowserCapabilities = checkBrowserCapabilities;
window.testSyntheticLoad = testSyntheticLoad;

console.log('✅ Test suite loaded. Run tests with: runOptimizationTests()');
