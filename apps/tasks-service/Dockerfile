FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/tasks-service/.env ./apps/tasks-service/.env

COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/logger/src ./packages/logger/src
COPY packages/logger/tsconfig.json ./packages/logger/tsconfig.json

COPY apps/tasks-service/package.json ./apps/tasks-service/package.json
COPY apps/tasks-service/src ./apps/tasks-service/src
COPY apps/tasks-service/tsconfig.json ./apps/tasks-service/tsconfig.json
COPY apps/tasks-service/tsconfig.build.json ./apps/tasks-service/tsconfig.build.json
COPY apps/tasks-service/nest-cli.json ./apps/tasks-service/nest-cli.json

RUN yarn install --frozen-lockfile

WORKDIR /app/packages/logger
RUN yarn build

WORKDIR /app/apps/tasks-service
RUN yarn build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nestjs:nodejs /app/packages/logger/dist ./node_modules/@repo/logger/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/logger/package.json ./node_modules/@repo/logger/package.json

COPY --from=builder --chown=nestjs:nodejs /app/apps/tasks-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/tasks-service/package.json ./package.json

USER nestjs

EXPOSE 3335

ENV NODE_ENV=production
ENV PORT=3335

CMD ["node", "dist/main.js"]