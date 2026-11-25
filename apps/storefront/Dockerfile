# Next.js storefront. Build context is the repository root.
FROM node:24-bookworm-slim

# NODE_ENV must stay unset for `next build`; it forces development behaviour and
# breaks the global-error prerender. Dev dependencies are installed explicitly.
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# The app links the shared schema package through a relative file: dependency.
COPY packages/catalog-schema ./packages/catalog-schema
COPY apps/storefront/package.json apps/storefront/package-lock.json ./apps/storefront/
RUN cd apps/storefront && npm ci --include=dev --no-audit --no-fund

# Catalog JSON and product media are imported at build time and read at runtime.
COPY data ./data
COPY apps/storefront ./apps/storefront

RUN cd apps/storefront && npm run build

ENV NODE_ENV=production
EXPOSE 8000

CMD ["npm", "--prefix", "apps/storefront", "run", "start"]
