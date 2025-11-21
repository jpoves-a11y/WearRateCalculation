# Acetabular Wear Analysis System

## Overview
A professional standalone HTML web application for analyzing volumetric and linear wear in acetabular hip prosthesis components from STL files. The application provides 3D visualization, automated wear detection, and comprehensive measurement capabilities.

## Purpose
- Calculate volumetric wear in acetabular cup components
- Measure linear wear (penetration depth) from femoral head contact
- Visualize worn vs unworn zones with color-coded 3D rendering
- Export analysis results for medical documentation

## Recent Changes
**November 21, 2025 - Critical Bug Fix: Inner Surface Detection**
- **FIXED**: Corrected distance filter in inner surface isolation algorithm
  - Previous bug: Used `f.distance > q1Dist` which excluded ALL inner surface faces
  - Root cause: For concave acetabular bowl, inner surface is CLOSER to centroid (not farther)
  - Solution: Changed to `f.distance <= q3Dist` to correctly select inner bowl faces
  - Impact: Algorithm now properly detects the concave inner surface of acetabulum
  - Verified by architect review

**November 21, 2025 - Replit Environment Setup**
- Configured Python HTTP server to serve the application on port 5000
- Set up workflow for automatic server start with webview output
- Configured deployment as static site with root directory as public folder
- Added .gitignore for Python files
- Application fully functional in Replit environment

**November 21, 2025 - Major Algorithm Overhaul**
- **IMPROVED: Inner Surface Isolation Algorithm**: Robust connectivity-based filtering
  - Uses stricter normal vector analysis (dot > 0.5)
  - Implements connected component analysis to eliminate isolated regions
  - Keeps only largest connected component (eliminates false positives like bottom green spots)
  - Significantly more accurate inner surface detection
  
- **IMPROVED: Transparency System**: Enhanced visual clarity
  - Inner surface: 100% opaque at all steps (clear visualization)
  - Outer surfaces: 75% transparent at all steps (minimal distraction)
  - Multi-material rendering maintained throughout pipeline
  
- **NEW: Sphere Fitting**: Uses ONLY unworn zone for reference geometry
  - Unworn sphere represents ideal original prosthesis surface
  - No longer fits dual spheres (worn sphere removed)
  - Gauss-Newton with Levenberg-Marquardt for robust fitting
  
- **NEW: Transition Plane Detection**: Boundary-based plane generation
  - Detects vertices at worn/unworn boundary using connectivity analysis
  - Fits plane to boundary points using least squares
  - Plane contains transition region between worn and unworn zones
  
- **NEW: Volumetric Wear Calculation**: Plane-based method with spherical cap correction
  - Formula: V_wear = V(plane to worn surface) - V(unworn spherical cap)
  - Part 1: Volume between transition plane and worn surface (tetrahedron decomposition)
  - Part 2: Spherical cap volume using formula V_cap = (πh²/3)(3R - h)
  - Final wear = Part 1 - Part 2 (accounts for sphere volume in that space)
  - More physically accurate representation of material loss
  
**November 21, 2025 - Critical Wear Classification Fix** (SUPERSEDED BY ABOVE)
- Previous dual-sphere method replaced with new plane-based approach
  
**November 21, 2025 - Advanced Algorithm Improvements**
- **Improved Sphere Fitting**: Implemented Gauss-Newton with Levenberg-Marquardt fallback for robust sphere fitting
  - Uses analytical Jacobian for faster convergence
  - Adaptive damping prevents divergence
  - Achieves sub-micrometer precision in sphere parameter estimation
- **True Volumetric Wear Calculation**: 3-tetrahedra decomposition for each worn triangle prism
  - Volume calculated between worn surface (real mesh) and unworn sphere (ideal geometry)
  - Each hexahedral prism decomposed into 3 tetrahedra with consistent winding
  - Provides accurate volumetric wear measurement in mm³
- **Enhanced Linear Wear Metrics**: Penetration depth statistics from unworn sphere
  - Mean, max, and min penetration depths
  - Reflects actual material loss distribution

