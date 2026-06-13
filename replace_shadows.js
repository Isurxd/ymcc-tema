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
      .replace(/shadow-\[8px_8px_0px_0px_rgba\(17,17,17,1\)\]/g, 'shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]')
      .replace(/shadow-\[8px_8px_0_0_#000\]/g, 'shadow-[4px_4px_0_0_#000]');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated shadow in', filePath);
    }
  }
});
