const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(/\bborder-4\b/g, 'border-2')
      .replace(/\bborder-t-4\b/g, 'border-t-2')
      .replace(/\bborder-b-4\b/g, 'border-b-2')
      .replace(/\bborder-l-4\b/g, 'border-l-2')
      .replace(/\bborder-r-4\b/g, 'border-r-2')
      .replace(/border: 4px solid/g, 'border: 2px solid');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
