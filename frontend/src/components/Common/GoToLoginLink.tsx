import { Link } from "react-router-dom";

function GoToLoginLink() {
  return (
    <>
      <p className="mt-4 text-sm text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}

export default GoToLoginLink;
