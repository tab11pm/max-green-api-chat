import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const greenApiUrl = env.GREEN_API_URL ?? 'https://api.green-api.com'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/green-api': {
          target: greenApiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/green-api/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
