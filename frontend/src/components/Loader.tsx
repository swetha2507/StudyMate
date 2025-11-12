export default function Loader({ show }: { show: boolean }) {
  if (!show) return null;
  return <div className="loader" aria-label="Loading" />;
}
