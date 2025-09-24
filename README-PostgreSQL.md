# SumoMine PostgreSQL Setup

This guide will help you migrate from localStorage to PostgreSQL as the database backend.

## Prerequisites

1. **PostgreSQL** installed and running on your system
2. **Node.js** version 18 or higher
3. **npm** or **yarn** package manager

## Setup Instructions

### 1. Install PostgreSQL

**On macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE sumomine;
CREATE USER sumouser WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sumomine TO sumouser;

# Exit PostgreSQL
\q
```

### 3. Setup Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your database credentials
nano .env
```

**Update .env file:**
```env
DATABASE_URL=postgresql://sumouser:your_secure_password@localhost:5432/sumomine
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sumomine
DB_USER=sumouser
DB_PASSWORD=your_secure_password
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 4. Run Database Migrations

```bash
# Generate migration files
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

### 5. Start the Backend Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Or production mode
npm run build
npm start
```

The server will be available at: http://localhost:3001

### 6. Update Frontend Configuration

The frontend needs to be updated to use the new database context. Here are the changes needed:

**In `src/main.tsx`, replace the SumoProvider:**

```tsx
import { SumoProviderDB } from './context/SumoContextDB';

// Replace
// <SumoProvider>
//   <App />
// </SumoProvider>

// With
<SumoProviderDB>
  <App />
</SumoProviderDB>
```

### 7. Update Import Functionality

The rikishi import functionality needs to be updated to use the database API instead of localStorage. The new implementation includes:

- Bulk import API endpoint for efficient data insertion
- Database constraints and validation
- Error handling and rollback capabilities
- Progress tracking and status updates

## API Endpoints

The backend provides the following API endpoints:

### Rikishi Endpoints
- `GET /api/rikishi` - Get all rikishi
- `GET /api/rikishi/:id` - Get rikishi by ID
- `POST /api/rikishi` - Create new rikishi
- `POST /api/rikishi/bulk` - Bulk create rikishi
- `PUT /api/rikishi/:id` - Update rikishi
- `DELETE /api/rikishi/:id` - Delete rikishi

### Basho Endpoints
- `GET /api/basho` - Get all basho
- `GET /api/basho/:id` - Get basho by ID
- `POST /api/basho` - Create new basho
- `PUT /api/basho/:id` - Update basho
- `DELETE /api/basho/:id` - Delete basho

### Health Check
- `GET /health` - Server health status

## Migration from localStorage

To migrate existing data from localStorage:

1. Export your existing data from the browser's localStorage
2. Use the bulk import endpoints to import the data into PostgreSQL
3. Update the frontend to use the new SumoProviderDB context

## Benefits of PostgreSQL Backend

1. **Scalability**: Handle thousands of rikishi and related data
2. **Data Integrity**: Database constraints and validation
3. **Multi-user Support**: Multiple users can access the same data
4. **Backup & Recovery**: Proper database backup solutions
5. **Advanced Queries**: Complex queries and data analysis
6. **Performance**: Indexed queries for fast data retrieval

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `brew services list | grep postgresql`
- Check database credentials in `.env`
- Verify database exists: `psql -U sumouser -d sumomine -c "\\dt"`

### Server Issues
- Check server logs for errors
- Ensure port 3001 is not in use by another application
- Verify all environment variables are set correctly

### Frontend Issues
- Ensure backend server is running before starting frontend
- Check browser console for API connection errors
- Verify CORS configuration allows frontend URL

## Production Deployment

For production deployment:

1. Use environment variables for all sensitive data
2. Enable SSL for database connections
3. Configure proper authentication and authorization
4. Set up database backups
5. Use a reverse proxy (nginx) for the API
6. Monitor database performance and queries

## Development

To continue development:

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
```

Both servers will auto-reload on code changes.