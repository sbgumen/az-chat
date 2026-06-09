// 修复所有 overlay 页面的顶部栏 — 处理 pt-3, pt-2.5, py-3, py-2.5
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

function processFile(fullPath) {
  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;

  // 顶部栏: flex items-center + px- + (pt-N/py-N) + ... + flex-shrink-0
  // 匹配顶部栏，允许 pt-N 或 py-N 之间有任何其他 class
  const patterns = [
    { old: 'px-3 pt-2.5', new: 'px-3 pt-[calc(var(--status-bar-height,0px)+10px)]' },
    { old: 'px-4 pt-3', new: 'px-4 pt-[calc(var(--status-bar-height,0px)+12px)]' },
    { old: 'px-3 py-2.5', new: 'px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5' },
    { old: 'px-4 py-3', new: 'px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3' },
    { old: 'px-5 pt-3', new: 'px-5 pt-[calc(var(--status-bar-height,0px)+12px)]' },
    { old: 'px-5 py-3', new: 'px-5 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3' },
    { old: 'px-4 py-2.5', new: 'px-4 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5' },
  ];

  for (const { old, new: repl } of patterns) {
    if (content.includes(old)) {
      content = content.split(old).join(repl);
      modified = true;
    }
  }

  // Also handle Tailwind utility classes: pt-3 → pt-[calc(var(--status-bar-height,0px)+12px)]
  // but only when part of a header (with flex-shrink-0 or border-b nearby)
  // pt-3 = 12px
  if (content.includes('pt-3 ')) {
    content = content.replace(/(flex items-center[^"]*pt-)3(\s[^"]*flex-shrink-0)/g, '$1[calc(var(--status-bar-height,0px)+12px)]$2');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    return true;
  }
  return false;
}

let fixed = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.tsx') && processFile(full)) {
      fixed++;
      console.log('  Fixed:', path.relative(root, full));
    }
  }
}
walk(path.join(root, 'src', 'pages'));
walk(path.join(root, 'src', 'components'));
console.log(`\nFixed ${fixed} files.`);
