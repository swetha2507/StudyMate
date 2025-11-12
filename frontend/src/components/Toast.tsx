export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="toast" onClick={onClose} role="alert">
      {message}
    </div>
  );
}
