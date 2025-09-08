# Notification Microservice

A robust, scalable, and multi-tenant notification microservice built with NestJS, designed to handle email, SMS, and push notifications across multiple applications and tenants.

## 🚀 Features

- **Multi-tenancy Support**: Isolated notification systems for different clients/tenants
- **Multiple Channels**: Email, SMS, and push notifications (with extensible architecture)
- **Template Management**: Dynamic templates with Handlebars support
- **Queue-based Processing**: Redis-backed job queues for reliable processing
- **Event-driven Architecture**: REST API for receiving notification events
- **Tenant Branding**: Customizable branding per tenant
- **User Preferences**: Opt-in/opt-out management per user
- **Comprehensive Logging**: Full audit trail of all notification attempts

## 🏗 Architecture

```mermaid
graph TD
    A[Client Applications] -->|HTTP REST API| B[Notification Service]
    B --> C[Redis Queue]
    C --> D[Email Worker]
    C --> E[SMS Worker]
    C --> F[Push Worker]
    D --> G[SMTP Providers]
    E --> H[SMS Providers]
    F --> I[Push Services]
    B --> J[(PostgreSQL)]
```

## 📦 Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis with BullMQ
- **Templating**: Handlebars
- **Email**: Nodemailer with SMTP support
- **API**: RESTful endpoints with validation
- **Deployment**: Ready for Docker & Fly.io

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server
- npm or yarn

### Installation

1. **Clone and setup**
```bash
git clone <repository-url>
cd notification-service
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/notification-service"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Application
PORT=3000
NODE_ENV=development
```

3. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data (optional)
npx ts-node src/test-database.ts
```

4. **Start the Application**
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📋 API Usage

### Tenant Onboarding Flow

1. **Create Tenant**
```http
POST /tenants
Content-Type: application/json

{
  "name": "Acme Corp",
  "externalId": "acme_corp_123"
}
```

2. **Configure Branding**
```http
POST /tenants/{tenantId}/branding
Content-Type: application/json

{
  "companyName": "Acme Corporation",
  "logoUrl": "https://acme.com/logo.png",
  "primaryColor": "#0066cc",
  "supportEmail": "support@acme.com",
  "supportPhone": "+1-555-0123"
}
```

3. **Setup Email Provider**
```http
POST /tenants/{tenantId}/email-providers
Content-Type: application/json

{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "username": "noreply@acme.com",
  "password": "your-app-password",
  "fromEmail": "noreply@acme.com",
  "fromName": "Acme Corp",
  "isDefault": true
}
```

4. **Add Templates**
```http
POST /tenants/{tenantId}/templates
Content-Type: application/json

{
  "name": "welcome-email",
  "type": "email",
  "subject": "Welcome to {{company_name}}",
  "body": "Hello {{user_name}}, welcome to {{company_name}}!",
  "language": "en"
}
```

### Sending Notifications

**Send Single Event**
```http
POST /events
Content-Type: application/json

{
  "metadata": {
    "event_id": "evt_12345",
    "event_type": "user.registration.completed",
    "tenant_id": "tenant_abc123",
    "created_at": "2023-01-01T00:00:00Z",
    "source": "auth-service"
  },
  "data": {
    "user_id": "user_123",
    "user_email": "user@example.com",
    "user_name": "John Doe"
  }
}
```

**Batch Events**
```http
POST /events/batch
Content-Type: application/json

[
  {
    "metadata": {...},
    "data": {...}
  },
  {
    "metadata": {...},
    "data": {...}
  }
]
```

## 🔧 Supported Event Types

### Authentication Events
- `user.registration.completed` - Welcome emails
- `user.password.reset.requested` - Password reset emails
- `user.login.succeeded` - Security notifications
- `user.login.failed` - Security alerts

### Application Events
- `invoice.payment.failed` - Payment failure notifications
- `task.assigned` - Task assignment alerts
- `comment.mentioned` - Mention notifications
- `content.liked` - Engagement alerts

### Security Events
- `auth.2fa.code.requested` - 2FA code delivery
- `auth.2fa.attempt.failed` - Failed auth attempts
- `auth.2fa.method.changed` - Security settings changes

## 🏗 Project Structure

```
src/
├── channels/                 # Notification channels
│   ├── email/               # Email processing
│   ├── sms/                 # SMS processing (future)
│   └── push/                # Push notifications (future)
├── events/                  # Event processing
│   ├── dto/                 # Data transfer objects
│   ├── events.controller.ts # REST API endpoints
│   ├── events.processor.ts  # Queue worker
│   └── events.service.ts    # Business logic
├── tenants/                 # Tenant management
├── templates/               # Template management
├── notifications/           # Notification logging
├── user-preferences/        # User preference management
├── config/                  # Configuration
├── prisma/                  # Database schema
└── common/                  # Shared utilities
```

## 🧪 Testing

### Run Tests
```bash
# Test database connection
npx ts-node src/test-database.ts

# Test complete flow
npx ts-node src/test-complete-flow.ts

# Test HTTP API
npx ts-node src/test-http-api.ts
```

### Using ngrok for External Testing
```bash
# Expose your local server
ngrok http 3000

# Share the ngrok URL with other services
# Example: https://abc123.ngrok.io
```

## 🚀 Deployment

### Docker Deployment
```dockerfile
# Use the included Dockerfile
docker build -t notification-service .
docker run -p 3000:3000 notification-service
```

### Environment Variables for Production
```env
# Production Database
DATABASE_URL="postgresql://prod-user:prod-pass@prod-db:5432/prod-db"

# Production Redis
REDIS_HOST="redis-server"
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"

# SMTP Providers

#SMPT from email
EMAIL_FROM=""

#SMPT user
ETHEREAL_USER=

#SMPT password
ETHEREAL_PASS=

```

## 🔒 Security Considerations

- **API Authentication**: Use `INTERNAL_API_SECRET` for service-to-service communication
- **Database Isolation**: Each tenant's data is properly isolated
- **SMTP Credentials**: Stored encrypted in database
- **Input Validation**: All inputs validated using class-validator
- **Rate Limiting**: Implemented at the queue level

## 📊 Monitoring & Logging

The service includes comprehensive logging:
- Event ingestion logs
- Queue processing metrics
- Email delivery status
- Error tracking and retry logs

Use `BullMQ` dashboard or `Redis Insight` for queue monitoring.


## 🆘 Support

For support and questions:
1. Check the API documentation
2. Review the troubleshooting guide
3. Create an issue in the repository

## 🎯 Roadmap

- [ ] SMS channel integration (Twilio)
- [ ] Push notification support (Firebase)
- [ ] Webhook notifications
- [ ] Advanced analytics dashboard
- [ ] Template management UI
- [ ] Rate limiting per tenant
- [ ] SLA monitoring

---

**Built using NestJS and modern microservices architecture**