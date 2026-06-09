// 只修复 overlay page 的 header 元素: py-2.5/py-3 → pt safe-area + pb
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
let fixed = 0;

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full);
    else if (entry.name.endsWith('.tsx')) processFile(full);
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // 只替换 <header> 标签内的 py-2.5 和 py-3
  const headerPy25 = /<header([^>]*)py-2\.5([^>]*)>/g;
  if (headerPy25.test(content)) {
    content = content.replace(headerPy25, '<header$1pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5$2>');
    changed = true;
  }

  const headerPy3 = /<header([^>]*)py-3([^>]*)>/g;
  if (headerPy3.test(content)) {
    content = content.replace(headerPy3, '<header$1pt-[calc(var(--status-bar-height,0px)+12px)] pb-3$2>');
    changed = true;
  }

  // 也修复顶部栏 div（backdrop-blur + border-b 的显然是 header）
  const topBarPy25 = /<div([^>]*backdrop-blur[^>]*)py-2\.5([^>]*flex-shrink-0[^>]*)>/g;
  if (topBarPy25.test(content)) {
    content = content.replace(topBarPy25, '<div$1pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5$2>');
    changed = true;
  }

  const topBarPy3 = /<div([^>]*backdrop-blur[^>]*)py-3([^>]*flex-shrink-0[^>]*)>/g;
  if (topBarPy3.test(content)) {
    content = content.replace(topBarPy3, '<div$1pt-[calc(var(--status-bar-height,0px)+12px)] pb-3$2>');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    fixed++;
    console.log('  Fixed:', path.relative(root, filePath));
  }
}

walkDir(srcDir);
console.log(`\nFixed ${fixed} files.`);
