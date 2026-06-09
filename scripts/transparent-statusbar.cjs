// 统一全页面透明状态栏方案
// 1. 移除 overlay 容器的 top 偏移
// 2. overlay header 加 safe-area padding
// 3. 主页面 header 加 safe-area padding
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');

let modified = 0;

// 递归处理目录
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(fullPath);
    else if (entry.name.endsWith('.tsx')) processFile(fullPath);
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Step 1: 移除 overlay 容器的 top: var(--status-bar-height)
  // 匹配 style={{ top: 'var(--status-bar-height, 0px)' }}
  if (content.includes("top: 'var(--status-bar-height, 0px)'")) {
    // 完整 style prop: style={{ top: 'var(--status-bar-height, 0px)' }}
    content = content.replace(/style=\{\{ top: 'var\(--status-bar-height, 0px\)' \}\}/g, '');
    // style 中有 top + 其他属性: style={{ top: '...', ... }}
    content = content.replace(/style=\{\{ top: 'var\(--status-bar-height, 0px\)', /g, 'style={{ ');
    // style 中 top 在中间: , top: 'var(--status-bar-height, 0px)',
    content = content.replace(/, top: 'var\(--status-bar-height, 0px\)'/g, '');
    changed = true;
  }

  // Step 2: 移除空 style props
  content = content.replace(/style=\{\{ \}\}/g, '');
  content = content.replace(/style=\{\{\}\}/g, '');

  // Step 3: overlay/full-page header: pt-[Npx] → pt-[calc(var(--status-bar-height,0px)+Npx)]
  // 只替换 header 元素或带有 backdrop-blur 的顶部栏
  // 匹配 pt-[8px], pt-[12px], pt-[10px], pt-[20px], pt-[52px]
  const ptPatterns = [8, 10, 12, 20, 52];
  for (const n of ptPatterns) {
    const old = `pt-[${n}px]`;
    const replacement = `pt-[calc(var(--status-bar-height,0px)+${n}px)]`;
    if (content.includes(old)) {
      content = content.split(old).join(replacement);
      changed = true;
    }
  }

  // Step 4: 对 py-2.5 或 py-3 的 header，拆分为 pt + pb
  // py-2.5 → pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5
  if (content.includes('py-2.5')) {
    content = content.replace(/py-2\.5/g, 'pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5');
    changed = true;
  }
  // py-3 → pt-[calc(var(--status-bar-height,0px)+12px)] pb-3
  if (content.includes('py-3 ')) {
    content = content.replace(/py-3 /g, 'pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 ');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    modified++;
    console.log('  Modified:', path.relative(root, filePath));
  }
}

console.log('Processing all .tsx files...');
walkDir(srcDir);
console.log(`\nModified ${modified} files.`);
