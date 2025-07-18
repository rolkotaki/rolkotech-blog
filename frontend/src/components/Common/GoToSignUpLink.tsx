import { Link } from "react-router-dom";

function GoToSignUpLink() {
  return (
    <>
      <p className="mt-4 text-sm text-center">
        Don't have an account?{" "}
        <Link to="/signup" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}

export default GoToSignUpLink;
