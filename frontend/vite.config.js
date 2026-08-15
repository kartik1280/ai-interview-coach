import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function copyVadAssetsPlugin() {
  return {
    name: 'copy-vad-assets',
    buildStart() {
      const targets = [
        {
          srcDir: path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist'),
          destDir: path.resolve(__dirname, 'public'),
          exts: ['.js', '.onnx']
        },
        {
          srcDir: path.resolve(__dirname, 'node_modules/onnxruntime-web/dist'),
          destDir: path.resolve(__dirname, 'public'),
          exts: ['.wasm']
        }
      ];

      for (const target of targets) {
        if (fs.existsSync(target.srcDir)) {
          if (!fs.existsSync(target.destDir)) {
            fs.mkdirSync(target.destDir, { recursive: true });
          }
          const files = fs.readdirSync(target.srcDir);
          for (const file of files) {
            if (target.exts.some(ext => file.endsWith(ext))) {
              fs.copyFileSync(path.join(target.srcDir, file), path.join(target.destDir, file));
            }
          }
        }
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyVadAssetsPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
