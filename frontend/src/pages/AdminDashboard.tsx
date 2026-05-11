import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [users, setUsers] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const [s, r, u] = await Promise.all([
          api.get('/admin/dashboard/stats'),
          api.get('/admin/reports/sales'),
          api.get('/admin/users', { params: { limit: 10 } }),
        ]);
        if (!cancelled) {
          setStats(s.data);
          setSales(r.data);
          setUsers(u.data);
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

  if (loading) return <Spinner />;

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <h1 style={{ marginTop: 0 }}>Admin</h1>
      <ErrorBanner message={error} />
      <div className="grid cols-4">
        <Link to="/admin/users" className="card" style={{ display: 'block' }}>
          <div className="muted">Users</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{stats?.users ?? '—'}</div>
          <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
            Manage users →
          </div>
        </Link>
        <Link to="/admin/products" className="card" style={{ display: 'block' }}>
          <div className="muted">Products</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{stats?.products ?? '—'}</div>
          <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
            Manage products →
          </div>
        </Link>
        <div className="card">
          <div className="muted">Orders</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{stats?.orders ?? '—'}</div>
        </div>
        <div className="card">
          <div className="muted">Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>${Number(stats?.revenue ?? 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Sales report (daily)</h2>
        {sales.length === 0 ? (
          <div className="muted">No data</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="muted">
                <th style={{ textAlign: 'left', padding: '0.35rem' }}>Day</th>
                <th style={{ textAlign: 'right', padding: '0.35rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((row) => (
                <tr key={row.day} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: '0.35rem' }}>{row.day}</td>
                  <td style={{ padding: '0.35rem', textAlign: 'right' }}>${Number(row.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Recent users</h2>
        <div className="grid" style={{ gap: '0.5rem' }}>
          {(users?.data ?? []).map((u: any) => (
            <div key={u.id} className="spread" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
              <div>
                <div style={{ fontWeight: 650 }}>{u.email}</div>
                <div className="muted">
                  {u.firstName} {u.lastName}
                </div>
              </div>
              <span className="pill">{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
