# Dell AI Agent Optimization Harness - Frontend

Modern React/TypeScript frontend for the Dell AI Agent Optimization Control System.

## Features

- **Interactive Control Panel**: Configure and tune optimization parameters
- **Real-time Dashboard**: Monitor performance metrics and system statistics
- **Experiment Runner**: A/B testing and optimization experiments
- **Model Comparison**: Compare performance across different AI models
- **Cost Analytics**: Track token usage and cost optimization

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Lucide React** for icons
- **Axios** for API communication

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API configuration
```

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

Build artifacts will be in the `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts          # API client for backend communication
│   ├── components/
│   │   ├── ControlPanel.tsx   # Main optimization controls UI
│   │   ├── Dashboard.tsx      # Performance dashboard
│   │   └── ExperimentRunner.tsx # A/B testing interface
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Application entry point
│   ├── App.css                # Component styles
│   └── index.css              # Global styles
├── public/                    # Static assets
├── index.html                 # HTML template
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── README.md                  # This file
```

## API Integration

The frontend communicates with the Python backend API:

- Base URL: Configurable via `VITE_API_BASE_URL` environment variable
- Default: `http://localhost:8000`
- Proxy: Vite development server proxies `/api` requests

### Key API Endpoints

- `POST /api/v1/optimize` - Process agent requests with optimization
- `GET /api/v1/stats` - Get system statistics
- `POST /api/v1/experiment` - Run optimization experiments
- `GET /api/v1/recommendations` - Get AI-powered recommendations

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint for linting
- Prettier for formatting (recommended)

### Component Development
- Use functional components with hooks
- TypeScript for type safety
- Tailwind CSS for styling
- TanStack Query for data fetching

### Adding New Components

1. Create component in `src/components/`
2. Export from component file
3. Import and use in `App.tsx` or other components
4. Add appropriate TypeScript types in `src/types/`

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Environment Variables

- `VITE_API_BASE_URL`: Backend API URL
- `VITE_APP_TITLE`: Application title

## Performance

- Code splitting via React Router
- Lazy loading for heavy components
- Image optimization
- CSS minification in production builds

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

## License

Proprietary - Dell Technologies

## Support

For support and questions, contact the AI Platform team at Dell Technologies.
