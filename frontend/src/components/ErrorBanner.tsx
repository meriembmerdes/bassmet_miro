export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="card"
      style={{
        borderColor: 'rgba(248,113,113,0.35)',
        background: 'rgba(248,113,113,0.08)',
        marginBottom: '1rem',
      }}
    >
      {message}
    </div>
  );
}
