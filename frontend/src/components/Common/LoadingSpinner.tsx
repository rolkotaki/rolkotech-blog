interface LoadingSpinnerProps {
  text: string;
}

function LoadingSpinner({ text }: LoadingSpinnerProps) {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-gray-500">{text}</p>
    </div>
  );
}

export default LoadingSpinner;
