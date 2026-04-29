export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>
      {label}
    </div>
  );
}
