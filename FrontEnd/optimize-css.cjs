const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

// Configuración del optimizador
const options = {
    level: {
        2: {
            mergeAdjacentRules: true,
            mergeNonAdjacentRules: true,
            removeDuplicateRules: true,
            mergeMedia: true
        }
    },
    format: 'beautify' // Mantiene el código legible
};

const optimizer = new CleanCSS(options);
let totalSavedBytes = 0;
let filesOptimized = 0;

// Función recursiva para buscar y procesar archivos CSS
function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath); // Entra a las subcarpetas
        } else if (fullPath.endsWith('.css')) {
            const cssInput = fs.readFileSync(fullPath, 'utf8');
            const output = optimizer.minify(cssInput);

            if (output.errors.length === 0 && output.stats.originalSize > output.stats.minifiedSize) {
                fs.writeFileSync(fullPath, output.styles, 'utf8');
                
                const saved = output.stats.originalSize - output.stats.minifiedSize;
                totalSavedBytes += saved;
                filesOptimized++;
                
                console.log(`✅ Optimizado: ${fullPath} (Reducción: ${(output.stats.efficiency * 100).toFixed(2)}%)`);
            }
        }
    }
}

console.log('Iniciando escaneo de archivos .css en src/...\n');
processDirectory('src'); // Carpeta base a escanear

console.log('\n🎉 ¡Proceso terminado!');
console.log(`📂 Archivos optimizados: ${filesOptimized}`);
console.log(`💾 Espacio total ahorrado en código fuente: ${(totalSavedBytes / 1024).toFixed(2)} KB`);