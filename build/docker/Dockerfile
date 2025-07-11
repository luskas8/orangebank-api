FROM node:22-alpine as development

# Working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy Prisma schema
COPY prisma ./prisma

# Copy entrypoint script
COPY ./build/docker/entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npm run prisma:generate

# Copy the application code
COPY . .

# Start the application
ENTRYPOINT ["./entrypoint.sh"]