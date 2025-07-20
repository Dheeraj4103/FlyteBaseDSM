# FlyteBase Drone Survey Management System

## 🚀 Demo

Check out a video demo of the project here: [Watch on Loom](https://www.loom.com/share/7365c5a635ec4fbabf19e0311981c1ea?sid=97c0fea6-91b7-4f28-a583-4fbb903173f5)

---

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

---

**Built with ❤️ for FlyteBase**

## Development Approach & Design Decisions

### How did you approach the problem?

- **Requirements Analysis:** Started by understanding the core requirements: managing drones, sites, and missions, with the ability to assign drones to sites and missions, and to define survey areas and waypoints.
- **Incremental Enhancement:** Built the system incrementally, starting with basic CRUD operations for drones, sites, and missions, and then adding advanced features like associating waypoints and survey areas with sites and missions.
- **Full-Stack Coordination:** Updated both backend (Node.js/Express + Prisma + MongoDB) and frontend (React + TypeScript) in tandem to ensure data consistency and a smooth user experience.
- **Validation and Error Handling:** Used Zod for schema validation on both frontend and backend, ensuring that only valid data is processed and stored.

### Trade-offs considered

- **Schema Flexibility vs. Strictness:** Initially enforced strict CUID validation for IDs, but relaxed this to support custom string IDs (like `site-1`) for better compatibility with existing data and user expectations.
- **Frontend vs. Backend Responsibility:** Decided to have the frontend fetch and include `waypoints` and `surveyArea` from the selected site when creating a mission, rather than having the backend infer these fields. This keeps the backend stateless and the API explicit, but requires the frontend to be aware of more business logic.
- **Optional vs. Required Fields:** Made fields like `siteId`, `waypoints`, and `surveyArea` optional or required based on real-world workflow needs, balancing user flexibility with data integrity.
- **Database Design:** Chose to store `waypoints` and `surveyArea` as JSON fields for maximum flexibility, at the cost of some query complexity if advanced geospatial queries are needed in the future.

### Strategy for ensuring safety and adaptability

- **Validation at Multiple Layers:** Used Zod for input validation and Prisma for type safety, reducing the risk of invalid or malicious data entering the system.
- **Environment Isolation:** Added `.gitignore` rules to prevent sensitive files (like `.env`) and large dependencies (`node_modules`) from being committed to version control.
- **Migration and Seeding:** Used Prisma migrations to safely evolve the database schema, and provided seed data to ensure the system can be reliably initialized and tested.
- **Extensibility:** By using JSON fields for geospatial data and keeping the API design RESTful and explicit, the system can easily adapt to new requirements (e.g., supporting new types of missions or sites).
- **Error Handling and Feedback:** Implemented clear error messages and validation feedback in both frontend and backend, making the system robust and user-friendly.

**In summary:**
The system was developed with a focus on clarity, safety, and future-proofing. Trade-offs were made to balance strict validation with real-world flexibility, and the architecture allows for easy adaptation as requirements evolve.
