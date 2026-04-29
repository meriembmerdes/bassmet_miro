import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';

export default function Cart() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await api.get('/cart');
    setCart(res.data);
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

  async function updateQty(id: string, quantity: number) {
    setError(null);
    try {
      await api.patch(`/cart/items/${id}`, { quantity });
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api.delete(`/cart/items/${id}`);
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
    }
  }

  if (loading) return <Spinner />;

  const lines = cart?.items ?? [];
  const subtotal = lines.reduce(
    (sum: number, l: any) => sum + Number(l.product.price) * l.quantity,
    0,
  );

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Cart</h1>
      <ErrorBanner message={error} />
      {lines.length === 0 ? (
        <div className="card muted">Your cart is empty. <Link to="/products">Browse products</Link></div>
      ) : (
        <div className="grid" style={{ gap: '0.75rem' }}>
          {lines.map((l: any) => (
            <div key={l.id} className="card spread">
              <div>
                <div style={{ fontWeight: 700 }}>{l.product.name}</div>
                <div className="muted">${l.product.price} each</div>
              </div>
              <div className="row">
                <input
                  style={{ width: 90 }}
                  type="number"
                  min={1}
                  value={l.quantity}
                  onChange={(e) => updateQty(l.id, Math.max(1, Number(e.target.value)))}
                />
                <button className="btn btn-danger" type="button" onClick={() => remove(l.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="card spread">
            <div style={{ fontWeight: 800 }}>Subtotal</div>
            <div style={{ fontWeight: 800 }}>${subtotal.toFixed(2)}</div>
          </div>
          <Link className="btn" to="/checkout">
            Checkout
          </Link>
        </div>
      )}
    </div>
  );
}
