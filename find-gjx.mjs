import fs from 'fs';
import path from 'path';

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else {
      if (file.includes('GJX')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const res = walkDir("C:\\Users\\ASUS\\Documents\\YMCC VII\\ASSET FOTO\\KATALOG YMCC");
console.log(JSON.stringify(res, null, 2));
