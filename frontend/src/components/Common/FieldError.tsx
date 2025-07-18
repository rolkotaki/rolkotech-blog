function FieldError({ error }: { error: string }) {
  return <>{error && <p className="text-red-600 text-xs mt-1">{error}</p>}</>;
}

export default FieldError;
