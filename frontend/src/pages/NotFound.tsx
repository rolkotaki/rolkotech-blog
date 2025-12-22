function NotFound() {
  return (
    <main className="container mx-auto px-4 pt-6 max-w-3xl flex-grow text-center">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">
        404 - Page Not Found
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Go back home
      </a>
    </main>
  );
}

export default NotFound;
