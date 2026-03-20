FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
RUN cd packages/db && npm install
RUN cd apps/api && npm install

# Copy source
COPY packages/db/ packages/db/
COPY apps/api/ apps/api/

# Generate Prisma client
RUN cd packages/db && npx prisma generate

# Build
RUN cd apps/api && npm run build

# Production
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/packages/db /app/packages/db
COPY --from=base /app/apps/api/dist /app/apps/api/dist
COPY --from=base /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=base /app/apps/api/package.json /app/apps/api/package.json
COPY --from=base /app/packages/db/node_modules /app/packages/db/node_modules

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
