#!/usr/bin/env bash
# Quick Start: Verificar e instalar optimizaciones
# Uso: bash setup-optimization.sh

echo "🚀 Acetabular Wear Analysis - Optimization Setup"
echo "=================================================="
echo ""

# Verificar archivos requeridos
echo "✓ Verificando archivos..."
required_files=(
    "index.html"
    "stl-processor-worker.js"
    "geometry-optimizer.js"
    "performance-dashboard.js"
    "optimization-tests.js"
    "OPTIMIZATION_GUIDE.md"
    "DEPLOY_GUIDE.md"
    "IMPLEMENTATION_SUMMARY.md"
)

missing=0
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - FALTANTE"
        missing=$((missing + 1))
    fi
done

echo ""
if [ $missing -eq 0 ]; then
    echo "✅ Todos los archivos están presentes!"
    echo ""
    echo "📖 Próximos pasos:"
    echo ""
    echo "1. DESARROLLO LOCAL:"
    echo "   python server.py"
    echo "   # O: python -m http.server 5000"
    echo "   # Luego abre: http://localhost:5000"
    echo ""
    echo "2. VALIDAR OPTIMIZACIONES (en consola F12):"
    echo "   runOptimizationTests()"
    echo "   checkBrowserCapabilities()"
    echo ""
    echo "3. VER DASHBOARD:"
    echo "   # Se muestra automáticamente en esquina derecha"
    echo ""
    echo "4. DEPLOY EN CLOUDFLARE PAGES:"
    echo "   git add -A"
    echo "   git commit -m 'Add 800MB optimization suite'"
    echo "   git push origin main"
    echo ""
    echo "5. LEER DOCUMENTACIÓN:"
    echo "   cat OPTIMIZATION_GUIDE.md"
    echo "   cat DEPLOY_GUIDE.md"
    echo ""
else
    echo "❌ Faltan $missing archivo(s)"
    echo "Por favor, ejecuta el script nuevamente desde la raíz del proyecto"
    exit 1
fi

echo "=================================================="
echo "✨ Ready to handle 800MB+ models!"
