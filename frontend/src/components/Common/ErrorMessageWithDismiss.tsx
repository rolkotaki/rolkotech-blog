interface ErrorMessageWithDismissProps {
  message: string;
  onDismiss: () => void;
}

function ErrorMessageWithDismiss({
  message,
  onDismiss,
}: ErrorMessageWithDismissProps) {
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-600">{message}</p>
      <button
        onClick={onDismiss}
        className="text-red-600 hover:text-red-800 text-sm underline mt-1"
      >
        Dismiss
      </button>
    </div>
  );
}

export default ErrorMessageWithDismiss;
