import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';

export default function Checkout() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressId, setAddressId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/users/me/addresses');
        if (!cancelled) {
          setAddresses(res.data);
          const def = res.data.find((a: any) => a.isDefault);
          setAddressId(def?.id ?? res.data[0]?.id ?? '');
        }
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post('/orders/checkout', {
        addressId,
        couponCode: couponCode.trim() || undefined,
      });
      navigate(`/orders/${res.data.id}`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Checkout</h1>
      <p className="muted">
        Need an address? Add one in <Link to="/profile">Profile</Link> first.
      </p>
      <ErrorBanner message={error} />
      {addresses.length === 0 ? (
        <div className="muted">No addresses on file.</div>
      ) : (
        <form className="grid" onSubmit={submit} style={{ gap: '0.75rem' }}>
          <div className="field">
            <label>Shipping address</label>
            <select value={addressId} onChange={(e) => setAddressId(e.target.value)}>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} — {a.fullName}, {a.city}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Coupon (optional)</label>
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="SAVE10" />
          </div>
          <button className="btn" type="submit" disabled={busy || !addressId}>
            Place order
          </button>
        </form>
      )}
    </div>
  );
}
