FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY packages/db/package.json packages/db/
COPY apps/web/package.json apps/web/
RUN cd packages/db && npm install
RUN cd apps/web && npm install

# Copy source
COPY packages/db/ packages/db/
COPY apps/web/ apps/web/

# Generate Prisma
RUN cd packages/db && npx prisma generate

# Build Next.js
RUN cd apps/web && npm run build

# Production
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/apps/web/.next /app/apps/web/.next
COPY --from=base /app/apps/web/public /app/apps/web/public
COPY --from=base /app/apps/web/node_modules /app/apps/web/node_modules
COPY --from=base /app/apps/web/package.json /app/apps/web/package.json
COPY --from=base /app/apps/web/next.config.js /app/apps/web/next.config.js

EXPOSE 3000

CMD ["npm", "run", "start", "--prefix", "apps/web"]
