import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { ProductCard, type ProductCardModel } from '../components/ProductCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<ProductCardModel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      search: params.get('search') ?? '',
      minPrice: params.get('minPrice') ?? '',
      maxPrice: params.get('maxPrice') ?? '',
      minRating: params.get('minRating') ?? '',
      brand: params.get('brand') ?? '',
      size: params.get('size') ?? '',
      color: params.get('color') ?? '',
      sort: params.get('sort') ?? 'newest',
      page: params.get('page') ?? '1',
    }),
    [params],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/products', {
          params: {
            search: query.search || undefined,
            minPrice: query.minPrice ? Number(query.minPrice) : undefined,
            maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
            minRating: query.minRating ? Number(query.minRating) : undefined,
            brand: query.brand || undefined,
            size: query.size || undefined,
            color: query.color || undefined,
            sort: query.sort,
            page: Number(query.page),
          },
        });
        if (!cancelled) {
          setItems(res.data.data);
          setTotal(res.data.total);
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
  }, [query]);

  function setField(field: string, value: string, resetPage = true) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(field);
    else next.set(field, value);
    if (resetPage && field !== 'page') next.set('page', '1');
    setParams(next);
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Products</h1>
      <div className="grid cols-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <div className="grid" style={{ gap: '0.75rem' }}>
            <div className="field">
              <label>Search</label>
              <input
                value={query.search}
                onChange={(e) => setField('search', e.target.value)}
                placeholder="Name, brand…"
              />
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label>Min price</label>
                <input value={query.minPrice} onChange={(e) => setField('minPrice', e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Max price</label>
                <input value={query.maxPrice} onChange={(e) => setField('maxPrice', e.target.value)} />
              </div>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label>Min rating</label>
                <input
                  value={query.minRating}
                  onChange={(e) => setField('minRating', e.target.value)}
                  placeholder="0-5"
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Brand</label>
                <input value={query.brand} onChange={(e) => setField('brand', e.target.value)} />
              </div>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label>Size</label>
                <input value={query.size} onChange={(e) => setField('size', e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Color</label>
                <input value={query.color} onChange={(e) => setField('color', e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Sort</label>
              <select value={query.sort} onChange={(e) => setField('sort', e.target.value)}>
                <option value="newest">Newest</option>
                <option value="best_seller">Best seller</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card muted" style={{ alignSelf: 'start' }}>
          <div style={{ fontWeight: 650, color: 'var(--text)', marginBottom: '0.5rem' }}>
            Tips
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li>Password rules on register: upper, lower, and a number.</li>
            <li>Try coupon <b>SAVE10</b> at checkout (demo seed).</li>
          </ul>
        </div>
      </div>

      <ErrorBanner message={error} />
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="muted" style={{ marginBottom: '0.75rem' }}>
            {total} results
          </div>
          <div className="grid cols-3">
            {items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          <div className="row" style={{ marginTop: '1rem' }}>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={Number(query.page) <= 1}
              onClick={() => setField('page', String(Number(query.page) - 1), false)}
            >
              Prev
            </button>
            <span className="muted">Page {query.page}</span>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={Number(query.page) * 20 >= total}
              onClick={() => setField('page', String(Number(query.page) + 1), false)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
