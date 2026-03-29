FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV NODE_OPTIONS=--max-old-space-size=512
RUN npx nest build banking

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist/apps/banking ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER node

CMD ["node", "dist/main.js"]
