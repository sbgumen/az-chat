import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 文件协议（file://）兼容构建配置
// 使用 `npm run build:standalone` 打包出可直接双击运行的版本
// 不影响 `npm run dev` 开发模式

export default defineConfig(({ mode }) => {
  const isStandalone = mode === 'standalone'
  return {
    plugins: [
      react(),
      ...(isStandalone ? [viteSingleFile()] : []),
    ],
    server: {
      port: 5000,
      host: '0.0.0.0',
    },
    base: isStandalone ? './' : '/',
    define: isStandalone ? { __STANDALONE__: JSON.stringify(true) } : undefined,
    build: isStandalone ? {
      rollupOptions: {
        output: {
          format: 'iife',
          inlineDynamicImports: true,
        },
      },
    } : undefined,
  }
})
