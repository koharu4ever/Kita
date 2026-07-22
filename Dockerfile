FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG MEDIA_R2_PUBLIC_URL=""
ARG MEDIA_STORAGE_MODE="local"
ENV MEDIA_R2_PUBLIC_URL="$MEDIA_R2_PUBLIC_URL"
ENV MEDIA_STORAGE_MODE="$MEDIA_STORAGE_MODE"
ENV SKIP_ENV_VALIDATION=true
RUN if [ "$MEDIA_STORAGE_MODE" = "r2" ] && [ -z "$MEDIA_R2_PUBLIC_URL" ]; then \
      echo "MEDIA_R2_PUBLIC_URL is required when building with MEDIA_STORAGE_MODE=r2" >&2; \
      exit 1; \
    fi \
  && pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/payload.config.ts ./payload.config.ts
COPY --from=builder /app/src/config/media-storage.ts ./src/config/media-storage.ts
COPY --from=builder /app/src/payload ./src/payload
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
