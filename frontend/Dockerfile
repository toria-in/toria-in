FROM node:19

WORKDIR /app

# Copy package.json only (removed yarn.lock)
COPY package.json ./

# Install dependencies with npm instead of yarn
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port that Expo runs on
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002
EXPOSE 8081

# Start the Expo development server
CMD ["npm", "start"]
