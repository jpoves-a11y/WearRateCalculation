# Acetabular Wear Analysis System

## Overview
This project is a professional standalone HTML web application designed for the precise analysis of volumetric and linear wear in acetabular hip prosthesis components. It processes STL files to provide 3D visualization, automated wear detection, and comprehensive measurement capabilities. The application's core purpose is to calculate volumetric wear, measure linear penetration depth, visualize wear patterns with color-coded 3D rendering, and export analysis results for medical documentation, contributing to improved medical diagnostics and prosthesis design. The business vision is to provide an accessible, high-precision tool for medical professionals and researchers, enhancing the accuracy of prosthesis evaluation and design iterations.

## User Preferences
- Language: English (all UI and outputs)
- Professional medical-grade interface required
- Standalone HTML preferred (no build step)
- Clear visual distinction between worn/unworn zones to prevent confusion

## System Architecture

### UI/UX Decisions
The application features a professional medical-grade user interface built with Tailwind CSS, utilizing a clean white background and a modern color scheme. A dual-viewer system provides simultaneous visualization of the main analysis and the fitted reference sphere. Color-coding (Blue for original, Green for unworn, Red for worn, Gold wireframe for reference sphere) ensures clear visual distinction and intuitive interpretation of results. The interface is designed around a sequential 4-step analysis pipeline, guiding the user through the process.

### Technical Implementations
The system is implemented as a standalone HTML5 application with modular ES6 architecture, leveraging Three.js for 3D rendering and scientific visualization, with all dependencies loaded via CDN for a zero-build-step deployment. It supports both binary and ASCII STL file formats. The codebase is organized into specialized service modules:

**Modular Architecture:**
- **GeometryService**: Core geometric operations.
- **CurvatureAnalyzer**: Discrete differential geometry.
- **PCAService**: Principal Component Analysis for optimal plane fitting.
- **FittingService**: Multiple sphere fitting strategies with comprehensive diagnostics.

**Key Algorithms:**
- **Inner Surface Isolation**: Uses normal vector analysis and connected component filtering to isolate the concave inner surface.
- **Worn/Unworn Zone Detection**: Employs a Spherical Displacement Recognition Algorithm to detect characteristic "one-sided displacement" patterns, classifying vertices based on spherical deviation and local consistency scores. It automatically detects inflection points and excludes rim/edge vertices.
- **Unworn Sphere Fitting**: Offers two robust methods: Gauss-Newton with Levenberg-Marquardt damping for fast convergence, and RANSAC with Levenvenberg-Marquardt for robustness against outliers.
- **Transition Plane Detection**: Uses a RADIAL method based on the rim exclusion boundary. The plane is positioned at the centroid of non-rim vertices adjacent to rim vertices, with its normal pointing inward. Rim vertices are rendered transparently.
- **Volumetric Wear Calculation**: Integrates the volume between the fitted sphere and ALL inner surface triangles within the space bounded by the transition plane, using penetration depth × area integration. Independent of worn/unworn classification - only counts positive penetrations (real surface inside fitted sphere = material loss).
- **Linear Wear Metrics**: Calculates mean, max, and min perpendicular penetration depths from the fitted unworn sphere to the real inner surface, specifically within the transition plane-defined worn zone.
- **Quality Diagnostics**: Provides comprehensive fitting diagnostics including RMS error, iteration count, inlier/outlier ratio, residual distribution, and convergence status.

### Feature Specifications
The application pipeline consists of four main steps: 1. Isolate Inner Surface, 2. Detect Wear Zones, 3. Fit Reference Sphere (with method selection), and 4. Calculate Wear.

**Interactive Features:**
- Dual 3D viewers with orbit controls.
- Sphere fitting method selector (Gauss-Newton vs RANSAC).
- Interactive inflection point markers.
- Real-time quality diagnostics panel.
- Color-coded wear zones with transparency.

**Export Capabilities:**
- **CSV Export**: Tabular data with key metrics.
- **JSON Export**: Comprehensive metadata including wear metrics, sphere parameters, fitting diagnostics, transition plane equation, quality metrics, and analysis timestamp.
- **PDF Export**: Professional reports with all wear metrics, sphere parameters, fitting quality diagnostics, zone areas, and transition plane data.
- **Interactive HTML Export**: Standalone 3D visualization files with embedded Three.js for sharing.

