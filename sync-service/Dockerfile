FROM node:18-alpine

WORKDIR /app

# Copy package files and tsconfig
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (nodemon is in devDependencies)
RUN npm install --silent

# Copy source code
COPY . .

# Expose ports (app + debug)
EXPOSE 8081 9230

# Start development server
CMD ["npm", "run", "dev"]