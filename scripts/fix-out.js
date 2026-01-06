const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    content = content.replace(/\u00E2\u20AC\u2122/g, "'");
    content = content.replace(/\u00E2\u20AC\u201C/g, '"');
    content = content.replace(/\u00E2\u20AC\u009D/g, '"');
    content = content.replace(/\u00E2\u20AC\u201D/g, '-');
    content = content.replace(/\u20AC\u201D/g, '-');
    content = content.replace(/\u00E2\u20AC\u2013/g, '-');
    content = content.replace(/\u00E2\u20AC\u2014/g, '-');
    content = content.replace(/\u2019\u20AC\u201D/g, "'");
    content = content.replace(/Jos\u00C3\u00A9/g, 'José');
    content = content.replace(/Jose\u00A9/g, 'Jose');
    content = content.replace(/\u00A9/g, '');
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (e) {}
  return false;
}

function walkDir(dir) {
  let fixed = 0;
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        fixed += walkDir(fullPath);
      } else if (/\.(html|js|json|css)$/.test(file.name)) {
        if (fixFile(fullPath)) fixed++;
      }
    }
  } catch (e) {}
  return fixed;
}

const fixed = walkDir('out');
console.log('Fixed', fixed, 'files');
