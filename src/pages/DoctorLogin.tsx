import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { Card, Input, Button, FormField, FormGroup } from '../components';

/**
 * Login page for Camp Head and Doctors
 * Accessed via: domain.com/{campSlug}/login
 */
export default function DoctorLogin() {
  const { campSlug } = useParams<{ campSlug: string }>();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        ...formData,
        campSlug
      });

      const { token, user } = response.data;
      login(user, token, campSlug!);

      // Redirect based on role
      if (user.role === 'DOCTOR') {
        navigate(`/${campSlug}/doctor`);
      } else if (user.role === 'CAMP_HEAD') {
        navigate(`/${campSlug}/camp-head`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Card style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{ textAlign: 'center' }}>Staff Login</h1>
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Camp: {campSlug}
        </p>

        {error && (
          <div className="error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <FormField label="Email" required>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormField>

            <FormField label="Password" required>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </FormField>
          </FormGroup>

          <Button 
            type="submit" 
            disabled={loading} 
            variant="primary" 
            size="lg" 
            fullWidth
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
