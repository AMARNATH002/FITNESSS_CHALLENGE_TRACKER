const fs = require('fs');
const path = require('path');

// Find all JS files in frontend/src
function findJSFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

const jsFiles = findJSFiles('./frontend/src');

jsFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // Replace localhost URLs
    content = content.replace(/http:\/\/localhost:5000/g, '');

    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      console.log(`Updated: ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log('Finished updating API URLs');
