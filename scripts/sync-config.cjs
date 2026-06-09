// 同步 app.config.json → 各端配置文件
// 运行: npm run sync-config

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'app.config.json'), 'utf-8'));

// 1. capacitor.config.ts
const capConfigPath = path.join(root, 'capacitor.config.ts');
let capConfig = fs.readFileSync(capConfigPath, 'utf-8');
capConfig = capConfig
  .replace(/appId:\s*'[^']*'/, `appId: '${config.appId}'`)
  .replace(/appName:\s*'[^']*'/, `appName: '${config.appName}'`);
fs.writeFileSync(capConfigPath, capConfig);
console.log('[Sync] capacitor.config.ts');

// 2. Android strings.xml
const stringsPath = path.join(root, 'android/app/src/main/res/values/strings.xml');
let strings = fs.readFileSync(stringsPath, 'utf-8');
strings = strings
  .replace(/<string name="app_name">[^<]*<\/string>/, `<string name="app_name">${config.appName}</string>`)
  .replace(/<string name="title_activity_main">[^<]*<\/string>/, `<string name="title_activity_main">${config.appName}</string>`)
  .replace(/<string name="package_name">[^<]*<\/string>/, `<string name="package_name">${config.appId}</string>`)
  .replace(/<string name="custom_url_scheme">[^<]*<\/string>/, `<string name="custom_url_scheme">${config.appId}</string>`);
fs.writeFileSync(stringsPath, strings);
console.log('[Sync] strings.xml');

// 3. Android build.gradle
const buildGradlePath = path.join(root, 'android/app/build.gradle');
let buildGradle = fs.readFileSync(buildGradlePath, 'utf-8');
buildGradle = buildGradle
  .replace(/versionCode\s+\d+/, `versionCode ${config.versionCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${config.version}"`);
fs.writeFileSync(buildGradlePath, buildGradle);
console.log('[Sync] build.gradle');

// 4. package.json
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
pkg.version = config.version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('[Sync] package.json');

// 5. index.html 标题
const htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');
html = html.replace(/<title>[^<]*<\/title>/, `<title>${config.appName}</title>`);
fs.writeFileSync(htmlPath, html);
console.log('[Sync] index.html');

console.log(`\n配置同步完成: ${config.appName} v${config.version}`);
