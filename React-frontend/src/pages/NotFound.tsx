import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="state-msg">
      <h1 className="page-title">404 — Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/">Back to Dashboard</Link>
    </div>
  );
}
