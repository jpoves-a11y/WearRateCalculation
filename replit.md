# Acetabular Wear Analysis System

## Overview
A professional standalone HTML web application for analyzing volumetric and linear wear in acetabular hip prosthesis components from STL files. The application provides 3D visualization, automated wear detection, and comprehensive measurement capabilities.

## Purpose
- Calculate volumetric wear in acetabular cup components
- Measure linear wear (penetration depth) from femoral head contact
- Visualize worn vs unworn zones with color-coded 3D rendering
- Export analysis results for medical documentation

## Recent Changes
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

#### 1. Inner Surface Isolation
**Method**: Normal Vector Analysis
- Calculates mesh centroid
- Analyzes face normals relative to centroid
- Selects faces with normals pointing inward (dot product > 0.3)
- **Why**: Acetabular cups are bowl-shaped; inner surface normals point toward the center

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

#### 3. Reference Sphere Fitting
**Method**: Iterative Least Squares
- Uses unworn zone vertices for fitting
- Iteratively refines center position (10 iterations)
- Calculates average radius from final center
- **Why**: Unworn zone represents original geometry before wear occurred

#### 4. Wear Calculation
**Volumetric Wear**: Distance field integration
- For each worn face: volume = area × deviation from reference sphere
- Sums across all worn faces
- Units: mm³

**Linear Wear**: Point-to-sphere distance
- Mean: Average penetration depth
- Max: Maximum penetration depth
- Min: Minimum penetration depth
- Units: mm

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
