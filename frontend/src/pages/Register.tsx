import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { register } from '../store/authSlice';
import { ErrorBanner } from '../components/ErrorBanner';
import { formatApiError } from '../lib/errors';

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    try {
      await dispatch(register({ email, password, firstName, lastName })).unwrap();
      navigate('/');
    } catch (err) {
      setLocalError(formatApiError(err));
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Register</h1>
      <p className="muted">
        Password must include uppercase, lowercase, and a number (8+ characters).
      </p>
      <ErrorBanner message={localError} />
      <form className="grid" onSubmit={onSubmit} style={{ gap: '0.75rem' }}>
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>First name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Last name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
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
            autoComplete="new-password"
          />
        </div>
        <button className="btn" type="submit">
          Create account
        </button>
      </form>
      <div className="muted" style={{ marginTop: '1rem' }}>
        <Link to="/login">Already have an account?</Link>
      </div>
    </div>
  );
}
