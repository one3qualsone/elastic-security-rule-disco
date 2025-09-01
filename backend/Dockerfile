FROM node:18-alpine

WORKDIR /app

# Install development dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install -g nodemon && npm install

# Copy source code
COPY . .

# Expose ports (app + debug)
EXPOSE 3001 9229

# Start development server with debug
CMD ["npm", "run", "dev:debug"]