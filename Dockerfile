# Use Python 3.11 slim as the base image
FROM python:3.11-slim

# Install system dependencies and Node.js (v20)
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy dependency files first to leverage Docker cache
COPY package*.json ./
COPY requirements.txt ./

# Install Node and Python dependencies
RUN npm install
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Build the Vite React frontend
RUN npm run build

# Expose the port the Node server runs on
EXPOSE 3001

# Start both Express and Django concurrently
CMD ["npm", "start"]
