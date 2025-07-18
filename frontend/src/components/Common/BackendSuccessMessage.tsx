function BackendSuccessMessage({ success }: { success: string }) {
  return (
    <>
      {success && (
        <div className="text-green-600 text-sm mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          {success}
        </div>
      )}
    </>
  );
}

export default BackendSuccessMessage;
