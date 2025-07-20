# FlyteBase DSM - Drone Survey Management System

A comprehensive platform for managing autonomous drone surveys across multiple global sites. This system enables organizations to plan, monitor, and analyze drone missions for facility inspections, security patrols, and site mapping.

## 🚀 Features

### Mission Planning & Configuration

- Define survey areas and flight paths
- Configure flight parameters (altitude, waypoints, overlap)
- Support for advanced patterns (crosshatch, perimeter, grid)
- Mission-specific parameter configuration

### Fleet Management Dashboard

- Real-time drone inventory visualization
- Live status monitoring (available, in-mission, maintenance)
- Battery levels and vital statistics tracking
- Fleet health analytics

### Real-time Mission Monitoring

- Live flight path visualization on interactive maps
- Mission progress tracking with ETA
- Real-time status updates and alerts
- Mission control actions (pause, resume, abort, emergency landing)

### Survey Reporting & Analytics

- Comprehensive survey summaries and reports
- Individual flight statistics (duration, distance, coverage area)
- Organization-wide analytics and trends
- Export capabilities for compliance and documentation

## 🏗️ Architecture

```
Frontend (React + TypeScript)
├── Mission Planning Interface
├── Fleet Management Dashboard
├── Real-time Monitoring
└── Analytics & Reporting

Backend (Node.js + Express + TypeScript)
├── REST API
├── WebSocket Server
├── Mission Orchestration
└── Data Processing

Database (MongoDB)
├── Missions
├── Drones
├── Sites
└── Analytics
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Query
- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Database**: MongoDB with Prisma ORM
- **Maps**: Mapbox GL JS
- **Authentication**: JWT
- **Real-time**: WebSocket connections
- **Testing**: Jest, React Testing Library

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd FlyteBaseDSM
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**

   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your database and API keys

   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env with your backend URL and map API keys
   ```

4. **Database Setup**

   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Servers**

   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

## 📁 Project Structure

```
FlyteBaseDSM/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema
│   └── tests/              # Backend tests
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── docs/                   # Documentation
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/flytebase_dsm?retryWrites=true&w=majority"
JWT_SECRET="your-jwt-secret"
PORT=3001
NODE_ENV=development
```

**Frontend (.env)**

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_MAPBOX_TOKEN=your-mapbox-token
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run all tests
npm run test:all
```

## 📊 API Documentation

The API documentation is available at `/api/docs` when running the backend server.

### Key Endpoints

- `GET /api/missions` - List all missions
- `POST /api/missions` - Create new mission
- `GET /api/missions/:id` - Get mission details
- `PUT /api/missions/:id` - Update mission
- `DELETE /api/missions/:id` - Delete mission
- `GET /api/drones` - List all drones
- `GET /api/sites` - List all sites
- `GET /api/analytics` - Get analytics data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for FlyteBase**
