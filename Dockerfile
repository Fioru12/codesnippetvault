FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider -S http://localhost:3002/api/health 2>&1 | grep "200 OK" || exit 1

CMD ["node", "server.js"]
