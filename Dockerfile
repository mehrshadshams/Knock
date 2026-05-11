FROM node:22-alpine

# Accept BUILD_HASH as build argument (defaults to 'dev' for local builds)
ARG BUILD_HASH=dev

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY public/ ./public/

# Inject version:hash into HTML at build time
# Reads version from package.json and injects with BUILD_HASH
RUN sed -i "s|APP_VERSION_HASH|1.0.0:${BUILD_HASH}|g" public/index.html

EXPOSE 3000

CMD ["node", "server.js"]
