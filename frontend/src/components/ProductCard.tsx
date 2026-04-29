import { Link } from 'react-router-dom';

export interface ProductCardModel {
  id: string;
  slug: string;
  name: string;
  price: string;
  brand?: string;
  images?: string[];
  averageRating?: number;
}

export function ProductCard({ p }: { p: ProductCardModel }) {
  const img = p.images?.[0];
  return (
    <Link to={`/products/${p.slug}`} className="card" style={{ display: 'block' }}>
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
        <div
          className="muted"
          style={{
            height: 160,
            borderRadius: 10,
            display: 'grid',
            placeItems: 'center',
            border: '1px dashed rgba(255,255,255,0.12)',
            marginBottom: '0.75rem',
          }}
        >
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
      {typeof p.averageRating === 'number' && (
        <div className="muted" style={{ marginTop: '0.5rem', fontSize: 13 }}>
          ★ {p.averageRating.toFixed(1)}
        </div>
      )}
    </Link>
  );
}
