FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx nest build banking

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist/apps/banking ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER node

EXPOSE 3002

CMD ["node", "dist/main.js"]
