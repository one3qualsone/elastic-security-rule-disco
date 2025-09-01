FROM node:18-alpine

WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (nodemon is in devDependencies, so it will be installed)
RUN npm install --silent

# Copy source code
COPY . .

# Expose ports (app + debug)
EXPOSE 3001 9229

# Start development server
CMD ["npm", "run", "dev"]