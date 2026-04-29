import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payInfo, setPayInfo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [o, t] = await Promise.all([
          api.get(`/orders/${id}`),
          api.get(`/orders/${id}/track`),
        ]);
        if (!cancelled) {
          setOrder(o.data);
          setTrack(t.data);
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
  }, [id]);

  async function pay() {
    if (!id) return;
    setBusy(true);
    setError(null);
    setPayInfo(null);
    try {
      const res = await api.post(`/orders/${id}/payment-intent`);
      setPayInfo(JSON.stringify(res.data, null, 2));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/orders/${id}/confirm-payment`);
      const o = await api.get(`/orders/${id}`);
      setOrder(o.data);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/orders/${id}/cancel`);
      navigate('/orders');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (!order) return <ErrorBanner message={error ?? 'Not found'} />;

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="spread">
        <h1 style={{ margin: 0 }}>Order</h1>
        <button className="btn btn-ghost" type="button" onClick={() => navigate('/orders')}>
          Back
        </button>
      </div>
      <ErrorBanner message={error} />
      <div className="card">
        <div className="spread">
          <div>
            <div className="muted">Status</div>
            <div style={{ fontWeight: 800 }}>{order.status}</div>
          </div>
          <div>
            <div className="muted">Total</div>
            <div style={{ fontWeight: 800 }}>${order.total}</div>
          </div>
        </div>
        <div className="muted" style={{ marginTop: '0.75rem' }}>
          Tracking: {track?.trackingNumber ?? '—'}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Items</h3>
        <div className="grid" style={{ gap: '0.5rem' }}>
          {order.items?.map((it: any) => (
            <div key={it.id} className="spread">
              <div>{it.title}</div>
              <div className="muted">
                {it.quantity} × ${it.unitPrice}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Payments (Stripe-ready)</h3>
        <p className="muted">
          Creates a PaymentIntent when Stripe is configured; otherwise returns a mock payload.
        </p>
        <div className="row">
          <button className="btn" type="button" disabled={busy} onClick={pay}>
            Create payment intent
          </button>
          <button className="btn btn-ghost" type="button" disabled={busy} onClick={confirm}>
            Mark paid (demo)
          </button>
          <button className="btn btn-danger" type="button" disabled={busy} onClick={cancel}>
            Cancel order
          </button>
        </div>
        {payInfo && (
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }} className="muted">
            {payInfo}
          </pre>
        )}
      </div>
    </div>
  );
}
