# Toria Travel Planning App

A complete travel planning and discovery platform with Instagram-style reel exploration, AI-powered itinerary planning, and a travel buddy chatbot.

## Features

- Instagram-style travel reels discovery
- AI-powered travel itinerary planning
- Location-based recommendations
- Travel buddy chatbot
- User notifications and day planning

## Architecture

- **Frontend**: React Native (Expo) mobile application
- **Backend**: FastAPI (Python) API server
- **Database**: MongoDB

## Running with Docker

### Prerequisites

- Docker and Docker Compose installed on your machine
- Google Generative AI API key (for the chatbot functionality)
- MongoDB running on your local machine (or accessible via network)

### Environment Variables

#### Backend Environment Variables

The backend requires these environment variables:

- `MONGO_URL`: MongoDB connection string (default: 'mongodb://host.docker.internal:27017')
- `EMERGENT_LLM_KEY`: API key for Google Generative AI

#### Frontend Environment Variables

The frontend requires:

- `EXPO_PUBLIC_BACKEND_URL`: URL to connect to the backend API (default: 'http://localhost:8001')
- `EXPO_DEVTOOLS_LISTEN_ADDRESS`: Set to '0.0.0.0' to make DevTools accessible outside container
- `REACT_NATIVE_PACKAGER_HOSTNAME`: Set to 'localhost' for proper connection

### Running the Application

1. **Start the application:**

```bash
docker-compose up --build
```

2. **Access the application:**

- Frontend (Expo): http://localhost:19002
  - From here you can run the app on web, iOS simulator, Android emulator, or scan the QR code with Expo Go on your device
- Backend API: http://localhost:8001
- API documentation: http://localhost:8001/docs

3. **Stop the application:**

```bash
docker-compose down
```

### Authentication System

The app includes a mock authentication system for local development:

- **Default Test Account**:
  - Email: user@example.com
  - Password: password123
  
- **Features**:
  - Sign up with email, password, and name
  - Sign in with email and password
  - Persistent sessions using AsyncStorage
  - User profile management

Since this is a development build, you can use any email/password combination for testing as the system doesn't perform actual validation against a real authentication backend.

### Troubleshooting

If you encounter any issues while running the application, try the following solutions:

#### Docker Build Failures

- **Package Installation Errors**: Some Python packages require build tools. The Dockerfile includes the necessary tools, but if you encounter errors, check the backend Dockerfile to ensure build-essential and gcc are installed.

- **Private Package Errors**: If you see errors about missing private packages (like `emergentintegrations`), check the requirements.txt file and comment out any private packages that aren't available on PyPI.

#### Frontend Issues

- **Module Resolution Errors**: If you see errors like "Cannot find module", ensure that the file exists in the correct location. The app expects certain files in specific directories.

- **Import Errors**: If you encounter export/import errors, check for duplicate exports in files or missing default exports for components used with Expo Router.

#### MongoDB Connection

- If the backend can't connect to MongoDB, make sure:
  - Your MongoDB instance is running and accessible
  - The `MONGO_URL` environment variable is correctly set to `mongodb://host.docker.internal:27017`
  - The backend container has the `extra_hosts` option configured with `host.docker.internal:host-gateway`

## Development Guidelines

When developing new features for the app:

1. **Frontend**: Add components in the appropriate directories and update imports as needed.
2. **Backend**: Add new endpoints in server.py or create new modules for complex functionality.
3. **Authentication**: The mock authentication system can be replaced with a real Firebase implementation in the future.

## Customizing Environment Variables

All environment variables are set in the `docker-compose.yml` file. To change them:

1. Edit the `docker-compose.yml` file
2. Update the environment section for each service
3. Rebuild and restart the containers:

```bash
docker-compose up --build
```

## Development

The Docker setup includes volume mounts for both frontend and backend, so changes you make to your code will be reflected without rebuilding the containers.

- Frontend: Changes should hot-reload
- Backend: You may need to restart the backend container: `docker-compose restart backend`

## Troubleshooting

- **Expo Connection Issues**: If you have trouble connecting to Expo from a mobile device, ensure the `REACT_NATIVE_PACKAGER_HOSTNAME` environment variable is set to your computer's local IP address.
- **Port Conflicts**: If you have services already using ports 19000-19002, 8001, or 27017, modify the port mappings in `docker-compose.yml`.
- **MongoDB Connection**: If the backend can't connect to MongoDB, check that the `MONGO_URL` environment variable in the backend service is correctly pointing to `mongo:27017`.
