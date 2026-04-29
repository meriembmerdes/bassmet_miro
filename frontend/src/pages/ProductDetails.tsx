import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';
import { useAppSelector } from '../store/hooks';

export default function ProductDetails() {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const token = useAppSelector((s) => s.auth.token);
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slugOrId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/products/${slugOrId}`);
        if (!cancelled) setProduct(res.data);
        const rr = await api.get(`/products/${res.data.id}/reviews`);
        if (!cancelled) setReviews(rr.data);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  async function addToCart() {
    if (!token) return navigate('/login');
    if (!product) return;
    setBusy(true);
    setError(null);
    try {
      await api.post('/cart/items', { productId: product.id, quantity: qty });
      navigate('/cart');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggleWishlist() {
    if (!token) return navigate('/login');
    if (!product) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/wishlist/${product.id}`);
      navigate('/wishlist');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    if (!token) return navigate('/login');
    if (!product) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/products/${product.id}/reviews`, {
        rating: reviewRating,
        comment: reviewText || undefined,
      });
      const rr = await api.get(`/products/${product.id}/reviews`);
      setReviews(rr.data);
      setReviewText('');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (!product) return <ErrorBanner message={error ?? 'Not found'} />;

  const img = product.images?.[0];

  return (
    <div className="grid cols-2">
      <div>
        {img ? (
          <img
            src={img}
            alt=""
            style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}
          />
        ) : (
          <div className="card muted" style={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
            No image
          </div>
        )}
      </div>
      <div>
        <div className="pill">{product.category?.name}</div>
        <h1 style={{ margin: '0.5rem 0' }}>{product.name}</h1>
        <div className="muted" style={{ marginBottom: '0.75rem' }}>
          {product.brand} · ★ {Number(product.averageRating ?? 0).toFixed(1)}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: '0.75rem' }}>${product.price}</div>
        <p className="muted">{product.description}</p>

        <div className="row" style={{ marginTop: '1rem' }}>
          <div className="field" style={{ width: 120 }}>
            <label>Qty</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <button className="btn" type="button" disabled={busy} onClick={addToCart}>
            Add to cart
          </button>
          <button className="btn btn-ghost" type="button" disabled={busy} onClick={toggleWishlist}>
            Wishlist
          </button>
        </div>

        <ErrorBanner message={error} />

        <div className="card" style={{ marginTop: '1.25rem' }}>
          <h3 style={{ marginTop: 0 }}>Reviews</h3>
          {reviews.length === 0 ? (
            <div className="muted">No reviews yet.</div>
          ) : (
            <div className="grid" style={{ gap: '0.75rem' }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                  <div className="spread">
                    <div style={{ fontWeight: 650 }}>
                      {r.user?.firstName} {r.user?.lastName}
                    </div>
                    <div className="muted">★ {r.rating}</div>
                  </div>
                  <div className="muted">{r.comment}</div>
                </div>
              ))}
            </div>
          )}

          {token ? (
            <div style={{ marginTop: '1rem' }} className="grid">
              <div className="field">
                <label>Your rating</label>
                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Comment</label>
                <textarea rows={3} value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
              </div>
              <button className="btn" type="button" disabled={busy} onClick={submitReview}>
                Submit review
              </button>
            </div>
          ) : (
            <div className="muted" style={{ marginTop: '0.75rem' }}>
              Login to leave a review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
