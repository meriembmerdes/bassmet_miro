import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';

export default function Wishlist() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await api.get('/wishlist');
    setItems(res.data.map((w: any) => w.product));
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

  async function remove(productId: string) {
    setError(null);
    try {
      await api.delete(`/wishlist/${productId}`);
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Wishlist</h1>
      <ErrorBanner message={error} />
      {items.length === 0 ? (
        <div className="card muted">
          Nothing saved yet. <Link to="/products">Browse products</Link>
        </div>
      ) : (
        <div className="grid cols-3">
          {items.map((p) => {
            const img = p.images?.[0];
            return (
              <div key={p.id} className="card">
                <Link to={`/products/${p.slug}`}>
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      style={{
                        width: '100%',
                        height: 160,
                        objectFit: 'cover',
                        borderRadius: 10,
                        marginBottom: '0.75rem',
                      }}
                    />
                  ) : (
                    <div className="muted" style={{ height: 160, display: 'grid', placeItems: 'center' }}>
                      No image
                    </div>
                  )}
                  <div className="spread" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 650 }}>{p.name}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {p.brand}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>${p.price}</div>
                  </div>
                </Link>
                <button
                  className="btn btn-danger"
                  type="button"
                  style={{ width: '100%', marginTop: '0.75rem' }}
                  onClick={() => remove(p.id)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
