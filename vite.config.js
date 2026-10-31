import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // The prerenderer and client build must share scoped CSS identifiers.
  plugins: [vue({ features: { componentIdGenerator: 'filepath' } })],
  build: {
    manifest: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'firebase-firestore', test: /node_modules[\\/]@firebase[\\/]firestore/, priority: 30 },
            { name: 'firebase-auth', test: /node_modules[\\/]@firebase[\\/]auth/, priority: 30 },
            { name: 'icons', test: /node_modules[\\/]@fortawesome/, priority: 20 },
            { name: 'vue', test: /node_modules[\\/](?:@vue|vue|vue-router|pinia)[\\/]/, priority: 20 }
          ]
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
