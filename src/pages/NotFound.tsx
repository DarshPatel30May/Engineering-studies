import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className="text-6xl font-bold text-emerald-600">404</div>
      <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-ink-500">That page does not exist. Use the menu or search (Ctrl K) to find a topic.</p>
      <Link to="/" className="btn btn-primary mt-4">Back to dashboard</Link>
    </div>
  );
}
