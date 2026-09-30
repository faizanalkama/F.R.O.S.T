const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  let needsBackendApi = false;
  let needsMlApi = false;
  let needsGetWsUrl = false;
  let needsBackendUrl = false;
  
  // ws://localhost:5000
  if (content.includes('ws://localhost:5000')) {
    content = content.replace(/'ws:\/\/localhost:5000(.*?)'/g, "getWsUrl('$1')");
    content = content.replace(/"ws:\/\/localhost:5000(.*?)"/g, "getWsUrl('$1')");
    needsGetWsUrl = true;
  }
  
  // const API_BASE
  if (content.includes('const API_BASE = \'http://localhost:5000')) {
    content = content.replace(/const API_BASE = 'http:\/\/localhost:5000(.*?)';/g, "const API_BASE = `${BACKEND_URL}$1`;");
    needsBackendUrl = true;
  }
  
  // const API
  if (content.includes('const API = \'http://localhost:5000')) {
    content = content.replace(/const API = 'http:\/\/localhost:5000(.*?)';/g, "const API = `${BACKEND_URL}$1`;");
    needsBackendUrl = true;
  }

  // const FORECAST_URL
  if (content.includes('const FORECAST_URL = \'http://localhost:5000')) {
     content = content.replace(/const FORECAST_URL = 'http:\/\/localhost:5000(.*?)';/g, "const FORECAST_URL = `${BACKEND_URL}$1`;");
     needsBackendUrl = true;
  }

  // fetch('http://localhost:5000...')
  if (content.includes("fetch('http://localhost:5000")) {
    content = content.replace(/fetch\('http:\/\/localhost:5000(.*?)'/g, "fetch(`${BACKEND_URL}$1`");
    needsBackendUrl = true;
  }
  
  // fetch(`http://localhost:5000...`)
  if (content.includes('fetch(`http://localhost:5000')) {
    content = content.replace(/fetch\(`http:\/\/localhost:5000(.*?)`/g, "fetch(`${BACKEND_URL}$1`");
    needsBackendUrl = true;
  }

  // axios.get ML
  if (content.includes("axios.get('http://localhost:5000/api/v1/ml")) {
    content = content.replace(/axios\.get\('http:\/\/localhost:5000\/api\/v1\/ml(.*?)'\)/g, "mlApi.get('/api/v1/ml$1')");
    needsMlApi = true;
  }
  
  // axios.get backend
  if (content.includes("axios.get('http://localhost:5000")) {
    content = content.replace(/axios\.get\('http:\/\/localhost:5000(.*?)'\)/g, "backendApi.get('$1')");
    needsBackendApi = true;
  }
  
  // axios.post backend
  if (content.includes("axios.post('http://localhost:5000")) {
    content = content.replace(/axios\.post\('http:\/\/localhost:5000(.*?)'/g, "backendApi.post('$1'");
    needsBackendApi = true;
  }
  
  // new URL
  if (content.includes("new URL('http://localhost:5000")) {
     content = content.replace(/new URL\('http:\/\/localhost:5000(.*?)'\)/g, "new URL(`${BACKEND_URL}$1`)");
     needsBackendUrl = true;
  }

  if (content !== originalContent) {
    let relPath = path.relative(path.dirname(filePath), path.join(srcDir, 'api.js')).replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    relPath = relPath.replace(/\.js$/, '');
    
    let imports = [];
    if (needsBackendApi) imports.push('backendApi');
    if (needsMlApi) imports.push('mlApi');
    if (needsGetWsUrl) imports.push('getWsUrl');
    if (needsBackendUrl) imports.push('BACKEND_URL');
    
    if (imports.length > 0) {
      const importStatement = `import { ${imports.join(', ')} } from '${relPath}';`;
      const lines = content.split('\n');
      let lastImport = -1;
      for (let i=0; i<lines.length; i++) {
        if (lines[i].startsWith('import ')) lastImport = i;
      }
      if (lastImport !== -1) {
        lines.splice(lastImport + 1, 0, importStatement);
      } else {
        lines.unshift(importStatement);
      }
      content = lines.join('\n');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      if (fullPath.includes('api.js')) continue;
      processFile(fullPath);
    }
  }
}

walk(srcDir);
console.log('Codemod complete!');
