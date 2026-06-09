// 给所有 fixed inset-0 全屏覆盖页添加 top: var(--status-bar-height)
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('src/{pages,components}/**/*.tsx', { cwd: path.join(__dirname, '..') });

let fixed = 0;

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip modal dialogs (bg-black, bg-cream-900 backgrounds, items-center only)
    if (line.includes('bg-black') || line.includes('bg-cream-900')) continue;
    if (line.includes('items-center justify-center') && !line.includes('flex-col')) continue;
    // Only fixed inset-0 with flex-col
    if (!line.match(/fixed inset-0.*flex.*flex-col/)) continue;
    // Skip if already has status-bar-height
    if (content.includes('var(--status-bar-height')) continue;
    // Skip desktop responsive (md:relative)
    if (line.includes('md:relative')) continue;

    // Already has style prop?
    const hasStyle = line.includes('style=') || (lines[i+1] && lines[i+1].includes('style='));

    if (!hasStyle) {
      // Add style prop on next line
      const indent = line.match(/^(\s*)/)[1];
      lines.splice(i + 1, 0, `${indent}  style={{ top: 'var(--status-bar-height, 0px)' }}`);
      modified = true;
      fixed++;
    }
    // If already has style, skip to avoid breaking existing code
  }

  if (modified) {
    fs.writeFileSync(fullPath, lines.join('\n'));
  }
});

console.log(`Fixed ${fixed} overlay pages`);
