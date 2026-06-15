FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy root package.json
COPY package.json ./

# Copy server and client package.json files to install dependencies
COPY server/package.json server/
COPY client/package.json client/

# Install dependencies for both server and client
RUN npm install --prefix server
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
