# Smart Issue Routing System

A production-ready intelligent maintenance issue routing system for Walmart stores, featuring AI-powered classification, smart technician assignment, and real-time SLA monitoring.

## Features

### 🤖 AI-Powered Intelligence
- **Classification Agent**: Automatically categorizes and prioritizes issues using LangGraph and OpenAI
- **Availability Agent**: Real-time technician availability and skill matching
- **Routing Agent**: Intelligent assignment based on skills, proximity, and workload
- **Escalation Agent**: Automated SLA monitoring and breach detection

### 🔐 Production-Ready Security
- **NextAuth.js**: Secure authentication with JWT tokens
- **Role-Based Access Control (RBAC)**: Granular permissions for different user roles
- **Prisma ORM**: Type-safe database operations with PostgreSQL
- **Password Hashing**: bcrypt for secure password storage

### 👥 Multi-Role Support
- **Store Registers**: Report issues, track progress
- **Service Providers**: Accept/reject assignments, manage capacity
- **Moderators**: Store-level oversight and provider approval
- **Admins**: System-wide management and analytics

### 📊 Real-Time Monitoring
- **SLA Tracking**: Automated deadline monitoring
- **Performance Analytics**: Provider performance metrics
- **Escalation Management**: Automatic supervisor notifications

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository>
cd smart-routing-system
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/smart_routing_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
OPENAI_API_KEY="your-openai-api-key"
JWT_SECRET="your-jwt-secret-key"
```

3. **Set up the database**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

4. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Demo Accounts

After seeding, you can use these accounts:

- **Admin**: `admin` / `admin123`
- **Moderator**: `moderator_dallas` / `moderator123`
- **Store Register**: `store_dallas` / `store123`
- **Technician**: `tech_john` / `tech123`

## Architecture

### AI Agents (LangGraph)
- **Classification Agent**: NLP-powered issue categorization
- **Availability Agent**: Real-time provider status tracking
- **Routing Agent**: Multi-factor assignment optimization
- **Escalation Agent**: SLA monitoring and breach handling

### Database Schema (Prisma + PostgreSQL)
- Users, Stores, Service Providers
- Tickets, Assignments, Remarks
- Escalations and audit trails

### API Routes
- `/api/auth/*` - Authentication endpoints
- `/api/tickets/*` - Ticket management
- `/api/admin/*` - Administrative functions
- `/api/providers/*` - Service provider operations

## Key Workflows

### 1. Issue Reporting
1. Store register describes the problem
2. AI Classification Agent categorizes and prioritizes
3. System calculates SLA deadline
4. Ticket created in database

### 2. Smart Assignment
1. Availability Agent finds qualified providers
2. Routing Agent scores based on skills, proximity, workload
3. Best provider automatically assigned
4. Real-time notifications sent

### 3. SLA Monitoring
1. Escalation Agent continuously monitors deadlines
2. Automatic escalations for missed SLAs
3. Supervisor notifications
4. Performance tracking

## Production Deployment

### Database Setup
```bash
# Production migration
npx prisma migrate deploy

# Generate optimized client
npx prisma generate
```

### Environment Configuration
- Set up production PostgreSQL instance
- Configure secure NEXTAUTH_SECRET
- Set production NEXTAUTH_URL
- Add OpenAI API key with appropriate limits

### Monitoring
- Enable Prisma query logging
- Set up error tracking (Sentry, etc.)
- Monitor AI agent performance
- Track SLA compliance metrics

## API Documentation

### Authentication
All API routes require authentication via NextAuth.js session or JWT token.

### Permissions
Role-based access control enforced on all endpoints:
- Store registers can only access their store's data
- Service providers see only assigned tickets
- Moderators manage their assigned stores
- Admins have system-wide access

### Rate Limiting
Implement rate limiting for production:
- Authentication endpoints: 5 requests/minute
- Ticket creation: 10 requests/minute
- General API: 100 requests/minute

## Development

### Database Operations
```bash
# View database in browser
npm run db:studio

# Reset database (development only)
npm run db:reset

# Generate new migration
npx prisma migrate dev --name description
```

### AI Agent Development
Agents are built with LangGraph and can be extended:
- Add new classification categories
- Implement custom routing algorithms
- Create specialized escalation rules
- Integrate external APIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.