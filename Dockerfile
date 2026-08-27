FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.33.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_FIREFLY_URL=""
RUN pnpm exec tsr generate && pnpm exec vite build && pnpm exec tsc

FROM nginx:alpine

RUN apk add --no-cache gettext

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

ENV FIREFLY_URL="https://localhost:8080"
ENV VITE_FIREFLY_URL=""

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
