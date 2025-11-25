# Local Deployment Guide

Simple steps to deploy and run the application locally.

## Prerequisites

- Configure backend database settings in `application.yml` to use your local database
- On macOS, if you encounter security warnings about "fsevents.node", go to System Settings → Privacy & Security → Allow access to this file

## Deployment Steps

### 0. Initial Setup (Run only if first startup fails)
```bash
./smart-switch-backend.sh local
```

### 1. Build Frontend
```bash
npm run build
```

### 2. Start Frontend
```bash
npm start
```

### 3. Start Backend (in a new terminal)
```bash
cd backend1
mvn spring-boot:run
```

## Notes

- Make sure your local database is running before starting the backend
- The frontend will typically run on `http://localhost:3000`
- The backend will run on `http://localhost:8080`
- If you encounter permission issues on macOS, check System Settings → Privacy & Security