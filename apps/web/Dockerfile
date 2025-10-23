FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
WORKDIR /app

COPY package.json yarn.lock ./

COPY apps/web/package.json ./apps/web/package.json
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY apps/web/index.html ./apps/web/index.html
COPY apps/web/vite.config.ts ./apps/web/vite.config.ts
COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY apps/web/tsconfig.app.json ./apps/web/tsconfig.app.json
COPY apps/web/tsconfig.node.json ./apps/web/tsconfig.node.json
COPY apps/web/components.json ./apps/web/components.json

RUN yarn install --frozen-lockfile

WORKDIR /app/apps/web
RUN yarn build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 reactjs

COPY --from=builder --chown=reactjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=reactjs:nodejs /app/apps/web/dist ./dist
COPY --from=builder --chown=reactjs:nodejs /app/apps/web/package.json ./package.json

USER reactjs

EXPOSE 5173

ENV NODE_ENV=production
ENV PORT=5173

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]