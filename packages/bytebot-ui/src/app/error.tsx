'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>
          Something went wrong!
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.25rem' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}