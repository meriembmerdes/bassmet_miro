import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatApiError } from '../lib/errors';

type Category = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  brand?: string;
  images?: string[];
  isActive?: boolean;
  category?: { id: string; name: string } | null;
};

function csvToList(input: string) {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminProducts() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    compareAtPrice: '',
    stock: '',
    brand: '',
    sizes: '',
    colors: '',
    images: '',
    categoryId: '',
    isActive: true,
  });

  const createPayload = useMemo(() => {
    const payload: any = {
      name: form.name.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      isActive: form.isActive,
    };
    if (form.slug.trim()) payload.slug = form.slug.trim();
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.compareAtPrice.trim() !== '') payload.compareAtPrice = Number(form.compareAtPrice);
    if (form.brand.trim()) payload.brand = form.brand.trim();
    if (form.sizes.trim()) payload.sizes = csvToList(form.sizes);
    if (form.colors.trim()) payload.colors = csvToList(form.colors);
    if (form.images.trim()) payload.images = csvToList(form.images);
    if (form.categoryId) payload.categoryId = form.categoryId;
    return payload;
  }, [form]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cats, prods] = await Promise.all([
          api.get('/categories'),
          api.get('/products', { params: { sort: 'newest', limit: 50, page: 1 } }),
        ]);
        if (!cancelled) {
          setCategories(cats.data?.data ?? cats.data ?? []);
          setItems(prods.data?.data ?? []);
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setError(null);
    setSaving(true);
    try {
      const res = await api.post('/admin/products', createPayload);
      const created = res.data as Product;
      setItems((prev) => [created, ...prev]);
      setForm((f) => ({
        ...f,
        name: '',
        slug: '',
        description: '',
        price: '',
        compareAtPrice: '',
        stock: '',
        brand: '',
        sizes: '',
        colors: '',
        images: '',
        categoryId: '',
        isActive: true,
      }));
      setNotice('Product added.');
    } catch (e2) {
      setError(formatApiError(e2));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="spread">
        <div>
          <h1 style={{ margin: 0 }}>Admin · Products</h1>
          <div className="muted">Create products and they will appear in the catalog.</div>
        </div>
        <Link className="btn btn-ghost" to="/admin">
          Back
        </Link>
      </div>

      <ErrorBanner message={error} />
      {notice && <div className="card" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{notice}</div>}

      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <form className="card" onSubmit={onSubmit}>
          <h2 style={{ marginTop: 0 }}>Add product</h2>
          <div className="grid" style={{ gap: '0.75rem' }}>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="field">
              <label>Slug (optional)</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>

            <div className="field">
              <label>Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Details, materials, etc."
              />
            </div>

            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label>Price</label>
                <input
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 129.99"
                  required
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Compare at price (optional)</label>
                <input
                  inputMode="decimal"
                  value={form.compareAtPrice}
                  onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                  placeholder="e.g. 159.99"
                />
              </div>
            </div>

            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label>Stock</label>
                <input
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="e.g. 50"
                  required
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Brand</label>
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
            </div>

            <div className="field">
              <label>Category</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Sizes (comma separated)</label>
              <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L" />
            </div>
            <div className="field">
              <label>Colors (comma separated)</label>
              <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="black, white" />
            </div>
            <div className="field">
              <label>Images URLs (comma separated)</label>
              <input
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                placeholder="https://..., https://..."
              />
            </div>

            <label className="row" style={{ gap: 10, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <span>Active (visible in shop)</span>
            </label>

            <div className="row">
              <button className="btn" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add product'}
              </button>
            </div>
          </div>
        </form>

        <div className="card">
          <div className="spread" style={{ marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>Latest products</h2>
            <span className="pill">{items.length}</span>
          </div>
          {items.length === 0 ? (
            <div className="muted">No products</div>
          ) : (
            <div className="grid" style={{ gap: '0.5rem' }}>
              {items.map((p) => (
                <div key={p.id} className="spread" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                  <div>
                    <div style={{ fontWeight: 650 }}>
                      {p.name} {!p.isActive && <span className="pill">inactive</span>}
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      ${p.price} · stock {p.stock} {p.brand ? `· ${p.brand}` : ''} {p.category?.name ? `· ${p.category.name}` : ''}
                    </div>
                  </div>
                  <Link className="pill" to={`/products/${p.slug}`}>
                    view
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

