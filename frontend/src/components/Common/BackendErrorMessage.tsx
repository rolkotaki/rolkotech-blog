function BackendErrorMessage({ error }: { error: string }) {
  return (
    <>
      {error && (
        <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
    </>
  );
}

export default BackendErrorMessage;
