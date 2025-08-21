function PageLoadingError({ error }: { error: string }) {
  return (
    <div className="flex-grow flex flex-col container mx-auto justify-center items-center">
      <div className="text-lg text-red-600">{error}</div>
    </div>
  );
}

export default PageLoadingError;
