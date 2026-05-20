# ── Stage 1: Build ──
FROM node:18-alpine AS build

WORKDIR /app

# ── Memory optimizations for t3.micro (1GB RAM) ──
# Cap Node heap at 512MB — leaves room for OS + npm + Docker
ENV NODE_OPTIONS=--max-old-space-size=512
# Skip source maps (biggest memory hog during build)
ENV GENERATE_SOURCEMAP=false
# Disable eslint during build to save ~100MB RAM
ENV DISABLE_ESLINT_PLUGIN=true
ENV ESLINT_NO_DEV_ERRORS=true
# Don't inline images as base64 (reduces memory during bundling)
ENV IMAGE_INLINE_SIZE_LIMIT=0
# Emit runtime chunk as separate file (less memory for webpack)
ENV INLINE_RUNTIME_CHUNK=false
# CI mode — no interactive prompts, warnings don't block
ENV CI=true

# Install production dependencies only, skip optional deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts \
    && npm cache clean --force

# Copy source and build
COPY . .
RUN npm run build \
    && rm -rf node_modules


# ── Stage 2: Serve with Nginx (final image ~25MB) ──
FROM nginx:1.27-alpine

# Remove default configs
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy full nginx config (replaces main config)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy only the built static files
COPY --from=build /app/build /usr/share/nginx/html

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
