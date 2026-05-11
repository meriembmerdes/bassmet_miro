import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorBanner } from '../components/ErrorBanner';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';
import { useToast } from '../components/Toast';
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
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<{ open: boolean; product?: Product }>({
    open: false,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; product?: Product }>({
    open: false,
  });
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

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

  const [editForm, setEditForm] = useState({
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

  const editPayload = useMemo(() => {
    const payload: any = {
      name: editForm.name.trim(),
      price: Number(editForm.price),
      stock: Number(editForm.stock),
      isActive: editForm.isActive,
    };
    if (editForm.slug.trim()) payload.slug = editForm.slug.trim();
    if (editForm.description.trim()) payload.description = editForm.description.trim();
    if (editForm.compareAtPrice.trim() !== '')
      payload.compareAtPrice = Number(editForm.compareAtPrice);
    if (editForm.brand.trim()) payload.brand = editForm.brand.trim();
    if (editForm.sizes.trim()) payload.sizes = csvToList(editForm.sizes);
    if (editForm.colors.trim()) payload.colors = csvToList(editForm.colors);
    payload.images = editForm.images.trim() ? csvToList(editForm.images) : [];
    payload.categoryId = editForm.categoryId || null;
    return payload;
  }, [editForm]);

  async function refresh() {
    const prods = await api.get('/admin/products', {
      params: { limit: 80, page: 1, search: search.trim() || undefined },
    });
    setItems(prods.data?.data ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cats, prods] = await Promise.all([
          api.get('/categories'),
          api.get('/admin/products', { params: { limit: 80, page: 1 } }),
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

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      void (async () => {
        try {
          await refresh();
        } catch (e) {
          if (!cancelled) setError(formatApiError(e));
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
      toast.push({ kind: 'success', title: 'Product added', message: created.name });
    } catch (e2) {
      setError(formatApiError(e2));
      toast.push({ kind: 'error', title: 'Add failed', message: formatApiError(e2) });
    } finally {
      setSaving(false);
    }
  }

  async function openEdit(p: Product) {
    setError(null);
    setEditSaving(true);
    try {
      const full = await api.get(`/admin/products/${p.id}`);
      const fp = full.data as any;
      setEdit({ open: true, product: p });
      setEditForm({
        name: fp.name ?? p.name ?? '',
        slug: fp.slug ?? p.slug ?? '',
        description: fp.description ?? '',
        price: String(fp.price ?? p.price ?? ''),
        compareAtPrice: fp.compareAtPrice != null ? String(fp.compareAtPrice) : '',
        stock: String(fp.stock ?? p.stock ?? 0),
        brand: fp.brand ?? p.brand ?? '',
        sizes: Array.isArray(fp.sizes) ? fp.sizes.join(', ') : '',
        colors: Array.isArray(fp.colors) ? fp.colors.join(', ') : '',
        images: Array.isArray(fp.images) ? fp.images.join(', ') : (p.images ?? []).join(', '),
        categoryId: fp.category?.id ?? p.category?.id ?? '',
        isActive: fp.isActive ?? p.isActive ?? true,
      });
    } catch (e) {
      setError(formatApiError(e));
      toast.push({ kind: 'error', title: 'Could not load product', message: formatApiError(e) });
    } finally {
      setEditSaving(false);
    }
  }

  async function saveEdit() {
    if (!edit.product) return;
    setEditSaving(true);
    setError(null);
    try {
      await api.patch(`/admin/products/${edit.product.id}`, editPayload);
      toast.push({ kind: 'success', title: 'Product updated', message: editForm.name });
      setEdit({ open: false });
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
      toast.push({ kind: 'error', title: 'Update failed', message: formatApiError(e) });
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteProduct(productId: string) {
    setDeleteBusyId(productId);
    setError(null);
    try {
      await api.delete(`/admin/products/${productId}`);
      toast.push({ kind: 'success', title: 'Product deleted' });
      setConfirm({ open: false });
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
      toast.push({ kind: 'error', title: 'Delete failed', message: formatApiError(e) });
    } finally {
      setDeleteBusyId(null);
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
            <div>
              <h2 style={{ margin: 0 }}>Products</h2>
              <div className="muted" style={{ fontSize: 13 }}>
                Edit, update stock/images, or delete products.
              </div>
            </div>
            <div className="row" style={{ gap: '0.5rem', justifyContent: 'flex-end' }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                style={{ width: 220 }}
              />
              <span className="pill">{items.length}</span>
            </div>
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
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" type="button" onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => setConfirm({ open: true, product: p })}
                    >
                      Delete
                    </button>
                    <Link className="pill" to={`/products/${p.slug}`}>
                      view
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={edit.open}
        title={edit.product ? `Edit · ${edit.product.name}` : 'Edit product'}
        onClose={() => {
          if (!editSaving) setEdit({ open: false });
        }}
        size="lg"
        footer={
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" type="button" onClick={() => setEdit({ open: false })} disabled={editSaving}>
              Cancel
            </button>
            <button className="btn" type="button" onClick={saveEdit} disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        }
      >
        <div className="grid cols-2" style={{ gap: '0.75rem' }}>
          <div className="field">
            <label>Name</label>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Slug</label>
            <input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            rows={4}
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            placeholder="Details, materials, etc."
          />
        </div>
        <div className="grid cols-2" style={{ gap: '0.75rem' }}>
          <div className="field">
            <label>Price</label>
            <input inputMode="decimal" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
          </div>
          <div className="field">
            <label>Compare at price (optional)</label>
            <input
              inputMode="decimal"
              value={editForm.compareAtPrice}
              onChange={(e) => setEditForm({ ...editForm, compareAtPrice: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Stock</label>
            <input inputMode="numeric" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} />
          </div>
          <div className="field">
            <label>Brand</label>
            <input value={editForm.brand} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} />
          </div>
        </div>
        <div className="grid cols-2" style={{ gap: '0.75rem' }}>
          <div className="field">
            <label>Category</label>
            <select value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label className="row" style={{ gap: 10, alignItems: 'center', marginTop: 22 }}>
            <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
            <span>Active (visible in shop)</span>
          </label>
        </div>
        <div className="field">
          <label>Images URLs (comma separated)</label>
          <input
            value={editForm.images}
            onChange={(e) => setEditForm({ ...editForm, images: e.target.value })}
            placeholder="https://..., https://..."
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Delete product?"
        danger
        loading={!!deleteBusyId && confirm.product?.id === deleteBusyId}
        message={
          <span>
            This will permanently delete <b>{confirm.product?.name}</b>.
          </span>
        }
        confirmText="Delete product"
        onClose={() => setConfirm({ open: false })}
        onConfirm={() => confirm.product && deleteProduct(confirm.product.id)}
      />
    </div>
  );
}

