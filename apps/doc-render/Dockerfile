FROM node:20-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-core libreoffice-calc \
      fonts-dejavu fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# package.json declares the few prod deps; lockfile included for traceability,
# but --no-frozen-lockfile is used because this image installs a single-app
# subset, not the workspace.
COPY package.json ./
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate \
    && pnpm install --prod --no-frozen-lockfile

COPY src ./src
COPY tsconfig.json ./
RUN pnpm add -D typescript@5.5.4 && pnpm exec tsc

ENV LIBREOFFICE_BIN=/usr/bin/libreoffice
ENV DOC_RENDER_PORT=3017
EXPOSE 3017
CMD ["node", "dist/server.js"]
