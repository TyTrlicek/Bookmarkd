# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production
COPY . .

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copy only production dependencies
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app ./

EXPOSE 7000

CMD ["node", "server.js"] 
