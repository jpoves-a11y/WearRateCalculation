/**
 * Performance Dashboard for Large 3D Model Processing
 * Inject this into index.html to monitor real-time metrics
 */

class PerformanceDashboard {
    constructor() {
        this.isVisible = false;
        this.container = null;
        this.updateInterval = null;
    }

    /**
     * Create and inject dashboard into page
     */
    init() {
        // Create dashboard container
        const dashboard = document.createElement('div');
        dashboard.id = 'performance-dashboard';
        dashboard.innerHTML = `
        <style>
            #performance-dashboard {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                background: rgba(15, 23, 42, 0.95);
                border: 1px solid rgba(148, 163, 184, 0.2);
                border-radius: 12px;
                padding: 16px;
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 12px;
                color: #e2e8f0;
                z-index: 9999;
                max-height: 500px;
                overflow-y: auto;
                backdrop-filter: blur(10px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
            }

            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(148, 163, 184, 0.1);
            }

            .dashboard-title {
                font-weight: 600;
                color: #60a5fa;
                font-size: 13px;
            }

            .dashboard-toggle {
                cursor: pointer;
                background: rgba(96, 165, 250, 0.1);
                border: none;
                color: #60a5fa;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                transition: background 0.2s;
            }

            .dashboard-toggle:hover {
                background: rgba(96, 165, 250, 0.2);
            }

            .metric-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                border-bottom: 1px solid rgba(148, 163, 184, 0.05);
            }

            .metric-label {
                color: #cbd5e1;
                flex: 1;
            }

            .metric-value {
                color: #60a5fa;
                font-weight: 500;
                text-align: right;
            }

            .metric-value.warning {
                color: #fbbf24;
            }

            .metric-value.error {
                color: #f87171;
            }

            .metric-value.success {
                color: #4ade80;
            }

            .section-title {
                margin-top: 10px;
                margin-bottom: 6px;
                color: #93c5fd;
                font-weight: 600;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .mini-chart {
                width: 100%;
                height: 40px;
                background: rgba(30, 41, 59, 0.5);
                border-radius: 4px;
                margin: 6px 0;
                position: relative;
                border: 1px solid rgba(148, 163, 184, 0.1);
            }

            .chart-bar {
                position: absolute;
                bottom: 0;
                background: linear-gradient(to top, #60a5fa, #3b82f6);
                border-radius: 2px 2px 0 0;
                transition: height 0.2s;
            }
        </style>

        <div class="dashboard-header">
            <div class="dashboard-title">⚡ Performance</div>
            <button class="dashboard-toggle" onclick="this.closest('#performance-dashboard').style.display=this.closest('#performance-dashboard').style.display==='none'?'block':'none'">
                Hide
            </button>
        </div>

        <div class="section-title">Memory</div>
        <div class="metric-row">
            <span class="metric-label">Used Heap</span>
            <span class="metric-value" id="heap-used">-- MB</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Heap Limit</span>
            <span class="metric-value" id="heap-limit">-- MB</span>
        </div>
        <div class="mini-chart" id="memory-chart"></div>

        <div class="section-title">Web Worker</div>
        <div class="metric-row">
            <span class="metric-label">Status</span>
            <span class="metric-value" id="worker-status">Idle</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Tasks Processed</span>
            <span class="metric-value" id="worker-tasks">0</span>
        </div>

        <div class="section-title">Current Operation</div>
        <div class="metric-row">
            <span class="metric-label">Operation</span>
            <span class="metric-value" id="current-op">None</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Duration</span>
            <span class="metric-value" id="op-duration">-- ms</span>
        </div>

        <div class="section-title">Geometry Stats</div>
        <div class="metric-row">
            <span class="metric-label">Vertices</span>
            <span class="metric-value" id="vertex-count">0</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Triangles</span>
            <span class="metric-value" id="triangle-count">0</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">Buffer Pool</span>
            <span class="metric-value" id="buffer-pool">0 buffers</span>
        </div>
        `;

        document.body.appendChild(dashboard);
        this.container = dashboard;

        // Start update loop
        this.startUpdates();
    }

    /**
     * Update dashboard metrics every 500ms
     */
    startUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, 500);
    }

    /**
     * Update all metrics
     */
    updateMetrics() {
        // Memory metrics
        if (performance.memory) {
            const heapUsed = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
            const heapLimit = (performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(1);
            const heapPercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(1);

            document.getElementById('heap-used').textContent = `${heapUsed} MB`;
            document.getElementById('heap-limit').textContent = `${heapLimit} MB`;

            // Update memory chart
            const memChart = document.getElementById('memory-chart');
            memChart.innerHTML = `
                <div class="chart-bar" style="width: ${heapPercent}%; height: 30px; opacity: ${Math.min(heapPercent / 100, 1)}"></div>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #94a3b8; font-size: 11px;">
                    ${heapPercent}%
                </div>
            `;

            // Update color based on usage
            const heapValue = document.getElementById('heap-used');
            heapValue.className = 'metric-value';
            if (heapPercent > 80) {
                heapValue.classList.add('error');
            } else if (heapPercent > 60) {
                heapValue.classList.add('warning');
            }
        }

        // Geometry stats
        if (typeof state !== 'undefined' && state.geometry) {
            const vertexCount = state.geometry.attributes.position.count;
            const triangleCount = state.geometry.index ? 
                state.geometry.index.count / 3 : 
                vertexCount / 3;

            document.getElementById('vertex-count').textContent = vertexCount.toLocaleString();
            document.getElementById('triangle-count').textContent = Math.round(triangleCount).toLocaleString();
        }

        // Buffer pool stats
        if (typeof state !== 'undefined' && state.memoryManager) {
            const stats = state.memoryManager.getStats();
            document.getElementById('buffer-pool').textContent = `${stats.totalBuffers} buffers`;
        }

        // Web Worker status
        if (typeof state !== 'undefined' && state.stlWorker) {
            const status = state.stlWorker ? 'Active' : 'Inactive';
            document.getElementById('worker-status').textContent = status;
        }
    }

    /**
     * Log operation and update dashboard
     */
    logOperation(name, duration) {
        document.getElementById('current-op').textContent = name;
        document.getElementById('op-duration').textContent = `${duration.toFixed(1)} ms`;
    }

    /**
     * Stop updates
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Auto-initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboard = new PerformanceDashboard();
        window.dashboard.init();
        console.log('Performance Dashboard initialized. Access via: window.dashboard');
    });
} else {
    window.dashboard = new PerformanceDashboard();
    window.dashboard.init();
    console.log('Performance Dashboard initialized. Access via: window.dashboard');
}
