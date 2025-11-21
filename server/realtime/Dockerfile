# server/realtime/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --production=false

COPY . .

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist

# copy track sectors so runtime can read them
COPY --from=builder /app/public /app/public

EXPOSE 8081

CMD ["node", "dist/index.js"]

