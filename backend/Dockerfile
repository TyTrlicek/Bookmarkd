# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies (including dev for Prisma)
COPY package.json package-lock.json ./
RUN npm install

# Copy app source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copy only node_modules and app code from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app ./

EXPOSE 7000

CMD ["node", "server.js"]
