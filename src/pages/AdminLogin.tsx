import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Card, Input, Button, FormField, FormGroup } from '../components';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, user, token } = useAuthStore();

  // Redirect to dashboard if already logged in as admin
  useEffect(() => {
    if (token && user && user.role === 'ADMIN') {
      // Use window.location for hard redirect to ensure fresh state
      window.location.href = '/admin/dashboard';
    }
  }, [token, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      
      if (response.user.role !== 'ADMIN') {
        setError('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }

      // Set auth state - the useEffect above will handle navigation
      setAuth(response.user, response.token, null);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--spacing-md)'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>
            Admin Login
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Medical Camp Manager
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-md)',
              background: '#fee',
              color: '#c00',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <FormGroup>
            <FormField label="Email" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </FormField>

            <FormField label="Password" required>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
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

        <div style={{ 
          marginTop: 'var(--spacing-md)', 
          padding: 'var(--spacing-sm)',
          background: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)'
        }}>
          <strong>Default Credentials:</strong><br />
          Email: admin@medical-camp.com<br />
          Password: admin123
        </div>
      </Card>
    </div>
  );
}
