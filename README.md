# Medical Camp Manager - Frontend

A React-based frontend for the Medical Camp Management System with multi-tenant architecture and mobile-first design.

## Architecture

**Multi-tenant Model**: Each medical camp has a unique URL slug (`/{CAMP_SLUG}`) with isolated user interfaces and data access.

**Tech Stack**:
- React + TypeScript + Vite  
- React Router for camp-scoped routing
- Zustand for state management
- Axios for API communication
- Mobile-first responsive design

## User Interfaces

- **Public Registration** (`/:campSlug`): Visitor registration form
- **Staff Login** (`/:campSlug/login`): Camp Head/Doctor authentication
- **Doctor Dashboard** (`/:campSlug/doctor`): Visitor search, consultations, file uploads
- **Camp Head Dashboard** (`/:campSlug/camp-head`): Analytics, reports, user management

## Project Structure

```
medical-camp-frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Button.tsx     # Touch-optimized buttons
│   │   ├── Form.tsx       # Form inputs with validation
│   │   ├── Modal.tsx      # Mobile-friendly modals
│   │   └── Table.tsx      # Responsive data tables
│   ├── pages/            # Route components (lazy loaded)
│   │   ├── PublicRegistration.tsx
│   │   ├── DoctorLogin.tsx
│   │   ├── DoctorDashboard.tsx
│   │   └── CampHeadDashboard.tsx
│   ├── services/         # API client
│   │   └── api.ts        # Axios instance with auth
│   ├── store/           # Zustand stores
│   │   └── auth.ts      # Authentication state
│   ├── types/           # TypeScript interfaces
│   └── App.tsx          # Route configuration
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies
```

## Routing Pattern

URLs use camp slug as route parameter:
```
/:campSlug                     → Public registration page
/:campSlug/login              → Staff login (Camp Head/Doctor)  
/:campSlug/doctor             → Doctor dashboard (protected)
/:campSlug/camp-head          → Camp Head dashboard (protected)
```

**Route Protection**: `App.tsx` checks authentication before rendering protected routes. Redirects to login if no valid JWT token.

## State Management

**Auth Store** (`src/store/auth.ts`):
- User data: `{id, email, role, campId}`
- JWT token (persisted to localStorage)
- Camp slug from URL
- Login/logout functions

**API Integration** (`src/services/api.ts`):
- Axios instance with base URL configuration
- Automatic JWT token inclusion in headers
- Request/response interceptors for error handling

## UI/UX Design

**Mobile-First Theme** (`src/index.css`):
- Background: Clean white (`#ffffff`)
- Text: High contrast black (`#000000`)
- Primary: Medical blue (`#2563eb`)
- Touch targets: Minimum 44px height
- Responsive breakpoints for tablet/desktop

**Component Patterns**:
- All forms use consistent input styling
- Loading states with centered spinners
- Error states with clear messaging  
- Touch-optimized button spacing

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with backend URL:
# VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

## Environment Variables

Required in `.env`:

```bash
VITE_API_URL=http://localhost:3000/api
```

For production deployment:
```bash
VITE_API_URL=https://your-backend-domain.com/api
```

## Development

```bash
# Run with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## API Integration

All API calls go through `src/services/api.ts`:

```typescript
// Example API call
import api from '../services/api';

const visitors = await api.get(`/doctor/${campId}/visitors`);
```

**Authentication**: JWT tokens automatically included in Authorization header when user is logged in.

**Error Handling**: API responses are intercepted to handle authentication errors and redirect to login when tokens expire.

## Component Usage

### Button Component
```tsx
import { Button } from '../components';

<Button variant="primary" size="large" onClick={handleClick}>
  Save Consultation
</Button>
```

### Form Components
```tsx
import { Form } from '../components';

<Form.Input 
  label="Patient ID" 
  value={patientId}
  onChange={setPatientId}
  required 
/>
```

### Modal Component  
```tsx
import { Modal } from '../components';

<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Confirmation">
  <p>Are you sure you want to save this consultation?</p>
</Modal>
```

## Deployment

### Render (Static Site)
1. Connect GitHub repository to Render
2. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**: `VITE_API_URL=https://your-backend.onrender.com/api`

### Vite Build
The build process:
1. TypeScript compilation check
2. Vite optimized bundling
3. Asset minification
4. Static file generation in `dist/`

## Performance Optimization

- **Lazy Loading**: All route components loaded on demand
- **Code Splitting**: Automatic chunk splitting by Vite
- **Asset Optimization**: Images and assets optimized during build
- **Bundle Analysis**: Use `npm run build` to see chunk sizes

## Security Features

- JWT token validation on protected routes
- Automatic logout on token expiration
- Camp slug validation against user permissions
- Input sanitization on forms
- HTTPS enforcement in production

## Browser Support

- Modern browsers with ES2020 support
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 8+)
- Progressive enhancement for older browsers

## Next Steps

- Add offline support with service workers
- Implement push notifications
- Add data caching with React Query
- Create automated tests with React Testing Library
- Add accessibility improvements (ARIA labels)
- Implement dark mode theme