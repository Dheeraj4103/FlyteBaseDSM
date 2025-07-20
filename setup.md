# FlyteBase DSM - Setup Guide

This guide will help you set up and run the FlyteBase Drone Survey Management System locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (v5.0 or higher)
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd FlyteBaseDSM
```

### 2. Database Setup

1. **Set up MongoDB Database**

   ```bash
   # Option 1: MongoDB Atlas (Recommended for development)
   # 1. Go to https://www.mongodb.com/atlas
   # 2. Create a free account and cluster
   # 3. Get your connection string
   # 4. Replace username, password, and cluster in .env file

   # Option 2: Local MongoDB
   # Start MongoDB service
   # On Windows: MongoDB should be running as a service
   # On macOS: brew services start mongodb-community
   # On Linux: sudo systemctl start mongod
   ```

2. **Set up Backend Environment**

   ```bash
   cd backend
   cp env.example .env
   ```

3. **Edit the `.env` file** with your database credentials:

   ```env
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/flytebase_dsm?retryWrites=true&w=majority"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   PORT=3001
   NODE_ENV=development
   ```

` ```

4. **Install Backend Dependencies**

   ```bash
   npm install
   ```

5. **Set up Database Schema**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Seed Initial Data (Optional)**
   ```bash
   # Create a seed script to add initial users and test data
   npm run seed
   ```

### 3. Frontend Setup

1. **Set up Frontend Environment**

   ```bash
   cd ../frontend
   cp .env.example .env
   ```

2. **Edit the frontend `.env` file**:

   ```env
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_MAPBOX_TOKEN=your-mapbox-token
   ```

3. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

### 4. Start the Application

1. **Start Backend Server** (Terminal 1)

   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Server** (Terminal 2)

   ```bash
   cd frontend
   npm start
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs

## Default Credentials

After setup, you can create a user using the registration endpoint or use these demo credentials:

```
Email: admin@flytebase.com
Password: password123
```

## Project Structure

```
FlyteBaseDSM/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── websocket/       # WebSocket setup
│   ├── prisma/              # Database schema
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── package.json
└── README.md
```

## Key Features Implemented

### Backend Features

- ✅ **Authentication System** - JWT-based auth with role-based access
- ✅ **Database Schema** - Complete Prisma schema with all entities
- ✅ **API Endpoints** - Full CRUD operations for all resources
- ✅ **Mission Management** - Create, update, delete, and control missions
- ✅ **Fleet Management** - Drone inventory and status tracking
- ✅ **Site Management** - Survey site configuration
- ✅ **Real-time Updates** - WebSocket integration for live updates
- ✅ **Analytics** - Comprehensive reporting and analytics
- ✅ **Validation** - Request validation using Zod
- ✅ **Error Handling** - Centralized error handling
- ✅ **Logging** - Structured logging with Winston

### Frontend Features

- ✅ **Modern UI** - React 18 with TypeScript and Tailwind CSS
- ✅ **Authentication** - Login/logout with protected routes
- ✅ **Responsive Design** - Mobile-first responsive layout
- ✅ **State Management** - React Query for server state
- ✅ **Form Handling** - React Hook Form with validation
- ✅ **Real-time Updates** - WebSocket integration
- ✅ **Type Safety** - Full TypeScript implementation
- ✅ **Component Library** - Reusable UI components

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile

### Missions

- `GET /api/missions` - List all missions
- `POST /api/missions` - Create new mission
- `GET /api/missions/:id` - Get mission details
- `PUT /api/missions/:id` - Update mission
- `DELETE /api/missions/:id` - Delete mission
- `POST /api/missions/:id/start` - Start mission
- `POST /api/missions/:id/pause` - Pause mission
- `POST /api/missions/:id/resume` - Resume mission
- `POST /api/missions/:id/abort` - Abort mission

### Drones

- `GET /api/drones` - List all drones
- `POST /api/drones` - Add new drone
- `GET /api/drones/:id` - Get drone details
- `PUT /api/drones/:id` - Update drone
- `DELETE /api/drones/:id` - Delete drone

### Sites

- `GET /api/sites` - List all sites
- `POST /api/sites` - Add new site
- `GET /api/sites/:id` - Get site details
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site

### Analytics

- `GET /api/analytics/missions` - Mission analytics
- `GET /api/analytics/fleet` - Fleet performance
- `GET /api/analytics/sites` - Site coverage analytics
- `GET /api/analytics/efficiency` - Operational efficiency
- `GET /api/analytics/maintenance` - Maintenance schedule

## WebSocket Events

The system uses WebSocket connections for real-time updates:

- `mission:created` - New mission created
- `mission:updated` - Mission updated
- `mission:started` - Mission started
- `mission:paused` - Mission paused
- `mission:resumed` - Mission resumed
- `mission:aborted` - Mission aborted
- `mission:completed` - Mission completed
- `drone:status_updated` - Drone status changed
- `drone:battery_update` - Drone battery level updated
- `flight:log:update` - New flight log entry

## Development Commands

### Backend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run linter
npm run prisma:studio # Open Prisma Studio
```

### Frontend

```bash
npm start            # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run linter
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/flytebase_dsm?retryWrites=true&w=majority"
JWT_SECRET="your-jwt-secret"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_MAPBOX_TOKEN=your-mapbox-token
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Ensure MongoDB Atlas cluster is accessible
   - Check database connection string in `.env`
   - Verify network access and credentials

2. **Port Already in Use**

   - Change PORT in backend `.env`
   - Update frontend API URL accordingly

3. **CORS Errors**

   - Check CORS_ORIGIN in backend `.env`
   - Ensure frontend URL matches

4. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration

### Getting Help

If you encounter issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that PostgreSQL is running and accessible

## Next Steps

This is a comprehensive foundation for the FlyteBase DSM system. To extend it further, consider:

1. **Mission Planning Interface** - Interactive map for flight path planning
2. **Real-time Monitoring** - Live drone tracking and video feeds
3. **Advanced Analytics** - More detailed reporting and insights
4. **Mobile App** - React Native companion app
5. **Integration APIs** - Connect with actual drone hardware
6. **Advanced Security** - Two-factor authentication, audit logs
7. **Performance Optimization** - Caching, database optimization
8. **Testing** - Unit tests, integration tests, E2E tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
