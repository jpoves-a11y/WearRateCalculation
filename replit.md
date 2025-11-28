# Acetabular Wear Analysis System

## Overview
This project is a professional standalone HTML web application designed for the precise analysis of volumetric and linear wear in acetabular hip prosthesis components. It processes STL files to provide 3D visualization, automated wear detection, and comprehensive measurement capabilities. The application calculates volumetric wear, measures linear penetration depth, visualizes wear patterns with color-coded 3D rendering, and exports analysis results for medical documentation, contributing to improved medical diagnostics and prosthesis design. The business vision is to provide an accessible, high-precision tool for medical professionals and researchers, enhancing the accuracy of prosthesis evaluation and design iterations.

## User Preferences
- Language: English (all UI and outputs)
- Professional medical-grade interface required
- Standalone HTML preferred (no build step)
- Clear visual distinction between worn/unworn zones to prevent confusion

## System Architecture

### UI/UX Decisions
The application features a professional medical-grade user interface built with Tailwind CSS, utilizing a clean white background and a modern color scheme. A triple-viewer system provides simultaneous visualization:
1. **Main 3D Viewer**: Shows the main analysis with color-coded worn/unworn zones
2. **Reference Sphere Viewer**: Displays the fitted reference sphere with transition plane and inflection markers
3. **Volumetric Wear Viewer**: Shows only the transparent original STL with the opaque orange volumetric wear surface (no spheres, planes, or color zones)

Color-coding (Blue for original, Green for unworn, Red for worn, Gold wireframe for reference sphere, Orange for volumetric wear) ensures clear visual distinction and intuitive interpretation of results. The interface is designed around a sequential 4-step analysis pipeline, guiding the user through the process.

### Technical Implementations
The system is implemented as a standalone HTML5 application with modular ES6 architecture, leveraging Three.js for 3D rendering and scientific visualization, with all dependencies loaded via CDN for a zero-build-step deployment. It supports both binary and ASCII STL file formats. The codebase is organized into specialized service modules: `GeometryService`, `CurvatureAnalyzer`, `PCAService`, and `FittingService`.

Key algorithms include:
- **Inner Surface Isolation**: Uses normal vector analysis and connected component filtering. Stores filtered triangles explicitly for consistent downstream processing (v3.6).
- **Worn/Unworn Zone Detection**: Employs dual-sphere ray-based clustering with commercial radius evaluation (14/16/18/20mm). Clusters are classified as worn/unworn based on RMS residual to commercial radius, not distance-based heuristics (v3.5).
- **Unworn Sphere Fitting**: Offers Gauss-Newton with Levenberg-Marquardt damping and RANSAC with Levenberg-Marquardt for robustness. Pre-filters unworn vertices to exclude rim and transition vertices (adjacent to worn zones) for cleaner fitting (v3.6). Includes option for commercial radius constraint.
- **Transition Plane Detection**: Uses a RADIAL method based on the rim exclusion boundary, positioned at the centroid of non-rim vertices adjacent to rim vertices.
- **Volumetric Wear Calculation**: Integrates the volume between the fitted sphere and filtered inner surface triangles within the transition plane, counting only positive penetrations (material loss). Uses shared triangle list for perfect numeric-visual consistency (v3.8).
- **Linear Wear Metrics**: Calculates mean, max, and min perpendicular penetration depths from the fitted unworn sphere to the real inner surface within the transition plane-defined worn zone.
- **Quality Diagnostics**: Provides comprehensive fitting diagnostics including RMS error, iteration count, inlier/outlier ratio, residual distribution, and convergence status.

### Feature Specifications
The application pipeline consists of four main steps: 1. Isolate Inner Surface, 2. Detect Wear Zones, 3. Fit Reference Sphere (with method selection), and 4. Calculate Wear.
Interactive features include dual 3D viewers with orbit controls, sphere fitting method selector, interactive inflection point markers, and a real-time quality diagnostics panel.
Export capabilities include CSV, JSON, PDF (professional reports), and interactive HTML files for sharing.

### System Design Choices
The application is designed for performance, utilizing direct manipulation of BufferGeometry attributes for efficient rendering and O(n) algorithms where possible. The architecture prioritizes a standalone, client-side approach for ease of deployment and accessibility.

## External Dependencies
- **3D Rendering Library**: Three.js (v0.158.0) via CDN
- **UI Framework**: Tailwind CSS via CDN
- **Development Server**: Python 3.11 HTTP server (`server.py`)
- **PDF Generation**: jsPDF library