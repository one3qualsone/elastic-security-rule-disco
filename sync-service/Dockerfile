FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose ports (app + debug)
EXPOSE 8081 9230

# Start development server with debug
CMD ["npm", "run", "dev:debug"]