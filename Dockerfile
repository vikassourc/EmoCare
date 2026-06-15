FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy root package.json
COPY package.json ./

# Copy root package.json and client package.json
COPY package.json ./
COPY client/package.json client/

# Install root dependencies (which handles the server) and client dependencies
RUN npm install
RUN npm install --prefix client

# Copy the rest of the application
COPY . .

# Build the Vite React app
RUN npm run build --prefix client

# Expose the port the app runs on
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
