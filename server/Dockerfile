# Use lightweight Node.js base image
FROM node:20-alpine

# Install native dependencies required by Prisma's Node client
RUN apk add --no-cache \
  openssl \
  libc6-compat \
  bash \
  python3 \
  make \
  g++

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Prisma client is used as a library, still needs generation
RUN npx prisma generate

# Expose app port
EXPOSE 3000

# Start your app
CMD ["npm", "run", "start"]