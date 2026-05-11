import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { useToast } from '../components/Toast';
import { formatApiError } from '../lib/errors';

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'customer' | string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminUsers() {
  const toast = useToast();
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState<{ open: boolean; user?: UserRow }>({ open: false });

  const params = useMemo(() => {
    const p: any = { limit: 50, page: 1 };
    if (query.trim()) p.search = query.trim();
    return p;
  }, [query]);

  async function refresh() {
    setError(null);
    const res = await api.get('/admin/users', { params });
    setItems(res.data?.data ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function setBlocked(u: UserRow, isBlocked: boolean) {
    setBusyId(u.id);
    setError(null);
    try {
      await api.patch(`/admin/users/${u.id}/blocked`, { isBlocked });
      toast.push({
        kind: 'success',
        title: isBlocked ? 'User blocked' : 'User unblocked',
        message: u.email,
      });
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
      toast.push({ kind: 'error', title: 'Action failed', message: formatApiError(e) });
    } finally {
      setBusyId(null);
    }
  }

  async function setRole(u: UserRow, role: 'admin' | 'customer') {
    setBusyId(u.id);
    setError(null);
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role });
      toast.push({ kind: 'success', title: 'Role updated', message: `${u.email} → ${role}` });
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
      toast.push({ kind: 'error', title: 'Action failed', message: formatApiError(e) });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(userId: string) {
    setBusyId(userId);
    setError(null);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.push({ kind: 'success', title: 'User deleted' });
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
      toast.push({ kind: 'error', title: 'Delete failed', message: formatApiError(e) });
    } finally {
      setBusyId(null);
      setConfirm({ open: false });
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="spread">
        <div>
          <h1 style={{ margin: 0 }}>Admin · Users</h1>
          <div className="muted">Search, block/unblock, change roles, or delete users.</div>
        </div>
        <Link className="btn btn-ghost" to="/admin">
          Back
        </Link>
      </div>

      <ErrorBanner message={error} />

      <div className="card">
        <div className="spread" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="row" style={{ gap: '0.6rem' }}>
            <div className="muted">Users</div>
            <span className="pill">{items.length}</span>
          </div>
          <div className="row" style={{ gap: '0.5rem' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email or name…"
              style={{ width: 320, maxWidth: '75vw' }}
            />
            <button className="btn btn-ghost" onClick={() => setQuery('')} disabled={!query.trim()}>
              Clear
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="muted" style={{ marginTop: '0.75rem' }}>
            No users found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr className="muted">
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>User</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const busy = busyId === u.id;
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ fontWeight: 750 }}>{u.email}</div>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {u.firstName} {u.lastName}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span className={`badge ${u.role === 'admin' ? 'badge-info' : ''}`}>{u.role}</span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        {u.isBlocked ? (
                          <span className="badge badge-danger">blocked</span>
                        ) : (
                          <span className="badge badge-success">active</span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div className="row" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-ghost"
                            onClick={() => setRole(u, u.role === 'admin' ? 'customer' : 'admin')}
                            disabled={busy}
                            title="Toggle role"
                          >
                            {u.role === 'admin' ? 'Make customer' : 'Make admin'}
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => setBlocked(u, !u.isBlocked)}
                            disabled={busy}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => setConfirm({ open: true, user: u })}
                            disabled={busy}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm.open}
        title="Delete user?"
        danger
        loading={!!busyId && confirm.user?.id === busyId}
        message={
          <span>
            This will permanently delete <b>{confirm.user?.email}</b>.
          </span>
        }
        confirmText="Delete user"
        onClose={() => setConfirm({ open: false })}
        onConfirm={() => confirm.user && deleteUser(confirm.user.id)}
      />
    </div>
  );
}

