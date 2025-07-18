import { Link } from "react-router-dom";

function BackToHomeLink() {
  return (
    <>
      <p className="mt-4 text-sm text-center">
        <Link to="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </p>
    </>
  );
}

export default BackToHomeLink;
