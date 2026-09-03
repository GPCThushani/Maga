import { useState, type FormEvent } from 'react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { BrandLogo } from '../components/BrandWordmark';

export const Auth = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await api.post(endpoint, payload);
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <BrandLogo />
          <span className="text-xs font-semibold tracking-wider text-textSecondary uppercase">
            Maga
          </span>
        </div>

        <h2 className="text-lg font-semibold text-textPrimary">
          {isRegister ? 'Create an account' : 'Sign in to workspace'}
        </h2>
        <p className="mt-1 text-xs text-textSecondary">
          {isRegister
            ? 'Track your career applications and match technical skills.'
            : 'Enter your credentials to access your tracking pipeline.'}
        </p>

        {error && (
          <div className="mt-4 rounded bg-danger-light p-2.5 text-xs text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
                placeholder="Thushani"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-btn bg-accent py-2 text-xs font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-textSecondary hover:text-textPrimary"
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};