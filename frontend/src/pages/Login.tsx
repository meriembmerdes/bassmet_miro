import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { login } from '../store/authSlice';
import { ErrorBanner } from '../components/ErrorBanner';
import { formatApiError } from '../lib/errors';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    try {
      await dispatch(login({ email, password })).unwrap();
      navigate('/');
    } catch (err) {
      setLocalError(formatApiError(err));
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Login</h1>
      <ErrorBanner message={localError} />
      <form className="grid" onSubmit={onSubmit} style={{ gap: '0.75rem' }}>
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button className="btn" type="submit">
          Sign in
        </button>
      </form>
      <div className="muted" style={{ marginTop: '1rem' }}>
        <Link to="/register">Create an account</Link> · <Link to="/forgot-password">Forgot password</Link>
      </div>
    </div>
  );
}
