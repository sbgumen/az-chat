const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const replacements = [
  ['px-3 py-2.5 backdrop-blur-xl border-b flex-shrink-0', 'px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5 backdrop-blur-xl border-b flex-shrink-0'],
  ['px-3 py-3 bg-white/95 backdrop-blur-xl border-b border-cream-200/60 flex-shrink-0', 'px-3 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-white/95 backdrop-blur-xl border-b border-cream-200/60 flex-shrink-0'],
  ['px-4 py-3 border-b border-cream-200', 'px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-200'],
  ['px-4 py-3 bg-white border-b border-black/5', 'px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-white border-b border-black/5'],
  ['px-4 py-3 flex-shrink-0', 'px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0'],
  ['px-4 py-3 border-b border-cream-100', 'px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-100'],
  ['px-3 py-2.5 flex-shrink-0', 'px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5 flex-shrink-0'],
  ['px-3 py-2.5 bg-white/90 backdrop-blur-xl border-b border-cream-300/60 flex-shrink-0', 'px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5 bg-white/90 backdrop-blur-xl border-b border-cream-300/60 flex-shrink-0'],
  ['px-4 pt-2.5 pb-3', 'px-4 pt-[calc(var(--status-bar-height,0px)+10px)] pb-3'],
  ['px-3 pt-2.5 pb-3', 'px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-3'],
  ['px-3 pt-2.5 pb-2', 'px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2'],
  ['px-5 pt-[20px] pb-3 flex-shrink-0', 'px-5 pt-[calc(var(--status-bar-height,0px)+20px)] pb-3 flex-shrink-0'],
  ['px-4 pt-[8px] pb-2 flex-shrink-0 bg-cream-50', 'px-4 pt-[calc(var(--status-bar-height,0px)+8px)] pb-2 flex-shrink-0 bg-cream-50'],
  ['px-4 pt-2.5 pb-3 flex-shrink-0', 'px-4 pt-[calc(var(--status-bar-height,0px)+10px)] pb-3 flex-shrink-0'],
];

let fixed = 0;
function processFile(fullPath) {
  let content = fs.readFileSync(fullPath, 'utf-8');
  for (const [old, repl] of replacements) {
    if (content.includes(old)) {
      content = content.split(old).join(repl);
      fixed++;
      break;
    }
  }
  fs.writeFileSync(fullPath, content);
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.tsx')) processFile(full);
  }
}
walk(path.join(root, 'src', 'pages'));
walk(path.join(root, 'src', 'components'));
console.log(`Fixed ${fixed} files.`);
