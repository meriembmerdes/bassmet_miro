import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '1.5rem 0 3rem' }}>
        <Outlet />
      </main>
      <footer className="container muted" style={{ paddingBottom: '2rem', fontSize: 14 }}>
      Bassmet Miro — Your trusted e-commerce destination.
      </footer>
    </>
  );
}