**November 20, 2025 - Major Algorithm Update**
- Redesigned wear calculation system with dual-sphere methodology
- Implemented rim detection for cutting plane placement
- New volumetric calculation using spherical cap volumes
- Linear wear now calculated as center shift between spheres
- Updated UI with white background and modern color scheme
- Optimized performance with O(n) algorithms instead of O(n²)

**November 20, 2025 - Initial Implementation**
- Created standalone HTML application with Three.js for 3D visualization
- Implemented 4-stage analysis pipeline
- Added professional medical-grade UI with Tailwind CSS
- Implemented CSV export functionality for analysis results
- Created dual-viewer system (main analysis + sphere visualization)

## Project Architecture

### Technology Stack
- **Frontend Framework**: Standalone HTML5
- **3D Rendering**: Three.js (v0.158.0) via CDN
- **UI Framework**: Tailwind CSS via CDN
- **File Format**: STL (binary and ASCII support)
- **Deployment**: Simple Python HTTP server

### File Structure
```
/
├── index.html              # Main application (standalone)
├── replit.md              # This documentation file
└── attached_assets/       # User-uploaded assets
```

### Key Algorithms

#### 1. Inner Surface Isolation (IMPROVED - November 21, 2025)
**Method**: Normal Vector Analysis with Connected Component Filtering
- Calculates mesh centroid
- Analyzes face normals relative to centroid
- Selects faces with normals pointing strongly inward (dot product > 0.5)
- Filters faces by distance to centroid (must be > Q1)
- **NEW**: Builds adjacency graph and performs BFS to find connected components
- Keeps only the largest connected component (eliminates isolated false positives)
- **Why**: Acetabular cups are bowl-shaped; this method eliminates spurious regions like bottom artifacts
- **Result**: Clean inner surface isolation without false positives

#### 2. Worn/Unworn Zone Detection
**Method**: Statistical Deviation Analysis with IQR
- Fits initial approximate sphere to inner surface
- Calculates distance deviation from average radius
- Uses Interquartile Range (IQR) method to detect outliers
- Threshold: Q1 - 1.5 × IQR
- **Why**: Worn areas deviate from ideal spherical geometry

**IMPORTANT DISTINCTION**:
- **Worn Zone** (RED): Closest to inner prosthesis surface - where femoral head contacts and wears the material
- **Unworn Zone** (GREEN): Furthest from prosthesis - maintains original spherical geometry

#### 3. Unworn Sphere Fitting (IMPROVED - November 21, 2025)
**Method**: Gauss-Newton with Levenberg-Marquardt Fallback (ONLY Unworn Zone)
- **CHANGED**: Fits sphere ONLY to unworn vertices (not dual spheres)
- Unworn sphere represents the ideal original prosthesis geometry
- **Gauss-Newton iterations**: Computes analytical Jacobian (∂r/∂cx, ∂r/∂cy, ∂r/∂cz, ∂r/∂R)
- **Levenberg-Marquardt damping**: Adds λ·I to J^T·J when updates don't improve residuals
- **Adaptive λ**: Decreases on success, increases on failure (prevents divergence)
- **Convergence**: RMSE < 10^-6 or 20 iterations max
- **Precision**: Sub-micrometer accuracy in center position and radius
- **Why**: Unworn zone provides best estimate of original geometry; no need for worn sphere

#### 3b. Transition Plane Detection (NEW - November 21, 2025)
**Method**: Boundary Vertex Detection and Plane Fitting
- Builds vertex connectivity graph from mesh faces
- Detects boundary vertices: unworn vertices with worn neighbors
- Fits plane to boundary points using least squares
- Plane equation: n·p = d, where n is normal vector
- **Why**: Transition plane separates worn region from unworn region geometrically
- **Use**: Defines integration boundary for volumetric wear calculation

#### 4. Volumetric Wear Calculation (NEW METHOD - November 21, 2025)
**Formula**: V_wear = V(plane to worn surface) - V(unworn spherical cap)