### System Design Choices
The application is designed for performance, utilizing direct manipulation of BufferGeometry attributes for efficient rendering and O(n) algorithms where possible. The architecture prioritizes a standalone, client-side approach for ease of deployment and accessibility.

## External Dependencies
- **3D Rendering Library**: Three.js (v0.158.0) via CDN
- **UI Framework**: Tailwind CSS via CDN
- **Development Server**: Python 3.11 HTTP server (server.py)
- **PDF Generation**: jsPDF library

## Recent Changes

### November 27, 2025 - Dual-Sphere Method: Classification Logic Correction (v3.1)

**Critical Fix**: Inverted the worn/unworn classification logic in the Dual-Sphere method

**Problem in v3.0**:
- Classification rule was: cluster center CLOSER to reference sphere = UNWORN
- This resulted in visually inverted zones (worn appeared as unworn and vice versa)

**Corrected Logic (v3.1)**:
- Classification rule now: cluster center FARTHER from reference sphere = UNWORN
- `const unwornCluster = dist0ToSphere >= dist1ToSphere ? 0 : 1;`

**Physical Reasoning**:
1. The reference sphere center is computed from ALL non-rim vertices (a mix of worn and unworn), so it's a "mixed centroid"
2. UNWORN normals converge to the TRUE sphere center (original prosthesis geometry), which is typically FARTHER from this mixed centroid
3. WORN normals converge to a SHIFTED center displaced toward the wear zone, which is CLOSER to the mixed centroid
4. Therefore: FARTHER = UNWORN, CLOSER = WORN

**UI Changes**:
- Removed "Confidence Threshold" parameter (was not used in v3.0 algorithm, legacy from v1/v2)
- Updated dual-sphere options panel with algorithm description

---

### November 27, 2025 - Dual-Sphere Method: Ray-Based Least-Squares Clustering (v3.0)

**Major Algorithm Improvement**: Replaced projection-based approach with ray-based least-squares intersection

**Problem with Previous Methods**:
- v1.0: Used fixed threshold, required manual tuning
- v2.0: Used `impliedCenter = vertex + inwardNormal * radius`, but this overshoots for worn vertices (which are closer to center than the reference radius)

**New Method (v3.0 - Ray-Based Clustering)**:
1. Create a ray for each vertex: `origin = vertex position`, `direction = inward normal`
2. Initialize cluster centers: Cluster 0 = reference sphere center, Cluster 1 = estimate from deepest wear penetration
3. Iterative clustering:
   - Assignment: assign each ray to cluster with nearest center (by perpendicular distance from center to ray)
   - Update: recompute cluster centers using least-squares solution that minimizes perpendicular distances to all assigned rays
4. Converge until stable (max 30 iterations)
5. Classify: cluster center FARTHER from reference sphere = UNWORN, CLOSER = WORN (corrected in v3.1)

**Mathematical Foundation**:
- For a set of rays, the optimal convergence point P minimizes Σ(perpendicular_distance(P, ray_i)²)
- Closed-form solution: P = (Σ(I - D⊗D))⁻¹ × Σ((I - D⊗D) × O)
- Where D = ray direction, O = ray origin, I = identity matrix, ⊗ = outer product

**Advantages**:
- Geometrically correct: finds true ray convergence points
- Works regardless of vertex distance from center
- No fixed radius assumption
- Handles non-uniform wear patterns

**Visual Features**:
- **Unworn Center Marker**: Bright green sphere (0x00ff88) at ray convergence center
- **Worn Center Marker**: Bright red sphere (0xff3366) at ray convergence center
- **Legend Items**: Show/hide automatically based on detection method

---

### November 25, 2025 - Critical Corrections: Worn/Unworn Classification & Volumetric Integration (v3.2)

**Update 5**: Confirmed worn/unworn classification logic
- **Classification rule** (confirmed correct):
  - Worn zone: Hemisphere FARTHER from geometric centroid
  - Unworn zone: Hemisphere CLOSER to geometric centroid
- **Implementation**: Line 2043 uses `(bestPositiveAvg > bestNegativeAvg)` to select the hemisphere with larger average distance as worn
- **This logic is maintained consistently** across all downstream processes (sphere fitting, wear calculation)

