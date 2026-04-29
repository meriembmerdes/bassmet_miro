import { Link, NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: '0.35rem 0.55rem',
  borderRadius: 8,
  border: '1px solid transparent',
  color: isActive ? 'var(--text)' : 'var(--muted)',
  borderColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
  background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
});

export function Navbar() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(15,23,42,0.72)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="container spread" style={{ padding: '0.85rem 0' }}>
        <Link to="/" style={{ fontWeight: 700, letterSpacing: 0.2 }}>
          Bassmet Miro Shop
        </Link>
        <nav className="row" style={{ justifyContent: 'flex-end' }}>
          <NavLink to="/products" style={linkStyle}>
            Products
          </NavLink>
          {user ? (
            <>
              <NavLink to="/cart" style={linkStyle}>
                Cart
              </NavLink>
              <NavLink to="/wishlist" style={linkStyle}>
                Wishlist
              </NavLink>
              <NavLink to="/orders" style={linkStyle}>
                Orders
              </NavLink>
              <NavLink to="/profile" style={linkStyle}>
                Profile
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" style={linkStyle}>
                  Admin
                </NavLink>
              )}
              <button className="btn btn-ghost" type="button" onClick={() => dispatch(logout())}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" style={linkStyle}>
                Login
              </NavLink>
              <NavLink to="/register" style={linkStyle}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
