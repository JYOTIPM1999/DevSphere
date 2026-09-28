# Use a lightweight version of Node 20
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install exactly what is in the lock file (cleaner and faster than npm install)
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Security: Run the app as a non-root user (built into the Node image)
USER node

# Expose the port the app runs on 
EXPOSE 3000

# Command to run the application
CMD [ "node", "src/index.js" ]