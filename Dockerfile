FROM node:20-slim

# Install system dependencies for Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 \
    libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
    xdg-utils libxss1 libxtst6 libpango-1.0-0 libpangocairo-1.0-0 \
    libcairo2 libgdk-pixbuf2.0-0 libglib2.0-0 libuuid1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./
RUN npm install
RUN npx playwright install chromium

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Ensure recordings directory exists (writable at runtime)
RUN mkdir -p public/data/recordings

EXPOSE 3001
CMD ["node", "interaction-server.cjs"]