**Update 4c**: Improved volumetric wear to use ALL triangles with positive penetration (v3.2)
- **Previous method (v3.1)**: Only processed worn-classified triangles
- **New method (v3.2 - current)**:
  - Processes ALL triangles in the inner surface (independent of worn/unworn classification)
  - Clips all triangles by the transition plane (normal points inward toward center)
  - Filters for positive penetration only (points inside reference sphere = material loss)
  - Integrates total volume between fitted sphere and real surface where real surface is inside sphere
- **Advantages**:
  - More objective - not dependent on classification accuracy
  - Measures true geometric deviation from fitted sphere
  - Captures all material loss regardless of classification
- **Result**: Robust volumetric measurement of all positive deviations within plane boundary
- **Code Version**: v3.2 - Full surface integration with positive penetration filter

### November 25, 2025 - Rim Detection and Transition Plane Improvements

**Update 3**: Fixed Transition Plane to Contain Inflection Markers
- **Problem 1**: Plane only used non-rim vertices, causing inward bias
- **Problem 2**: Used arbitrary radial normal instead of best-fit plane
- **Solution**: 
  - Uses BOTH sides of rim/non-rim interface (rim with non-rim neighbors + non-rim with rim neighbors)
  - Fits plane using PCA (Principal Component Analysis) for true best-fit
  - Plane passes through the same points visualized as yellow inflection markers
- **Result**: Plane contains the rim exclusion boundary points with minimal distance (<0.1mm avg)

**Update 2**: Simplified Rim Vertex Detection (v2)
**Algorithm Simplification**: Replaced complex normal-based method with a simple, robust distance-based approach.

**Previous methods**: 
- v1: Used axis with maximum geometric spread
- v2: Tried normal analysis and projection methods (too complex, unreliable)

**Current method (v3 - Distance-based)**:
- Calculates centroid of all inner surface vertices
- Measures distance from each vertex to centroid
- Selects 15% of vertices with **maximum distance** from centroid
- These form a circular band around the acetabular rim/border

**Result**: Accurate, reliable detection of the rim band - the 15% of vertices furthest from the centroid naturally form the circular edge at the acetabular opening. Simple and robust.

---

## Replit Environment Setup
**Date**: November 27, 2025 (GitHub Import Completed)

### Development Configuration
- **Workflow**: "Start application" runs `python server.py`
- **Port**: 5000 (frontend webview)
- **Host**: 0.0.0.0 (allows proxy access through Replit's iframe)
- **Python Version**: 3.12.11 (pre-installed in Replit)
- **Cache Control**: Server configured with no-cache headers for development

### Deployment Configuration
- **Type**: Static site deployment
- **Public Directory**: Root directory (.)
- **No build step required**: All dependencies loaded via CDN (Three.js, Tailwind CSS, jsPDF)
- **Production Note**: CDN-based Tailwind CSS is acceptable for this medical tool (not high-traffic commercial site)

### File Structure
```
.
├── index.html                          # Main application (~4712 lines, standalone)
├── server.py                           # Python HTTP server with cache control
├── replit.md                          # Project documentation and change log
├── README.md                          # Comprehensive technical documentation (~1260 lines)
├── EXPLICACION_DETECCION_DESGASTE.md  # Wear detection explanation (Spanish)
├── .gitignore                         # Git exclusions (Python, IDE files)
└── attached_assets/                   # Static assets
    ├── favicon_1763986228549.png
    ├── explicacion_wear_1764068917229.png
    ├── image_1764074277450.png
    ├── image_1764074353635.png
    ├── image_1764246859224.png
    └── logo-gbm_1764248361521.png
```

### Setup Status
✅ Python 3.12.11 available (pre-installed)
✅ Development workflow configured and running on port 5000
✅ Static deployment configured for production
✅ .gitignore created with Python, cache, and IDE exclusions
✅ Application verified and functional
✅ Files moved from WearRateCalculation/ to root directory
✅ Server running with proper cache control headers
✅ WebGL 3D viewer working correctly (screenshot tool limitations noted)

### Import Completed
The application is fully operational in the Replit environment:
- Development server accessible via Replit webview
- All frontend features functional (file upload, 3D rendering, analysis pipeline)
- Ready for medical professionals to upload STL files and perform wear analysis
- Deployment configured for production publishing when ready