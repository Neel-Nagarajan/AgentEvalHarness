# Dell AI Agent Optimization System - Setup Guide

Complete setup and integration guide for the Tokenomics Optimization System.

## System Overview

The system consists of two main components:
- **Backend**: Python/FastAPI optimization engine (`optimization_system/`)
- **Frontend**: React/TypeScript evaluation harness UI (`frontend/`)

## Prerequisites

### Backend Requirements
- Python 3.9 or higher
- pip (Python package manager)
- PostgreSQL 13+ (optional, for production)
- Redis 6+ (optional, for caching)

### Frontend Requirements
- Node.js 18 or higher
- npm or yarn

## Quick Start

### 1. Backend Setup

```bash
cd optimization_system

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The backend API will start on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Configuration

### Backend Configuration

Edit `optimization_system/config/settings.py` to configure:

```python
# API Settings
API_HOST = "0.0.0.0"
API_PORT = 8000
API_PREFIX = "/api/v1"

# Database (PostgreSQL)
DATABASE_URL = "postgresql://user:password@localhost/optimization_db"

# Redis (Caching)
REDIS_URL = "redis://localhost:6379/0"

# AI Model APIs
OPENAI_API_KEY = "your-openai-api-key"
ANTHROPIC_API_KEY = "your-anthropic-api-key"

# Vector Database (Pinecone)
PINECONE_API_KEY = "your-pinecone-api-key"
PINECONE_ENVIRONMENT = "us-east-1-aws"
```

### Frontend Configuration

Create `frontend/.env` file:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE="Dell AI Agent Optimization Harness"
```

## API Endpoints

### Optimization Endpoints

#### Process Agent Request
```http
POST /api/v1/optimize
Content-Type: application/json

{
  "agent_id": "agent-001",
  "query": "Your query here",
  "context": "Optional context",
  "config": {
    "model_selection": {...},
    "prompt_engineering": {...},
    "context_management": {...},
    "caching": {...},
    "cost_optimization": {...}
  }
}
```

#### Get System Statistics
```http
GET /api/v1/stats
```

#### Run Experiment
```http
POST /api/v1/experiment
Content-Type: application/json

{
  "name": "Model Comparison Test",
  "config_a": {...},
  "config_b": {...},
  "duration_hours": 24
}
```

#### Get Recommendations
```http
GET /api/v1/recommendations
```

#### Update Configuration
```http
PUT /api/v1/config
Content-Type: application/json

{
  "config": {...}
}
```

#### Clear Cache
```http
DELETE /api/v1/cache
```

## Testing the Integration

### 1. Test Backend API

```bash
# Using curl
curl -X POST http://localhost:8000/api/v1/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "test-agent",
    "query": "What is the capital of France?",
    "config": {
      "model_selection": {
        "enabled": true,
        "strategy": "cost_optimized"
      }
    }
  }'
```

### 2. Test Frontend

1. Open `http://localhost:3000` in your browser
2. Navigate to the Control Panel
3. Adjust optimization parameters
4. View the Dashboard for real-time metrics
5. Run experiments from the Experiment Runner

## Development Workflow

### Backend Development

```bash
# Run with auto-reload
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Run tests (when implemented)
pytest tests/

# Check code style
black .
flake8 .
```

### Frontend Development

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Production Deployment

### Backend Deployment

#### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
```

Build and run:
```bash
docker build -t optimization-backend .
docker run -p 8000:8000 optimization-backend
```

#### Using Systemd (Linux)

Create `/etc/systemd/system/optimization-api.service`:

```ini
[Unit]
Description=Dell AI Optimization API
After=network.target

[Service]
Type=simple
User=optimization
WorkingDirectory=/opt/optimization-system
Environment="PATH=/opt/optimization-system/venv/bin"
ExecStart=/opt/optimization-system/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### Frontend Deployment

#### Using Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Using Nginx

```nginx
server {
    listen 80;
    server_name optimization.dell.com;
    root /var/www/optimization-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring

### Backend Monitoring

The system includes built-in metrics tracking:

- Request latency
- Token usage
- Cache hit rates
- Cost tracking
- Error rates

Access metrics at `/api/v1/stats`

### Frontend Monitoring

The dashboard provides real-time visualization of:
- Total requests
- Average latency
- Cost savings
- Cache hit rate
- Active experiments

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find process using port 8000
netstat -ano | findstr :8000  # Windows
lsof -i :8000  # Linux/Mac

# Kill the process or change port in settings.py
```

**Database connection errors:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in settings.py
- Verify database exists and credentials are correct

**API key errors:**
- Set OPENAI_API_KEY and ANTHROPIC_API_KEY in settings.py
- Ensure keys have proper permissions

### Frontend Issues

**npm install fails:**
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**API connection errors:**
- Ensure backend is running on port 8000
- Check VITE_API_BASE_URL in .env file
- Verify CORS settings in backend

**Build errors:**
```bash
# Check TypeScript errors
npm run type-check

# Fix linting issues
npm run lint -- --fix
```

## Security Considerations

### Backend Security

1. **API Keys**: Never commit API keys to version control
2. **CORS**: Configure allowed origins in production
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Authentication**: Add authentication for production use
5. **HTTPS**: Use HTTPS in production

### Frontend Security

1. **Environment Variables**: Use .env files for sensitive data
2. **Content Security Policy**: Implement CSP headers
3. **HTTPS**: Serve over HTTPS in production
4. **Input Validation**: Validate all user inputs

## Performance Optimization

### Backend Optimization

1. **Caching**: Enable Redis for distributed caching
2. **Database**: Use connection pooling
3. **Async Operations**: Use async/await for I/O operations
4. **Load Balancing**: Deploy multiple instances behind a load balancer

### Frontend Optimization

1. **Code Splitting**: Implement lazy loading for routes
2. **Image Optimization**: Use optimized images
3. **Bundle Size**: Analyze and reduce bundle size
4. **CDN**: Serve static assets via CDN

## Support

For issues and questions:
- Check the README files in each directory
- Review the Technical Architecture document
- Contact the AI Platform team at Dell Technologies

## Next Steps

1. Set up the development environment
2. Configure API keys and database connections
3. Run the backend and frontend servers
4. Test the integration using the provided examples
5. Customize configurations for your use case
6. Deploy to production when ready
