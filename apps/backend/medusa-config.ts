import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Modest pool: every shared module borrows a connection, and the default of 10
// is exhausted during migrations. Postgres accepts 100, so 20 leaves room for a
// second process while keeping a single app from monopolising the server.
const poolMax = Number(process.env.DB_POOL_MAX ?? 20)

module.exports = defineConfig({
  modules: [{ resolve: "./src/modules/selection-cart" }],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      pool: { min: 2, max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 20 }
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  }
})
