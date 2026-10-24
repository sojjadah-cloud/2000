# صورة الإنتاج لمنصة ألفين (Render / أي منصة Docker)
FROM node:22-bookworm-slim AS base
# Prisma يحتاج OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY scripts/copy-pdf-worker.mjs ./scripts/copy-pdf-worker.mjs
# postinstall يولّد عميل Prisma وينسخ عامل pdf.js
RUN npm ci --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=10000
COPY --from=build /app ./
# المستخدم node بدل root
RUN mkdir -p /app/storage && chown -R node:node /app/storage /app/.next
USER node
EXPOSE 10000
CMD ["node", "scripts/start-prod.mjs"]
