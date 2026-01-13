# Medical Camp Manager - Frontend - AI Coding Instructions

## Project Overview

This is the **React frontend** for a multi-tenant medical camp management system. Each medical camp has isolated user interfaces accessed via unique URL slugs.

**Key Concept**: Camp isolation enforced through URL-based routing (`/{CAMP_SLUG}`) and JWT token validation with `campId` claims.

## Architecture & Tech Stack

- **Frontend**: React + TypeScript + Vite + Zustand (state management)  
- **Routing**: React Router with camp slug parameters
- **API**: Axios client with JWT authentication
- **UI**: Mobile-first responsive design, medical theme

### Project Structure
```
medical-camp-frontend/
├── src/
│   ├── components/        # Reusable UI components (Button, Form, Modal, etc.)
│   ├── pages/            # Route components (lazy loaded)
│   ├── services/         # API client (axios)
│   ├── store/            # Zustand stores (auth state)
│   ├── types/            # TypeScript interfaces
│   └── App.tsx           # Main routing configuration
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration  
└── package.json          # Dependencies and scripts
```

## Multi-Tenant Routing

URLs use camp slug as route parameter:
```
/:campSlug                     → Public registration page
/:campSlug/login              → Staff login (Camp Head/Doctor)
/:campSlug/doctor             → Doctor dashboard (protected)
/:campSlug/camp-head          → Camp Head dashboard (protected)
```

**Route Protection**: `src/App.tsx` checks `isAuthenticated()` before rendering protected routes. Redirects to login if no token.

**Camp Validation**: URLs validated against user's JWT `campId` claim. Users can only access their assigned camp.

## State Management (Zustand)

**Auth Store** (`src/store/auth.ts`):
```typescript
interface AuthState {
  user: User | null;
  token: string | null; 
  campSlug: string | null;
  login: (credentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}
```

**Persistence**: JWT token persisted to localStorage. Auto-logout on token expiration.

## API Integration

**API Client** (`src/services/api.ts`):
- Base URL from `VITE_API_URL` environment variable
- Automatic JWT token injection via Authorization header
- Request/response interceptors for error handling
- Automatic redirect to login on 401 responses

```typescript
// Example API call pattern
import api from '../services/api';

const response = await api.get(`/doctor/${campId}/visitors`);
```

## UI/UX Conventions

**Mobile-First Design** (`src/index.css`):
- Background: Clean white (`#ffffff`)
- Text: High contrast black (`#000000`) 
- Primary accent: Medical blue (`#2563eb`)
- Touch targets: Minimum 44px height
- Responsive spacing using CSS custom properties

**Component Patterns**:
- All inputs have consistent styling and min-height 44px
- Required fields marked with red asterisk
- Loading states show centered spinner with "Loading..." text
- Error states display clear messages with retry options

## Component Library

### Button Component (`src/components/Button.tsx`)
```tsx
<Button variant="primary|secondary" size="small|medium|large" onClick={handler}>
  Button Text
</Button>
```

### Form Components (`src/components/Form.tsx`)  
```tsx
<Form.Input 
  label="Field Label"
  value={value}
  onChange={setValue}
  required
  type="text|email|tel|password"
/>

<Form.Select 
  label="Select Label"
  value={value} 
  onChange={setValue}
  options={[{value: 'key', label: 'Display'}]}
/>
```

### Modal Component (`src/components/Modal.tsx`)
```tsx
<Modal isOpen={isOpen} onClose={handleClose} title="Modal Title">
  <p>Modal content goes here</p>
</Modal>
```

### Table Component (`src/components/Table.tsx`)
```tsx
<Table 
  columns={[{key: 'name', label: 'Name'}, {key: 'age', label: 'Age'}]}
  data={[{name: 'John', age: 30}]}
  onRowClick={handleRowClick}
/>
```

## Page Components (Lazy Loaded)

All page components in `src/pages/` are lazy loaded for performance:

- **PublicRegistration.tsx**: Visitor registration form (public access)
- **DoctorLogin.tsx**: Staff authentication (Camp Head/Doctor)  
- **DoctorDashboard.tsx**: Visitor search, consultation forms, file uploads
- **CampHeadDashboard.tsx**: Analytics, reports, user management
- **AdminLogin.tsx**: Global admin access
- **AdminDashboard.tsx**: System-wide camp and user management

## Common Development Tasks

### Adding a New Page Component

1. Create component in `src/pages/NewPage.tsx`
2. Lazy load in `src/App.tsx`:
   ```typescript
   const NewPage = React.lazy(() => import('./pages/NewPage'));
   ```
3. Add route with camp slug parameter:
   ```typescript
   <Route path="/:campSlug/new-page" element={<NewPage />} />
   ```

### Adding API Integration

1. Add API call to `src/services/api.ts` or component
2. Use authentication state from store:
   ```typescript
   const { user, token } = useAuthStore();
   ```
3. Handle loading and error states in component

### Accessing Route Parameters

```typescript
import { useParams } from 'react-router-dom';

const { campSlug } = useParams<{ campSlug: string }>();
```

## Environment Configuration

**Development** (`.env`):
```bash
VITE_API_URL=http://localhost:3000/api
```

**Production** (deployment):
```bash
VITE_API_URL=https://your-backend-domain.com/api
```

**Vite Proxy** (development only - `vite.config.ts`):
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}
```

## Development Workflow

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev
# Frontend: http://localhost:5173

# Type checking and build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Authentication Flow

1. User visits `/:campSlug/login`
2. Login form sends `{email, password, campSlug}` to `/api/auth/login`
3. Backend validates credentials and camp access
4. JWT token returned with `{id, role, campId}` claims
5. Token stored in auth store and localStorage
6. Subsequent API requests include token in Authorization header
7. Protected routes check `isAuthenticated()` before rendering

## Error Handling Patterns

**API Errors**: Intercepted in `src/services/api.ts`
- 401 (Unauthorized): Auto-logout and redirect to login
- 403 (Forbidden): Show "Access Denied" message
- 500+ (Server): Show "Server Error" with retry option

**Form Validation**: Client-side validation with server-side confirmation
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

// Validation logic
if (!email) errors.email = 'Email is required';
```

## Performance Best Practices

- **Lazy Loading**: All route components lazy loaded
- **Code Splitting**: Automatic by Vite based on imports
- **Image Optimization**: Use appropriate formats and sizes
- **Bundle Size**: Monitor with `npm run build` analysis

## Mobile/Touch Optimization

- All touch targets minimum 44x44px
- Swipe gestures where appropriate
- Viewport meta tag for proper mobile scaling
- Touch-friendly form inputs with proper keyboard types
- Loading states prevent accidental double-taps

## Security Considerations

- JWT tokens expire automatically (handled in auth store)
- Camp slug validation against user permissions
- No sensitive data in localStorage (only JWT token)
- Input sanitization on all form submissions
- HTTPS enforcement in production builds

## Testing Strategy (Future)

- Unit tests with React Testing Library
- Integration tests for API calls
- E2E tests with Playwright/Cypress
- Accessibility testing with axe-core

## Deployment Notes

**Render Static Site**:
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variables: Set `VITE_API_URL` to backend URL

**Build Output**: Vite generates optimized static files in `dist/` directory ready for any static hosting service.

## Browser Support

- Modern browsers with ES2020+ support
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 8+)
- No Internet Explorer support