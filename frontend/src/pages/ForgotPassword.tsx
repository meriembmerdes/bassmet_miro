import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { formatApiError } from '../lib/errors';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.devToken) {
        setToken(res.data.devToken);
        setStep('reset');
      }
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword });
      setMessage(res.data.message);
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Forgot password</h1>
      <p className="muted">
        In development, the API logs a reset token and may return <code>devToken</code> in the JSON
        response.
      </p>
      <ErrorBanner message={error} />
      {message && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(52,211,153,0.35)' }}>
          {message}
        </div>
      )}

      {step === 'request' ? (
        <form className="grid" onSubmit={requestReset} style={{ gap: '0.75rem' }}>
          <div className="field">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn" type="submit">
            Send reset link
          </button>
        </form>
      ) : (
        <form className="grid" onSubmit={resetPassword} style={{ gap: '0.75rem' }}>
          <div className="field">
            <label>Token</label>
            <input value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button className="btn" type="submit">
            Update password
          </button>
        </form>
      )}

      <div className="muted" style={{ marginTop: '1rem' }}>
        <Link to="/login">Back to login</Link>
      </div>
    </div>
  );
}
