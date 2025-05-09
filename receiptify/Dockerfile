# # Taking a parent image of node 18
# FROM node:18-alpine

# # Set working directory
# WORKDIR /app

# # Accept build-time arg
# ARG REACT_APP_API_GATEWAY_URL

# # Set it as environment variable so React can access it during build
# ENV REACT_APP_API_GATEWAY_URL=$REACT_APP_API_GATEWAY_URL

# # Copy package.json and package-lock.json file and install dependencies
# COPY package.json /app/package.json
# COPY package-lock.json /app/package-lock.json
# RUN npm clean-install

# COPY . /app
# RUN npm run build

# # Install the serve tool
# RUN npm install -g serve

# # Exposing the port of React Application
# EXPOSE 3000

# # Run the React App (Serve the Frontend build)
# ENTRYPOINT ["serve", "-s", "build"]

# Use Node 18 as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm clean-install

# Copy the rest of the app and build it
COPY . /app
RUN npm run build

# Install Express for the server
RUN npm install express

# Copy the server script
COPY server.js /app/server.js

# Expose port 3000 (default for Elastic Beanstalk Docker)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]