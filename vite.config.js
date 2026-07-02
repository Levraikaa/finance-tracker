import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* En dev, `vite` ne sert pas le dossier /api (fonctions serverless Vercel).
   Ce plugin branche /api/advisor sur le même handler afin de tester le
   Conseiller IA en local. La clé est lue depuis un fichier .env (gitignoré) :
   ajoute `ANTHROPIC_API_KEY=sk-ant-...` dedans. En production, Vercel exécute
   /api/advisor.js nativement avec la variable d'env du projet. */
function apiDevServer() {
  return {
    name: 'kaafinance-api-dev',
    apply: 'serve',
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), '')
      for (const key of ['ANTHROPIC_API_KEY', 'ADVISOR_MODEL']) {
        if (env[key] && !process.env[key]) process.env[key] = env[key]
      }
    },
    configureServer(server) {
      server.middlewares.use('/api/advisor', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        try {
          const mod = await server.ssrLoadModule('/api/advisor.js')
          await mod.default(req, res)
        } catch (err) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'dev_handler_error',
              message: String(err?.message || err),
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevServer()],
})