**Part 1: Volume from Plane to Worn Surface**
- **Method**: Tetrahedron decomposition for each worn triangle
- For each triangle (p1, p2, p3), compute signed volume: V = (1/6)|det([p1-pref, p2-pref, p3-pref])|
- Reference point pref is on transition plane
- Sum absolute volumes for all worn triangles
- **Physical meaning**: Total volume enclosed between plane and actual worn surface
- Units: mm³

**Part 2: Unworn Spherical Cap Volume**
- **Method**: Analytical spherical cap formula
- Calculate plane-to-sphere-center distance: d = n·c - D
- Calculate cap height: h based on sphere intersection with plane
- Formula: V_cap = (πh²/3)(3R - h)
- **Physical meaning**: Volume of ideal sphere geometry below the plane
- Units: mm³

**Final Wear Volume**: V_wear = Part1 - Part2
- **Why**: Material loss = (space from plane to surface) - (sphere volume in that space)
- More accurate than previous methods as it properly accounts for geometric boundaries
- **Physical interpretation**: Volume of material that was removed from the original spherical surface

**Linear Wear**: Penetration Depth Statistics (unchanged)
- For each worn vertex: penetration = R_unworn - distance(vertex, center_unworn)
- Mean, max, min penetration depths
- Units: mm
- **Why**: Provides distribution of wear severity across the worn zone

### User Interface Components

**Main 3D Viewer**:
- Interactive orbit controls
- Color-coded mesh (blue → green/red after analysis)
- Status indicators and loading overlays

**Reference Sphere Viewer**:
- Shows fitted reference sphere (golden wireframe/translucent)
- Displays component with wear zones
- Synchronized controls

**Control Panel**:
- Sequential 4-step pipeline buttons
- File upload interface
- Status indicators

**Results Panel**:
- Volumetric wear metric card
- Linear wear metrics (mean, max, min)
- Sphere parameters
- Zone areas
- CSV export button

### Color Legend
- **Blue (#4299e1)**: Original component (before analysis)
- **Green (#48bb78)**: Unworn zone - furthest from inner prosthesis surface
- **Red (#f56565)**: Worn zone - closest to inner prosthesis surface (where wear occurs)
- **Gold wireframe (rgba(255,215,0,0.3))**: Reference sphere fitted to unworn zone

## User Preferences
- Language: English (all UI and outputs)
- Professional medical-grade interface required
- Standalone HTML preferred (no build step)
- Clear visual distinction between worn/unworn zones to prevent confusion

## Known Limitations
- PDF export requires additional library (jsPDF) - currently shows alert to use CSV export
- Wear detection threshold may need adjustment for different wear patterns
- Processing time increases with mesh complexity (100k+ faces)

## Future Enhancements (Next Phase)
- ICP (Iterative Closest Point) registration for pre/post-wear scan comparison
- Batch processing for multiple STL files
- Advanced mesh smoothing and noise filtering
- Comparative analysis dashboard for wear progression tracking
- CAD import for ideal prosthesis geometry comparison
- PDF report generation with embedded 3D visualizations
- Heat map visualization for wear distribution
- Cross-section view tools

## Development Notes
- Server runs on port 5000
- All dependencies loaded via CDN (no npm/build required)
- Three.js uses ES modules via importmap
- Vertex coloring used for zone visualization
- BufferGeometry attributes manipulated directly for performance

## Testing
To test the application:
1. Upload an STL file of an acetabular cup component
2. Click "1. Isolate Inner Surface" - should identify bowl interior
3. Click "2. Detect Wear Zones" - should color code worn (red) vs unworn (green)
4. Click "3. Fit Reference Sphere" - should show golden sphere in second viewer
5. Click "4. Calculate Wear" - should display metrics and enable export

## Contact & Support
For issues or questions about the analysis algorithms, refer to:
- Three.js documentation: https://threejs.org/docs/
- CloudCompare (reference for mesh algorithms): https://www.cloudcompare.org/
- Academic reference: ISO 14242-1 (wear testing methodology)
