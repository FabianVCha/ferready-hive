# Medusa backend. Build context is the repository root.
FROM node:24-bookworm-slim

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

WORKDIR /app

# The app links the shared schema package through a relative file: dependency.
COPY packages/catalog-schema ./packages/catalog-schema
COPY apps/backend/package.json apps/backend/package-lock.json ./apps/backend/
RUN cd apps/backend && npm ci --include=dev --no-audit --no-fund

# The catalog importer reads ../../data/approved/catalog.json from the app dir.
COPY data ./data
COPY apps/backend ./apps/backend

RUN cd apps/backend && npm run build

ENV NODE_ENV=production
EXPOSE 9000

# `medusa start` serves the admin build relative to the working directory, so it
# must run from the compiled output. Dependencies resolve upwards to the app.
CMD ["sh", "-c", "cd /app/apps/backend/.medusa/server && exec npx medusa start"]
