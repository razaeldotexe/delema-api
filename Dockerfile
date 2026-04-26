# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.47.0-focal

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the project
RUN pnpm run build

# Playwright environment variables
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/main.js"]
