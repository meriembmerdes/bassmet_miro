import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ProductCard, type ProductCardModel } from '../components/ProductCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';

export default function Home() {
  const [items, setItems] = useState<ProductCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/products', { params: { limit: 8, sort: 'best_seller' } });
        if (!cancelled) setItems(res.data.data);
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

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: '0.35rem' }}>
         Find What You Love, Shop With Confidence
      </div>
      <div className="muted" style={{ marginBottom: '1rem' }}>
        Explore top-quality products, great prices, and a smooth shopping experience designed just for you.
      </div>
        <div className="row">
          <Link className="btn" to="/products">
            Browse catalog
          </Link>
          <Link className="btn btn-ghost" to="/register">
            Create account
          </Link>
        </div>
      </div>

      <div className="spread" style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Trending</h2>
        <Link className="pill" to="/products">
          View all
        </Link>
      </div>
      <ErrorBanner message={error} />
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
