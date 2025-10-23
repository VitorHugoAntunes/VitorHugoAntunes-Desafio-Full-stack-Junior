FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/api-gateway/.env ./apps/api-gateway/.env

COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/logger/src ./packages/logger/src
COPY packages/logger/tsconfig.json ./packages/logger/tsconfig.json

COPY apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY apps/api-gateway/src ./apps/api-gateway/src
COPY apps/api-gateway/tsconfig.json ./apps/api-gateway/tsconfig.json
COPY apps/api-gateway/tsconfig.build.json ./apps/api-gateway/tsconfig.build.json
COPY apps/api-gateway/nest-cli.json ./apps/api-gateway/nest-cli.json

RUN yarn install --frozen-lockfile

WORKDIR /app/packages/logger
RUN yarn build

WORKDIR /app/apps/api-gateway
RUN yarn build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nestjs:nodejs /app/packages/logger/dist ./node_modules/@repo/logger/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/logger/package.json ./node_modules/@repo/logger/package.json

COPY --from=builder --chown=nestjs:nodejs /app/apps/api-gateway/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api-gateway/package.json ./package.json

USER nestjs

EXPOSE 3333

ENV NODE_ENV=production
ENV PORT=3333

CMD ["node", "dist/main.js"]