import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await api.get('/orders');
    setOrders(res.data);
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

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Orders</h1>
      <ErrorBanner message={error} />
      {orders.length === 0 ? (
        <div className="card muted">No orders yet.</div>
      ) : (
        <div className="grid" style={{ gap: '0.75rem' }}>
          {orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="card spread">
              <div>
                <div style={{ fontWeight: 750 }}>Order {o.id.slice(0, 8)}…</div>
                <div className="muted">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div className="row">
                <span className="pill">{o.status}</span>
                <div style={{ fontWeight: 800 }}>${o.total}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
