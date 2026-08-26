# Syntax: docker/dockerfile:1
FROM node:24.14.1-alpine3.23 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.28.3-alpine3.23
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup -S -g 10001 appgroup && \
    adduser -S -D -H -u 10001 -G appgroup appuser && \
    touch /var/run/nginx.pid && \
    chown -R 10001:10001 /var/run/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html

USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
