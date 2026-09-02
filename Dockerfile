FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.33.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_FIREFLY_URL=""
RUN pnpm exec tsr generate && pnpm exec vite build && pnpm exec tsc

FROM node:22-alpine

RUN npm install -g vite

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY vite.preview.config.ts ./vite.config.ts

ENV VITE_FIREFLY_URL=""

EXPOSE 80

CMD ["vite", "preview", "--port", "80", "--host"]
