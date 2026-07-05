FROM node:20-slim

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV PORT=8080
EXPOSE 8080
CMD ["pnpm", "start"]
