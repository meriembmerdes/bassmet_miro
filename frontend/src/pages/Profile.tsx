import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';

export default function Profile() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [addr, setAddr] = useState({
    label: 'Home',
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    isDefault: true,
  });

  async function refresh() {
    const res = await api.get('/users/me');
    setMe(res.data);
    setFirstName(res.data.firstName);
    setLastName(res.data.lastName);
    setPhone(res.data.phone ?? '');
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.patch('/users/me', { firstName, lastName, phone: phone || undefined });
      await refresh();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/users/me/addresses', addr);
      await refresh();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="grid cols-2">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        <ErrorBanner message={error} />
        <form className="grid" onSubmit={saveProfile} style={{ gap: '0.75rem' }}>
          <div className="field">
            <label>Email</label>
            <input value={me?.email} disabled />
          </div>
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
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button className="btn" type="submit" disabled={busy}>
            Save
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Addresses</h2>
        <div className="grid" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
          {(me?.addresses ?? []).map((a: any) => (
            <div key={a.id} className="card" style={{ padding: '0.75rem' }}>
              <div className="spread">
                <div style={{ fontWeight: 700 }}>{a.label}</div>
                {a.isDefault && <span className="pill">Default</span>}
              </div>
              <div className="muted">
                {a.fullName}
                <br />
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.city}, {a.state} {a.postalCode}, {a.country}
              </div>
            </div>
          ))}
        </div>

        <h3>Add address</h3>
        <form className="grid" onSubmit={addAddress} style={{ gap: '0.65rem' }}>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Label</label>
              <input value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 2 }}>
              <label>Full name</label>
              <input value={addr.fullName} onChange={(e) => setAddr({ ...addr, fullName: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Line 1</label>
            <input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
          </div>
          <div className="field">
            <label>Line 2</label>
            <input value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} />
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>City</label>
              <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>State</label>
              <input value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} />
            </div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Postal code</label>
              <input
                value={addr.postalCode}
                onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Country</label>
              <input value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} />
            </div>
          </div>
          <label className="row">
            <input
              type="checkbox"
              checked={addr.isDefault}
              onChange={(e) => setAddr({ ...addr, isDefault: e.target.checked })}
            />
            <span className="muted">Default address</span>
          </label>
          <button className="btn" type="submit" disabled={busy}>
            Add address
          </button>
        </form>
      </div>
    </div>
  );
}
