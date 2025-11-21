# Acetabular Wear Analysis System

## Overview
This project is a professional standalone HTML web application designed for the precise analysis of volumetric and linear wear in acetabular hip prosthesis components. It processes STL files to provide 3D visualization, automated wear detection, and comprehensive measurement capabilities. The application's core purpose is to calculate volumetric wear, measure linear penetration depth, visualize wear patterns with color-coded 3D rendering, and export analysis results for medical documentation, contributing to improved medical diagnostics and prosthesis design.

## Recent Changes
- **2025-11-21 (Latest)**: Enhanced unworn sphere fitting algorithm with three major improvements for maximum overlap between fitted sphere and unworn zone:
  1. **Curvature-based filtering**: Pre-filters unworn vertices by Gaussian curvature, keeping only the top 75% with lowest |K| (near-spherical geometry), eliminating deformed/transition zones
  2. **Normal-weighted least squares**: Implements weighted fitting where vertices with normals well-aligned to radial direction receive higher weight (weight = cos²(angle)), reducing influence of poorly-oriented points
  3. **4-step iterative refinement**: Increased from 2 to 4 refinement iterations with progressively tighter thresholds (2σ → 1.5σ → 1σ), with weights recomputed at each step for optimal convergence
- **2025-11-21**: Corrected linear wear calculation to properly frame measurements within the worn zone defined by the transition plane. The algorithm now filters worn vertices to include only those on the worn side of the transition plane (distance ≤ 0), ensuring measurements accurately represent the space between the transition plane and the real inner surface of the prosthesis.

## User Preferences
- Language: English (all UI and outputs)
- Professional medical-grade interface required
- Standalone HTML preferred (no build step)
- Clear visual distinction between worn/unworn zones to prevent confusion

## System Architecture

### UI/UX Decisions
The application features a professional medical-grade user interface built with Tailwind CSS, utilizing a clean white background and a modern color scheme. A dual-viewer system provides simultaneous visualization of the main analysis and the fitted reference sphere. Color-coding (Blue for original, Green for unworn, Red for worn, Gold wireframe for reference sphere) ensures clear visual distinction and intuitive interpretation of results. The interface is designed around a sequential 4-step analysis pipeline, guiding the user through the process.

### Technical Implementations
The system is implemented as a standalone HTML5 application, leveraging Three.js for 3D rendering and scientific visualization, with all dependencies loaded via CDN for a zero-build-step deployment. It supports both binary and ASCII STL file formats. Key algorithms include:

-   **Inner Surface Isolation**: Uses normal vector analysis combined with robust connected component filtering to accurately isolate the concave inner surface of the acetabular cup, eliminating spurious regions.
-   **Worn/Unworn Zone Detection**: Employs Gaussian curvature analysis (Meyer et al. 2003) for wear zone identification, detecting saddle points characteristic of femoral head wear. This is combined with radial deviation metrics and an automatic rim/edge exclusion algorithm to precisely delineate worn (red) and unworn (green) zones.
-   **Unworn Sphere Fitting (ENHANCED)**: A highly accurate sphere is fitted *only* to the unworn regions using an advanced multi-stage algorithm:
    1. Curvature pre-filtering removes vertices with high |K| (deformed zones)
    2. Weighted Gauss-Newton with Levenberg-Marquardt fallback, where weights are computed from normal-to-radial alignment (cos²θ)
    3. 4-step iterative refinement (2σ → 1.5σ → 1σ thresholds) with weight recomputation
    This provides sub-micrometer precision and maximizes overlap between the fitted sphere and truly unworn geometry.
-   **Transition Plane Detection**: Detects the boundary between worn and unworn regions and fits a least-squares plane to these boundary points, defining a critical reference for volumetric calculations.
-   **Volumetric Wear Calculation**: Calculates volumetric wear ONLY in the worn zone as the integral volume between the fitted sphere (ideal surface) and the real worn surface. For each worn triangle, vertices are projected onto the fitted sphere and the wedge volume between real and ideal surfaces is computed using tetrahedral decomposition from the sphere center.
-   **Linear Wear Metrics**: Calculates mean, max, and min perpendicular penetration depths from the fitted unworn sphere to the real inner surface. Measurements are framed within the worn zone defined by the transition plane, only including vertices on the worn side (between the transition plane and the inner surface).

### Feature Specifications
The application pipeline consists of four main steps:
1.  Isolate Inner Surface
2.  Detect Wear Zones
3.  Fit Reference Sphere
4.  Calculate Wear
It provides interactive 3D visualization, status indicators, and result panels displaying volumetric wear, linear wear metrics, sphere parameters, and zone areas. Results can be exported in CSV format.

### System Design Choices
The application is designed for performance, utilizing direct manipulation of BufferGeometry attributes for efficient rendering and O(n) algorithms where possible. The architecture prioritizes a standalone, client-side approach for ease of deployment and accessibility.

## External Dependencies
-   **3D Rendering Library**: Three.js (v0.158.0) via CDN
-   **UI Framework**: Tailwind CSS via CDN
-   **Deployment**: Simple Python HTTP server (for local serving in Replit)
