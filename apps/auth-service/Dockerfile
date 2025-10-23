FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/auth-service/.env ./apps/auth-service/.env

COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/logger/src ./packages/logger/src
COPY packages/logger/tsconfig.json ./packages/logger/tsconfig.json

COPY apps/auth-service/package.json ./apps/auth-service/package.json
COPY apps/auth-service/src ./apps/auth-service/src
COPY apps/auth-service/tsconfig.json ./apps/auth-service/tsconfig.json
COPY apps/auth-service/tsconfig.build.json ./apps/auth-service/tsconfig.build.json
COPY apps/auth-service/nest-cli.json ./apps/auth-service/nest-cli.json

RUN yarn install --frozen-lockfile

WORKDIR /app/packages/logger
RUN yarn build

WORKDIR /app/apps/auth-service
RUN yarn build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nestjs:nodejs /app/packages/logger/dist ./node_modules/@repo/logger/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/logger/package.json ./node_modules/@repo/logger/package.json

COPY --from=builder --chown=nestjs:nodejs /app/apps/auth-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/auth-service/package.json ./package.json

USER nestjs

EXPOSE 3334

ENV NODE_ENV=production
ENV PORT=3334

CMD ["node", "dist/main.js"]