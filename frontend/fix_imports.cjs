const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the injected api import line(s)
  const importRegex = /import\s+\{[^}]+\}\s+from\s+['"](?:\.\.\/|\.\/)*api['"];?\r?\n?/g;
  
  const match = content.match(importRegex);
  if (match) {
    // Extract the exact import statement (taking the first one if there are duplicates)
    const importStmt = match[0].trim();
    
    // Remove all occurrences of the injected import from the file
    content = content.replace(importRegex, '');
    
    // Also clean up any accidental double imports like 'import import {'
    // which shouldn't happen with the splice method, but just in case
    content = content.replace(/import\s+import\s+/g, 'import ');
    
    // Prepend the import statement to the very top of the file
    content = importStmt + '\n' + content;
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      if (fullPath.includes('api.js')) continue;
      fixFile(fullPath);
    }
  }
}

walk(srcDir);
console.log('Global sweep and fix complete.');
