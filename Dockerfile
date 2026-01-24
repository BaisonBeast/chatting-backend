# Use Node.js official image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Build TS files
RUN npm run build

# Expose the API port
EXPOSE 5000

# Start command
CMD [ "npm", "start" ]
