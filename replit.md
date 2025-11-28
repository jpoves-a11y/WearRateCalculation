# Acetabular Wear Analysis System

## Overview
This project is a professional standalone HTML web application designed for the precise analysis of volumetric and linear wear in acetabular hip prosthesis components. It processes STL files to provide 3D visualization, automated wear detection, and comprehensive measurement capabilities. The application calculates volumetric wear, measures linear penetration depth, visualizes wear patterns with color-coded 3D rendering, and exports analysis results for medical documentation.

**Version**: 4.0 (November 2025)

## User Preferences
- Language: English (all UI and outputs)
- Professional medical-grade interface required
- Standalone HTML preferred (no build step)
- Clear visual distinction between worn/unworn zones

## System Architecture

### UI/UX Decisions
The application features a professional medical-grade user interface built with Tailwind CSS. A triple-viewer system provides simultaneous visualization:
1. **Main 3D Viewer**: Shows the main analysis with color-coded worn/unworn zones
2. **Reference Sphere Viewer**: Displays the fitted reference sphere with transition plane and inflection markers
3. **Volumetric Wear Viewer**: Shows transparent original STL with 40% transparent orange volumetric wear surface

Color-coding: Blue (original), Green (unworn), Red (worn), Gold wireframe (reference sphere), Orange 60% opacity (volumetric wear).

### Technical Implementations
The system is implemented as a standalone HTML5 application with modular ES6 architecture, leveraging Three.js for 3D rendering.

Key algorithms include:
- **Inner Surface Isolation**: Normal vector analysis + connected component filtering (largest component)
- **Worn/Unworn Zone Detection**: Dual-sphere ray-based clustering with commercial radius evaluation (14/16/18/20mm)
- **Unworn Sphere Fitting**: Gauss-Newton with LM damping or RANSAC with LM refinement
- **Transition Plane Detection**: PCA best-fit through rim boundary points

### Plane Equation (v4.0 - Critical Fix)
**Equation**: `n·x - d = 0` where `d = normal.dot(point)` (positive)

**Distance calculation**:
```javascript
function distanceToPlane(point, normal, d) {
    return normal.dot(point) - d;
}
```

**Interpretation**:
- Distance < 0: Inside bounded region (toward sphere center)
- Distance > 0: Outside bounded region
- Distance = 0: Exactly on plane

### Volumetric Wear Calculation (v4.0)
- Iterates over ALL filtered inner triangles from Step 1
- Clips each triangle by transition plane
- Calculates penetration: `dist_to_center - sphere_radius`
- Only counts positive penetration (material removed)
- Uses Kahan summation for numerical precision

### Clipping Function (v4.0)
Uses consistent inside/outside classification:
```javascript
const inside1 = d1 <= 0;  // Negative distance = inside
const inside2 = d2 <= 0;
const inside3 = d3 <= 0;
```

## External Dependencies
- **3D Rendering Library**: Three.js (v0.158.0) via CDN
- **UI Framework**: Tailwind CSS via CDN
- **Development Server**: Python 3.11 HTTP server (`server.py`)
- **PDF Generation**: jsPDF library

## Recent Changes (v4.0 - November 2025)
1. Fixed plane equation consistency: Changed from mixed `d = -n·p` / `d = n·p` to consistently use `d = n·p`
2. Fixed clipping function: Renamed variables from worn1/2/3 to inside1/2/3 for clarity
3. Added debug logging to verify plane equation correctness
4. Changed volumetric wear viewer opacity to 60% (40% transparency)
5. Rewrote README with complete documentation
